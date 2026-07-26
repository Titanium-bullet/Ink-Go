import { BLACK, Color, EMPTY, GameState, Score, WHITE } from "./types";

function regionTouches(board: Color[], start: number, size: number): {
  region: number[];
  borders: Set<Color>;
} {
  const region: number[] = [];
  const borders = new Set<Color>();
  const visited = new Set<number>([start]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    region.push(i);
    const x = i % size;
    const y = Math.floor(i / size);
    const adj: number[] = [];
    if (x > 0) adj.push(i - 1);
    if (x < size - 1) adj.push(i + 1);
    if (y > 0) adj.push(i - size);
    if (y < size - 1) adj.push(i + size);
    for (const n of adj) {
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

export function scoreArea(state: GameState): Score {
  const { size, board, komi } = state;
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;

  const visited = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    if (board[i] === BLACK) blackStones++;
    else if (board[i] === WHITE) whiteStones++;
    else if (!visited.has(i)) {
      const { region, borders } = regionTouches(board, i, size);
      for (const r of region) visited.add(r);
      if (borders.size === 1) {
        const owner = [...borders][0];
        if (owner === BLACK) blackTerritory += region.length;
        else whiteTerritory += region.length;
      }
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
    winner,
    resigned: null,
    margin,
    reason: winner === "tie" ? "tie" : "win",
  };
}
