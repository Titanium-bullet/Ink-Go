import { BLACK, Color, EMPTY, GameState, Score, WHITE } from "./types";
import { neighbors } from "./board";

function regionTouches(board: Color[], start: number, size: number): {
  region: number[];
  borders: Set<Color>;
} {
  const region: number[] = [];
  const borders = new Set<Color>();
  const visited = new Set<number>([start]);
  const queue = [start];
  // 游标代替 shift()：BFS 出队 O(1)，整块 flood fill 线性。
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    region.push(i);
    for (const n of neighbors(i, size)) {
      if (board[n] === EMPTY) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      } else {
        borders.add(board[n]);
      }
    }
  }
  return { region, borders };
}

// 面积数子（中国规则风格）。死子在计分前从盘面移除：既不计作存子，
// 其占点也随所在空区划归围住它的活棋一方。
export function scoreArea(state: GameState): Score {
  const { size, board, komi } = state;
  const dead = new Set(state.deadStones);
  const eff = dead.size
    ? board.map((c, i) => (dead.has(i) ? EMPTY : c))
    : board;

  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;
  let deadBlack = 0;
  let deadWhite = 0;

  const visited = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) continue;
    if (dead.has(i)) {
      if (board[i] === BLACK) deadBlack++;
      else deadWhite++;
    } else if (board[i] === BLACK) blackStones++;
    else whiteStones++;
  }
  for (let i = 0; i < eff.length; i++) {
    if (eff[i] !== EMPTY || visited.has(i)) continue;
    const { region, borders } = regionTouches(eff, i, size);
    for (const r of region) visited.add(r);
    if (borders.size === 1) {
      const owner = [...borders][0];
      if (owner === BLACK) blackTerritory += region.length;
      else whiteTerritory += region.length;
    }
  }

  const blackArea = blackStones + blackTerritory;
  const whiteArea = whiteStones + whiteTerritory + komi;
  const margin = Math.abs(blackArea - whiteArea);
  let winner: Color | "tie";
  if (blackArea > whiteArea) winner = BLACK;
  else if (whiteArea > blackArea) winner = WHITE;
  else winner = "tie";

  return {
    blackArea,
    whiteArea,
    komi,
    blackTerritory,
    whiteTerritory,
    blackStones,
    whiteStones,
    deadBlack,
    deadWhite,
    winner,
    resigned: null,
    margin,
    reason: winner === "tie" ? "tie" : "win",
  };
}
