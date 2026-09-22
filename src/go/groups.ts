import { BLACK, Color, EMPTY, GameState } from "./types";
import { getGroup } from "./board";

export interface GroupInfo {
  color: Color;
  stones: number[];
  liberties: number;
  stoneCount: number;
  cx: number;
  cy: number;
  inAtari: boolean;
}

export function analyzeGroups(state: GameState): GroupInfo[] {
  const { board, size } = state;
  const visited = new Set<number>();
  const groups: GroupInfo[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY || visited.has(i)) continue;
    const g = getGroup(board, i, size);
    let sx = 0;
    let sy = 0;
    for (const s of g.stones) {
      visited.add(s);
      sx += s % size;
      sy += Math.floor(s / size);
    }
    const n = g.stones.length;
    groups.push({
      color: board[i],
      stones: g.stones,
      liberties: g.liberties.size,
      stoneCount: n,
      cx: sx / n,
      cy: sy / n,
      inAtari: g.liberties.size === 1,
    });
  }
  return groups;
}

export interface BeastMarks {
  turtle: GroupInfo | null;
  fish: GroupInfo[];
}

export function findBeasts(state: GameState): BeastMarks {
  const groups = analyzeGroups(state);

  const blackThick = groups
    .filter(
      (g) => g.color === BLACK && g.stoneCount >= 6 && g.liberties >= 8
    )
    .sort((a, b) => b.stoneCount + b.liberties - (a.stoneCount + a.liberties));
  const fish = groups
    .filter((g) => g.inAtari)
    .sort((a, b) => b.stoneCount - a.stoneCount)
    .slice(0, 6);

  return {
    turtle: blackThick[0] ?? null,
    fish,
  };
}
