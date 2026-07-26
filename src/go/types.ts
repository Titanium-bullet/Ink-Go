export type Phase = "dawn" | "noon" | "dusk" | "night";

export type Color = 0 | 1 | 2;

export const EMPTY: Color = 0;
export const BLACK: Color = 1;
export const WHITE: Color = 2;

export const opponent = (c: Color): Color => (c === BLACK ? WHITE : BLACK);

export interface Move {
  x: number;
  y: number;
  color: Color;
  pass?: boolean;
}

// 棋谱动作：落子记录下标，虚手只占一拍。两者都进 history，使 moveNumber 与
// history.length 始终相等，undo/replay/SGF 序列化才能正确处理虚手。
export type HistoryAction =
  | { type: "move"; index: number }
  | { type: "pass" };

export interface Score {
  blackArea: number;
  whiteArea: number;
  komi: number;
  blackTerritory: number;
  whiteTerritory: number;
  blackStones: number;
  whiteStones: number;
  winner: Color | "tie";
  /** 认输方（仅 reason==="resign" 时非 null）。UI 显示「某方认输」时应以此为准，而非 winner。 */
  resigned: Color | null;
  margin: number;
  reason: string;
}

export interface GameState {
  size: number;
  board: Color[];
  turn: Color;
  captures: { black: number; white: number };
  koPoint: number | null;
  lastMove: number | null;
  moveNumber: number;
  consecutivePasses: number;
  history: HistoryAction[];
  resigned: Color | null;
  finished: boolean;
  komi: number;
}

export const index = (x: number, y: number, size: number) => y * size + x;
export const coords = (i: number, size: number): [number, number] => [
  i % size,
  Math.floor(i / size),
];
