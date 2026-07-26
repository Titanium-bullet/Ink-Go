import { BLACK, Color, EMPTY, opponent } from "../go/types";
import { GomokuState, MoveResult } from "./types";

export function createGame(size = 15): GomokuState {
  return {
    size,
    board: new Array<Color>(size * size).fill(EMPTY),
    turn: BLACK,
    lastMove: null,
    moveNumber: 0,
    history: [],
    resigned: null,
    finished: false,
    winner: null,
    winLine: null,
  };
}

function clone(state: GomokuState): GomokuState {
  return {
    ...state,
    board: state.board.slice(),
    history: state.history.slice(),
  };
}

const DIRS: ReadonlyArray<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

function lineInDirection(
  board: Color[],
  size: number,
  x: number,
  y: number,
  color: Color,
  dx: number,
  dy: number
): number[] {
  const line: number[] = [y * size + x];
  for (const [sx, sy] of [
    [1, 1],
    [-1, -1],
  ] as const) {
    let cx = x + dx * sx;
    let cy = y + dy * sy;
    while (
      cx >= 0 &&
      cx < size &&
      cy >= 0 &&
      cy < size &&
      board[cy * size + cx] === color
    ) {
      if (sx > 0) line.push(cy * size + cx);
      else line.unshift(cy * size + cx);
      cx += dx * sx;
      cy += dy * sy;
    }
  }
  return line;
}

function detectWin(
  board: Color[],
  size: number,
  i: number
): number[] | null {
  const color = board[i];
  if (color === EMPTY) return null;
  const x = i % size;
  const y = Math.floor(i / size);
  for (const [dx, dy] of DIRS) {
    const line = lineInDirection(board, size, x, y, color, dx, dy);
    if (line.length >= 5) return line;
  }
  return null;
}

export function playMove(state: GomokuState, i: number): MoveResult {
  if (state.finished) return { ok: false, reason: "finished" };
  if (state.board[i] !== EMPTY) return { ok: false, reason: "occupied" };

  const next = clone(state);
  const { size } = next;
  const color = next.turn;
  next.board[i] = color;

  const winLine = detectWin(next.board, size, i);
  next.lastMove = i;
  next.moveNumber += 1;
  next.history = [...next.history, i];

  if (winLine) {
    next.finished = true;
    next.winner = color;
    next.winLine = winLine;
    return { ok: true, state: next, won: true };
  }

  if (next.moveNumber >= size * size) {
    next.finished = true;
    next.winner = "tie";
    next.winLine = null;
    next.turn = opponent(color);
    return { ok: true, state: next, won: false };
  }

  next.turn = opponent(color);
  return { ok: true, state: next, won: false };
}

export function resign(state: GomokuState): GomokuState {
  if (state.finished) return state;
  const next = clone(state);
  next.finished = true;
  next.resigned = next.turn;
  next.winner = opponent(next.turn);
  return next;
}

export function undo(state: GomokuState, steps = 1): GomokuState {
  if (state.moveNumber === 0) return state;
  const target = Math.max(0, state.moveNumber - steps);
  return replay(state.history.slice(0, target), state.size);
}

export function replay(history: number[], size: number): GomokuState {
  let game = createGame(size);
  for (const i of history) {
    const res = playMove(game, i);
    if (!res.ok) break;
    game = res.state;
  }
  return game;
}
