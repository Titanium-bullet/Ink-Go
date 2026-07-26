// 9路 人机全盘仿真 —— 用真实 engine + 真实 GnuGo 跑一整局，定位"分不了胜负"的根因。
// 检测：GnuGo 回手在我方引擎是否合法（死锁源头）、对局能否终局、计分是否正常。
// 运行：npx tsx scripts/gnugo-sim.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { createGame, isLegal, playMove, pass as enginePass, finalScore } from "../src/go/engine";
import type { GameState } from "../src/go/types";
import { historyToSgf, sgfToIndex } from "../src/ai/gnugo/sgf";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const glueSrc = readFileSync(resolve(ROOT, "src/ai/gnugo/wasm/gnugo.glue.js"), "utf8");
const wasmBytes = readFileSync(resolve(ROOT, "src/ai/gnugo/wasm/gnugo.wasm"));
const Module: Record<string, unknown> = { wasmBinary: wasmBytes, print: () => {}, printErr: () => {}, setStatus: () => {} };
const mod = { exports: {} as Record<string, unknown> };
const glue = new Function("module","exports","require","Module","__dirname","__filename",
  glueSrc + "\n;return module.exports;")(mod, mod.exports, require, Module, "/", "/gnugo.js");
glue.init(Module);
const ccall = (Module as unknown as { ccall: (n: string, r: string, a: string[], v: unknown[]) => unknown }).ccall;

function gnugoMove(state: GameState): number | null {
  const sgf = historyToSgf(state);
  const out = String(ccall("play", "string", ["number", "string"], [0, sgf]));
  const ms = [...out.matchAll(/;([BW])\[([a-s]*)\]/g)];
  if (!ms.length) return null;
  const coord = ms[ms.length - 1][2];
  return coord && coord.length >= 2 ? sgfToIndex(coord, state.size) : null;
}

// “人”策略：从天元向外螺旋找第一个合法点；找不到就虚手。
function humanMove(state: GameState): number | null {
  const size = state.size;
  const cx = (size - 1) / 2, cy = (size - 1) / 2;
  const ordered: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = Math.round(cx + dx), y = Math.round(cy + dy);
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      ordered.push(y * size + x);
    }
  }
  for (const i of ordered) {
    if (state.board[i] === 0 && isLegal(state, i).legal) return i;
  }
  return null; // 无处可下 -> 虚手
}

const SIZE = 9;
const MAX_PLIES = 200;
// “人”在前若干手正常下，之后一直虚手（模拟真实玩家认为终局了）。
const HUMAN_PLAY_UNTIL = 40; // 人下到第 40 手（人方手数）后改虚手

let st: GameState = createGame(SIZE, 6.5);
let illegalCount = 0;
let aiMoves = 0;
let humanPlies = 0;
let humanPasses = 0;

console.log(`仿真：${SIZE}路，GnuGo 执黑先手，人执白。人下满 ${HUMAN_PLAY_UNTIL} 手后一直虚手。\n`);

for (let ply = 0; ply < MAX_PLIES; ply++) {
  if (st.finished) break;
  const isGnuGo = ply % 2 === 0; // 黑=GnuGo，白=人

  let move: number | null;
  if (isGnuGo) {
    move = gnugoMove(st);
    aiMoves++;
    if (move !== null) {
      const chk = isLegal(st, move);
      if (!chk.legal) {
        illegalCount++;
        console.log(`★ [ply${ply}] GnuGo 回手 idx=${move} 非法：${chk.reason} (ko=${st.koPoint})`);
        break;
      }
    }
  } else {
    // 人的回合
    if (humanPlies >= HUMAN_PLAY_UNTIL) {
      move = null; // 一直虚手
    } else {
      move = humanMove(st);
      if (move === null) move = null;
      humanPlies++;
    }
  }

  if (move === null) {
    if (!isGnuGo) humanPasses++;
    const r = enginePass(st);
    if (r.ok) st = r.state;
    console.log(`ply${ply} ${isGnuGo ? "GnuGo" : "人"} 虚手 (consec=${st.consecutivePasses})`);
  } else {
    const r = playMove(st, move);
    if (!r.ok) { console.log(`★ playMove 失败 ply${ply}: ${r.reason}`); break; }
    st = r.state;
  }
  if (st.finished) { console.log(`>> 第 ${ply + 1} ply 终局`); break; }
}

console.log(`\n总手数=${st.moveNumber}, AI手=${aiMoves}, 非法=${illegalCount}, 人虚手次数=${humanPasses}`);
console.log(`finished=${st.finished}, consecPass=${st.consecutivePasses}`);
if (st.finished) {
  const sc = finalScore(st);
  console.log("计分:", sc.reason);
} else {
  console.log("⚠ 未终局");
}
