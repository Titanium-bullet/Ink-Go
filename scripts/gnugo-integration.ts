// GnuGo 实走集成测试 —— 启动真实 wasm，端到端验证适配层逻辑。
// 复用 src/ai/gnugo/sgf.ts 的真实转换 + src/go/engine 的合法性判定。
//
// 注意：gnugo.ts 里用 `./wasm/gnugo.glue.js?raw` 是 Vite 专属，tsx 解析不了，
// 所以这里从磁盘读 glue/wasm，沙箱逻辑与 gnugo.ts::bootGnuGo 保持一致。
// 运行：npx tsx scripts/gnugo-integration.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { createGame, isLegal, playMove } from "../src/go/engine";
import type { GameState } from "../src/go/types";
import { historyToSgf, sgfToIndex } from "../src/ai/gnugo/sgf";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

// ---- 启动 GnuGo（沙箱，等价于 gnugo.ts::bootGnuGo）----
function bootGnuGo() {
  const glueSrc = readFileSync(
    resolve(ROOT, "src/ai/gnugo/wasm/gnugo.glue.js"),
    "utf8"
  );
  const wasmBytes = readFileSync(
    resolve(ROOT, "src/ai/gnugo/wasm/gnugo.wasm")
  );
  const Module: Record<string, unknown> = {
    wasmBinary: wasmBytes,
    print: () => {},
    printErr: () => {},
    setStatus: () => {},
  };
  const mod = { exports: {} as Record<string, unknown> };
  const factory = new Function(
    "module", "exports", "require", "Module", "__dirname", "__filename",
    glueSrc + "\n;return module.exports;"
  );
  const glue = factory(mod, mod.exports, require, Module, "/", "/gnugo.js") as {
    init: (m: Record<string, unknown>) => void;
  };
  glue.init(Module);
  const ccall = (Module as unknown as {
    ccall: (n: string, r: string, a: string[], v: unknown[]) => unknown;
  }).ccall;
  if (typeof ccall !== "function") throw new Error("ccall missing after init");
  return ccall;
}

type CCall = ReturnType<typeof bootGnuGo>;

// 等价于 gnugo.ts 的 genmove：序列化 -> play -> 解析最后一手 -> 下标
function genmove(ccall: CCall, state: GameState): number | null {
  const sgf = historyToSgf(state);
  const out = String(ccall("play", "string", ["number", "string"], [0, sgf]));
  const matches = [...out.matchAll(/;([BW])\[([a-s]*)\]/g)];
  if (matches.length === 0) return null;
  const coord = matches[matches.length - 1][2];
  if (!coord || coord.length < 2) return null; // 虚手
  return sgfToIndex(coord, state.size);
}

console.log("启动 GnuGo wasm（首次编译需数秒）…");
const t0 = Date.now();
const ccall = bootGnuGo();
console.log(`  启动耗时 ${Date.now() - t0}ms`);
const ver = String(ccall("get_version", "string", [], []));
console.log("  GnuGo 版本:", ver);

console.log("\n[1] 各棋盘首手：合法且落在空点");
for (const size of [9, 13, 19]) {
  const g = createGame(size, 6.5);
  const move = genmove(ccall, g);
  if (move === null) {
    assert(false, `${size}路首手不应虚手`);
    continue;
  }
  const check = isLegal(g, move);
  assert(check.legal, `${size}路首手 idx=${move} 在我方引擎合法 (${check.reason ?? "ok"})`);
}

console.log("\n[2] 9路连续对弈 8 手（我黑 GnuGo白 交替），逐手验合法");
{
  let st: GameState = createGame(9, 6.5);
  let okMoves = 0;
  for (let ply = 0; ply < 8; ply++) {
    let move: number;
    if (ply % 2 === 0) {
      // 我方（黑）：随便挑第一个合法点
      move = st.board.findIndex((c) => c === 0 && isLegal(st, st.board.indexOf(c)).legal);
      // 上面写法不严谨，直接取天元附近第一个空合法点
      let found = -1;
      for (let i = 0; i < st.board.length; i++) {
        if (st.board[i] === 0 && isLegal(st, i).legal) { found = i; break; }
      }
      if (found < 0) break;
      move = found;
    } else {
      // GnuGo（白）
      const ai = genmove(ccall, st);
      if (ai === null) { console.log("  GnuGo 虚手，结束"); break; }
      move = ai;
    }
    const check = isLegal(st, move);
    if (!check.legal) {
      assert(false, `ply${ply} idx=${move} 不合法: ${check.reason}`);
      break;
    }
    const r = playMove(st, move);
    if (!r.ok) { assert(false, `ply${ply} playMove 失败`); break; }
    st = r.state;
    okMoves++;
  }
  assert(okMoves >= 6, `9路至少完成 6 手合法对弈（实际 ${okMoves}）`);
}

console.log("\n[3] 喂入已有局面，GnuGo 应手合法");
{
  // 9路：黑天元 白应一手 之后让 GnuGo（黑）下第3手
  let st: GameState = createGame(9, 6.5);
  for (const m of [40, 50]) {
    const r = playMove(st, m);
    if (r.ok) st = r.state;
  }
  const ai = genmove(ccall, st);
  if (ai !== null) {
    const check = isLegal(st, ai);
    assert(check.legal, `喂入2手后 GnuGo 应手 idx=${ai} 合法`);
  } else {
    assert(false, "GnuGo 此时不该虚手");
  }
}

if (failures === 0) {
  console.log("\n=== GNUGO INTEGRATION PASSED ===\n");
} else {
  console.error(`\n=== ${failures} TEST(S) FAILED ===\n`);
  process.exit(1);
}
