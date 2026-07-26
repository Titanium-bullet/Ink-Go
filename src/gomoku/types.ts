import { Color } from "../go/types";

export type { Color } from "../go/types";

export interface GomokuState {
  size: number;
  board: Color[];
  turn: Color;
  lastMove: number | null;
  moveNumber: number;
  history: number[];
  resigned: Color | null;
  finished: boolean;
  winner: Color | "tie" | null;
  winLine: number[] | null;
}

export type MoveResult =
  | { ok: true; state: GomokuState; won: boolean }
  | { ok: false; reason: string };
