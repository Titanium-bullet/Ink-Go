// React 侧的 Worker 通信封装。
//
// 通过 Vite 的 ?worker&inline 导入：worker 被打包成 base64 blob 内联进主包，
// 不产生单独文件 —— 这是 singlefile 打包成立的关键。Worker 内部再用同样的
// base64 方式加载 GnuGo wasm，整条链路都不依赖外部文件。

import { useCallback, useEffect, useRef, useState } from "react";
import AIWorker from "./worker.ts?worker&inline";
import type { AIRequest, AIResponse } from "./worker";
import type { AIDifficulty } from "./types";
import type { GameState } from "../go/types";

export function useAI() {
  const workerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const pendingRef = useRef<Map<number, (res: AIResponse) => void>>(new Map());
  const [workerError, setWorkerError] = useState<string | null>(null);

  const spawn = useCallback((): Worker => {
    const worker = new AIWorker();
    worker.onmessage = (e: MessageEvent<AIResponse>) => {
      const res = e.data;
      const resolve = pendingRef.current.get(res.id);
      if (resolve) {
        pendingRef.current.delete(res.id);
        resolve(res);
      }
    };
    worker.onerror = (e) => {
      setWorkerError(e.message || "worker error");
      // 把所有在途的 promise reject 掉，避免调用方永久 pending（棋盘锁死 + 内存泄漏）
      for (const [id, resolve] of pendingRef.current) {
        pendingRef.current.delete(id);
        resolve({ id, type: "error", message: e.message || "worker crashed" });
      }
    };
    return worker;
  }, []);

  useEffect(() => {
    workerRef.current = spawn();
    return () => {
      // 卸载前同样 reject 在途请求；terminate 后 worker 不再回包。
      for (const [id, resolve] of pendingRef.current) {
        pendingRef.current.delete(id);
        resolve({ id, type: "error", message: "worker terminated" });
      }
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [spawn]);

  // 超时：worker 万一卡死（不崩溃也不回包），不能让棋盘永久锁定在 AI 回合。
  // 默认 15s——GnuGo 中盘正常 1-3s，复杂征子/读秒留足余量。
  // 超时不仅 reject：同步卡死的 GnuGo 调用会永久占住单线程 worker，之后的
  // 请求只能排队等死。因此 terminate 后立即重建一个新 worker。
  const send = useCallback(
    <T extends AIResponse>(req: AIRequest, timeoutMs = 15000): Promise<T> => {
      const worker = workerRef.current;
      if (!worker) return Promise.reject(new Error("worker not ready"));
      const id = ++seqRef.current;
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingRef.current.delete(id);
          worker.terminate();
          if (workerRef.current === worker) {
            workerRef.current = spawn();
          }
          reject(new Error(`AI 请求超时 (${timeoutMs}ms)`));
        }, timeoutMs);
        pendingRef.current.set(id, (res) => {
          clearTimeout(timer);
          if (res.type === "error") reject(new Error(res.message));
          else resolve(res as T);
        });
        worker.postMessage({ ...req, id });
      });
    },
    [spawn]
  );

  // GnuGo 走子：把当前局面发到 worker，取回一维下标（null=虚手）。
  const genmove = useCallback(
    (state: GameState, difficulty?: AIDifficulty) =>
      send<{ id: number; type: "genmove"; move: number | null }>({
        id: 0,
        type: "genmove",
        engine: "gnugo",
        state,
        difficulty,
      }).then((r) => r.move),
    [send]
  );

  // 终局比分估算（正=白领先/负=黑领先）。用于死子标记阶段的参考比分。
  const estimate = useCallback(
    (state: GameState) =>
      send<{ id: number; type: "estimate"; score: number | null }>({
        id: 0,
        type: "estimate",
        engine: "gnugo",
        state,
      })
        .then((r) => r.score)
        .catch(() => null),
    [send]
  );

  // 清除一次性 worker 错误：worker 崩一次后 workerError 会永久挂着，
  // 调用方（useGoGame）在新局 / 下次 genmove 时调用以避免红色提示常驻。
  const clearError = useCallback(() => setWorkerError(null), []);

  return { genmove, estimate, workerError, clearError };
}
