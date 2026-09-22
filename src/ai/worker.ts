// AI Web Worker —— GnuGo(WASM) 在此执行，避免阻塞棋盘。
//
// 设计：主线程发 AIRequest（带 id），Worker 算完后回 AIResponse（同 id）。
// 按 type 路由到 GnuGo（自研 MCTS 暂缓）。
//
// 关于 self 类型：本文件不引入 WebWorker lib（避免与全局 DOM lib 的全局符号
// 冲突），而是用一个局部 post() 帮助函数做受控投递，消息体本身严格类型化。

import { gnugoAI } from "./gnugo/gnugo";
import type { AIDifficulty } from "./types";
import type { GameState } from "../go/types";

// ---- 主线程 -> Worker ----
export type AIRequest =
  | { id: number; type: "ping" }
  | {
      id: number;
      type: "genmove";
      engine: "gnugo";
      state: GameState;
      difficulty?: AIDifficulty;
    }
  | { id: number; type: "estimate"; engine: "gnugo"; state: GameState };

// ---- Worker -> 主线程 ----
export type AIResponse =
  | { id: number; type: "pong" }
  | { id: number; type: "genmove"; move: number | null }
  | { id: number; type: "estimate"; score: number | null }
  | { id: number; type: "error"; message: string };

const post = (msg: AIResponse) =>
  (self as unknown as { postMessage: (m: AIResponse) => void }).postMessage(msg);

self.onmessage = async (e: MessageEvent<AIRequest>) => {
  const req = e.data;
  if (!req || typeof req.id !== "number") return;
  const { id } = req;
  try {
    switch (req.type) {
      case "ping": {
        post({ id, type: "pong" });
        return;
      }
      case "genmove": {
        // engine 目前只有 "gnugo"。后续若加 mcts，在此分支按 engine 字段路由。
        const move = await gnugoAI.genmove(req.state, {
          difficulty: req.difficulty,
        });
        post({ id, type: "genmove", move });
        return;
      }
      case "estimate": {
        const score = await gnugoAI.estimate(req.state);
        post({ id, type: "estimate", score });
        return;
      }
      default: {
        post({ id, type: "error", message: "unknown request type" });
      }
    }
  } catch (err) {
    post({ id, type: "error", message: String(err) });
  }
};
