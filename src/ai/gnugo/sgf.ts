// SGF 坐标与棋谱序列化（GnuGo 这个 WASM 产物走 SGF 进出，不是 GTP）。
//
// SGF 坐标事实（经 probe 验证）：
//   - 小写字母 a-s（a=0 ... s=18），不跳过 i；
//   - 两字母：第 1 个 = 列(x)，第 2 个 = 行(y)；原点左上，y 向下；
//   - 与本库 i = y*size + x 完全一致 → 转换近乎零成本；
//   - 虚手在 SGF 里写作 B[] / W[]（空括号）。
//
// 另：probe 确认 GnuGo 的 play(color, sgf) 忽略 color，按 SGF 手数自行判断该谁下，
// 所以序列化时只要把完整 stone history 交替成 B/W 即可。

import { GameState, BLACK, EMPTY } from "../../go/types";

const SGF_LETTERS = "abcdefghijklmnopqrs";

// 一维下标 -> SGF 坐标（如 "ee"）。注意：仅 size<=19 时合法。
export function indexToSgf(i: number, size: number): string {
  const x = i % size;
  const y = Math.floor(i / size);
  return SGF_LETTERS[x] + SGF_LETTERS[y];
}

// SGF 坐标 -> 一维下标。空串/不合法返回 null（视为虚手）。
export function sgfToIndex(s: string, size: number): number | null {
  if (!s || s.length < 2) return null;
  const x = SGF_LETTERS.indexOf(s[0]);
  const y = SGF_LETTERS.indexOf(s[1]);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return y * size + x;
}

// 把本库 GameState 序列化成 GnuGo 能吃下的 SGF。
// history 已记录完整动作（落子 + 虚手），按黑先交替成 B/W；虚手输出空括号 B[]/W[]。
// 颜色始终与动作序号对齐，中途虚手不会让后续落子错色（早期版本的历史遗留问题已修复）。
export function historyToSgf(state: GameState): string {
  const { size, komi, history } = state;
  const head = `(;GM[1]FF[4]SZ[${size}]KM[${komi}]`;
  let body = "";
  let blackNext = true;
  for (const action of history) {
    if (action.type === "pass") {
      body += `;${blackNext ? "B" : "W"}[]`;
    } else {
      body += `;${blackNext ? "B" : "W"}[${indexToSgf(action.index, size)}]`;
    }
    blackNext = !blackNext;
  }
  return `${head}${body})`;
}

// 从 GnuGo 返回的 SGF 中抽取最后一手（即它刚生成的那手）。
// 返回 SGF 坐标（如 "ee"），空括号(虚手)返回 null。
export function extractLastMove(sgf: string): string | null {
  const matches = [...sgf.matchAll(/;([BW])\[([a-s]*)\]/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const coord = last[2];
  return coord && coord.length >= 2 ? coord : null;
}

// 仅用于调试/测试时把棋盘可视化成 SGF 片段（非 GnuGo 调用路径）。
export function boardDump(state: GameState): string {
  const { size, board } = state;
  let s = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = board[y * size + x];
      s += c === EMPTY ? "." : c === BLACK ? "X" : "O";
    }
    s += "\n";
  }
  return s;
}
