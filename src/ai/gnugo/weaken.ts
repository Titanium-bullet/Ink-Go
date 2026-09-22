// GnuGo 难度弱化 —— 概率性把 GnuGo 的手替换为"合理缓手"。
// GnuGo 的等级被 wasm 编译期固定且无导出可调（见 gnugo.ts 文件头），
// weak/medium 的强度差由此实现。
//
// 缓手质量要求：看着像"人下的松着"，而不是乱下——
//   - 合法、不填自己的真眼（保持基本棋感）
//   - 不送吃（落子后己组 ≥2 气，含提子所得）
//   - 贴近战场（周围两格内有子）
//   - 加权偏向接触作战（贴对方子），开局阶段重罚一、二线
import { getGroup, isLegal, neighbors, playMove } from "../../go/engine";
import { EMPTY, GameState, opponent } from "../../go/types";
import type { AIDifficulty } from "../types";
import type { AIMove } from "../types";

const WEAKEN_PROB: Record<AIDifficulty, number> = {
  weak: 0.35,
  medium: 0.08,
  strong: 0,
};

// i 是否为 turn 方的真眼（四邻全己方，对角几乎无敌子）——随机手不填自己的眼。
function isOwnEye(state: GameState, i: number): boolean {
  const { size, board } = state;
  const color = state.turn;
  const x = i % size;
  const y = Math.floor(i / size);
  for (const n of neighbors(i, size)) {
    if (board[n] !== color) return false;
  }
  let enemyDiag = 0;
  let diagCount = 0;
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
    diagCount++;
    if (board[ny * size + nx] === opponent(color)) enemyDiag++;
  }
  // 角/边允许 0 个敌对角，中腹允许 1 个（经典真眼判定）
  const onEdge = diagCount < 4;
  return onEdge ? enemyDiag === 0 : enemyDiag <= 1;
}

// 落子后己组只剩一口气（含提子后的气）＝ 送吃，剔除。
function isSelfAtari(state: GameState, i: number): boolean {
  const res = playMove(state, i);
  if (!res.ok) return true;
  const g = getGroup(res.state.board, i, res.state.size);
  return g.liberties.size <= 1;
}

// 周围两格内（切比雪夫距离）是否有棋子——让随机手贴近战场。
function hasStoneNearby(state: GameState, i: number, radius: number): boolean {
  const { size, board } = state;
  const x = i % size;
  const y = Math.floor(i / size);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (board[ny * size + nx] !== EMPTY) return true;
    }
  }
  return false;
}

// 缓手权重：贴到对方子的接触手更像有意图的松着；开局一、二线重罚。
function candidateWeight(state: GameState, i: number): number {
  const { size, board } = state;
  const x = i % size;
  const y = Math.floor(i / size);
  const foe = opponent(state.turn);
  let w = 1;
  for (const n of neighbors(i, size)) {
    if (board[n] === foe) {
      w += 2;
      break;
    }
  }
  const line = Math.min(x, y, size - 1 - x, size - 1 - y);
  if (state.moveNumber < 24) {
    if (line === 0) w = 0.05;
    else if (line === 1) w *= 0.35;
  }
  return w;
}

function randomPlausibleMove(state: GameState): AIMove {
  const scored: { i: number; w: number }[] = [];
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== EMPTY) continue;
    if (!isLegal(state, i).legal) continue;
    if (isOwnEye(state, i)) continue;
    if (isSelfAtari(state, i)) continue;
    if (!hasStoneNearby(state, i, 2)) continue;
    scored.push({ i, w: candidateWeight(state, i) });
  }
  if (scored.length === 0) return null;
  let total = 0;
  for (const s of scored) total += s.w;
  let r = Math.random() * total;
  for (const s of scored) {
    r -= s.w;
    if (r <= 0) return s.i;
  }
  return scored[scored.length - 1].i;
}

export function weakenMove(
  move: AIMove,
  state: GameState,
  difficulty: AIDifficulty
): AIMove {
  if (Math.random() >= WEAKEN_PROB[difficulty]) return move;
  const alt = randomPlausibleMove(state);
  return alt ?? move;
}
