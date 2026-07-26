// GnuGo(WASM) 适配层 —— 把 emscripten 产物包成 GoAI。
//
// 关键事实（经 scripts 探针验证，见探针脚本与 probe2）：
//   - glue 是 CJS：exports.init = function(Module){...}; 末尾同步 run()。
//   - Module.wasmBinary 一旦提供，XHR/fetch 全跳过（见 glue 行 1472）。
//   - BINARYEN_ASYNC_COMPILATION=0：run() 同步完成，返回后 ccall 立即可用。
//   - ccall("play","string",["number","string"],[_, sgf]) 追加一手并返回整局 SGF；
//     color 参数被忽略，按 SGF 手数判侧。
//   - GnuGo 会往 stdout 喷 "white move F4" 噪声，用 Module.print 静音。
//
// 这里把 glue 当字符串(?raw)读进来、在受控沙箱里求值 —— Vite 不会去解析它的
// require("fs")/__dirname（浏览器侧本就走不到那些分支），也保持 glue 文件纯净便于归属。

import glueSrc from "./wasm/gnugo.glue.js?raw";
import { GNUGO_WASM_B64 } from "./wasm/gnugoWasm";
import { base64ToBytes } from "../wasm";
import { extractLastMove, historyToSgf, sgfToIndex } from "./sgf";
import type { AIMove, GoAI } from "../types";
import type { GameState } from "../../go/types";

let sessionPromise: Promise<GnuGoSession> | null = null;

interface GnuGoModule {
  ccall: (
    ident: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => unknown;
}

// 把 emscripten glue 装进沙箱，喂入预解码的 wasm 字节，返回可用的 session。
function bootGnuGo(): Promise<GnuGoSession> {
  return new Promise((resolve, reject) => {
    try {
      const Module: Record<string, unknown> = {
        wasmBinary: base64ToBytes(GNUGO_WASM_B64),
        // 静音 GnuGo 的 stdout 噪声（"white move F4" 之类）
        print: () => {},
        printErr: () => {},
        noInitialRun: false,
        // 防止 glue 试图写 status 等
        setStatus: () => {},
      };

      const mod = { exports: {} as Record<string, unknown> };
      const requireShim = (name: string) => {
        throw new Error(
          `GnuGo glue 在浏览器侧不应调用 require(${name})；该分支由 ENVIRONMENT_IS_NODE 守卫，正常不会触达。`
        );
      };

      const factory = new Function(
        "module",
        "exports",
        "require",
        "Module",
        "__dirname",
        "__filename",
        glueSrc + "\n;return module.exports;"
      );
      const glue = factory(
        mod,
        mod.exports,
        requireShim,
        Module,
        "/",
        "/gnugo.js"
      ) as { init: (m: Record<string, unknown>) => void };

      glue.init(Module);
      const ccall = (Module as unknown as { ccall?: GnuGoModule["ccall"] }).ccall;
      if (typeof ccall !== "function") {
        throw new Error("GnuGo 启动后未找到 ccall");
      }
      resolve(new GnuGoSession(ccall));
    } catch (e) {
      reject(e);
    }
  });
}

class GnuGoSession {
  constructor(private readonly ccall: GnuGoModule["ccall"]) {}

  version(): string {
    return String(this.ccall("get_version", "string", [], []));
  }

  // 传入完整 SGF，返回 GnuGo 新生成那一手的 SGF 坐标（"ee"），虚手返回 null。
  genMoveSgf(sgf: string): string | null {
    try {
      const out = String(this.ccall("play", "string", ["number", "string"], [0, sgf]));
      return extractLastMove(out);
    } catch (e) {
      // 浏览器 Web Worker 的 JS 原生调用栈远小于 Node；GnuGo 在复杂局面下的深层
      // 读秒（owl/征子等，经 emscripten dynCall_* 跳板跨越 WASM↔JS）会把它耗尽，
      // 抛 RangeError。本产物未导出降低读秒深度的接口，worker 栈也无法扩大，故
      // 按"AI 无法判断"等同虚手——对局继续推进（与 useGoGame 防死锁策略一致），
      // 避免硬报错卡死在 AI 回合。下次喂入完整 SGF 会重建局面，不会残留坏状态。
      if (e instanceof RangeError) return null;
      throw e;
    }
  }
}

export async function getGnuGo(): Promise<GnuGoSession> {
  if (!sessionPromise) {
    // 失败时清空缓存，允许后续重试——否则一次启动失败会让 AI 在整页生命周期内
    // 永远拿到同一个 rejected promise（如 wasm 解码失败、CSP 拦截 new Function）。
    sessionPromise = bootGnuGo().catch((e) => {
      sessionPromise = null;
      throw e;
    });
  }
  return sessionPromise;
}

// GoAI 实现：序列化 GameState -> SGF -> 喂 GnuGo -> 解析回一维下标。
export const gnugoAI: GoAI = {
  async genmove(state: GameState): Promise<AIMove> {
    const session = await getGnuGo();
    const sgf = historyToSgf(state);
    const sgfCoord = session.genMoveSgf(sgf);
    if (sgfCoord === null) return null; // GnuGo 虚手
    return sgfToIndex(sgfCoord, state.size);
  },
  setSize() {
    // GnuGo 每次按 SGF 头里的 SZ[] 重新识别棋盘，无需复用内部状态。
  },
};
