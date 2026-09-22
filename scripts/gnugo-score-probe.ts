// GnuGo `_score` 导出探针 —— 实测 load_and_score_sgf_file 的返回格式，
// 判断能否从中解析死子/领地估算用于终局自动预标记。
// 运行：npx tsx scripts/gnugo-score-probe.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { createGame, pass, playMove } from "../src/go/engine";
import type { GameState } from "../src/go/types";
import { historyToSgf } from "../src/ai/gnugo/sgf";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

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
    print: (s: string) => console.log("    [stdout]", s),
    printErr: (s: string) => console.log("    [stderr]", s),
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
  return (Module as unknown as {
    ccall: (n: string, r: string, a: string[], v: unknown[]) => unknown;
  }).ccall;
}

// 9 路：白 (4,4) 一子被黑三面围住仅剩 (4,5) 一口气——典型死子。
// 其余白子下在边角凑交替。两次虚着结束。
function buildDeadStoneGame(): GameState {
  let st = createGame(9, 6.5);
  const seq = [31, 40, 39, 0, 41, 9]; // B(4,3) W(4,4) B(3,4) W(0,0) B(5,4) W(0,1)
  for (const i of seq) {
    const r = playMove(st, i);
    if (!r.ok) throw new Error(`move ${i} failed: ${r.reason}`);
    st = r.state;
  }
  for (let k = 0; k < 2; k++) {
    const r = pass(st);
    if (!r.ok) throw new Error("pass failed");
    st = r.state;
  }
  return st;
}

console.log("启动 GnuGo wasm…");
const ccall = bootGnuGo();
console.log("版本:", String(ccall("get_version", "string", [], [])));

const st = buildDeadStoneGame();
const sgf = historyToSgf(st);
console.log("\n输入 SGF:\n", sgf);

console.log("\n调用 ccall(\"score\")，原始返回：");
const out = String(ccall("score", "string", ["number", "string"], [0, sgf]));
console.log(out);

// GnuGo 终局 SGF 常见死子标记形态（若上游写出了这些属性，即可自动预标记）
const dd = [...out.matchAll(/DD\[([a-s]*)\]/g)].map((m) => m[1]);
const tb = [...out.matchAll(/TB\[([a-s]*)\]/g)].map((m) => m[1]);
const tw = [...out.matchAll(/TW\[([a-s]*)\]/g)].map((m) => m[1]);
const re = out.match(/RE\[([^\]]*)\]/)?.[1];
console.log("\n解析：DD(死子)=", dd, " TB(黑地)=", tb, " TW(白地)=", tw, " RE=", re);
