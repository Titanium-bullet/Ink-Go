import {
  BLACK,
  Color,
  EMPTY,
  GameState,
  HistoryAction,
  Score,
  opponent,
} from "./types";
import { scoreArea } from "./scoring";

export function createGame(size: number, komi = 6.5): GameState {
  return {
    size,
    board: new Array<Color>(size * size).fill(EMPTY),
    turn: BLACK,
    captures: { black: 0, white: 0 },
    koPoint: null,
    lastMove: null,
    moveNumber: 0,
    consecutivePasses: 0,
    history: [],
    resigned: null,
    finished: false,
    komi,
  };
}

export function cloneGame(state: GameState): GameState {
  return {
    ...state,
    board: state.board.slice(),
    captures: { ...state.captures },
    history: state.history.slice(),
  };
}

function neighbors(i: number, size: number): number[] {
  const x = i % size;
  const y = Math.floor(i / size);
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < size - 1) out.push(i + 1);
  if (y > 0) out.push(i - size);
  if (y < size - 1) out.push(i + size);
  return out;
}

export interface Group {
  stones: number[];
  liberties: Set<number>;
}

export function getGroup(board: Color[], start: number, size: number): Group {
  const color = board[start];
  const stones: number[] = [];
  const liberties = new Set<number>();
  if (color === EMPTY) return { stones, liberties };
  const visited = new Set<number>([start]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    stones.push(i);
    for (const n of neighbors(i, size)) {
      if (board[n] === EMPTY) {
        liberties.add(n);
      } else if (board[n] === color && !visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return { stones, liberties };
}

export type MoveResult =
  | { ok: true; state: GameState; captured: number }
  | { ok: false; reason: string };

export function isLegal(
  state: GameState,
  i: number
): { legal: boolean; reason?: string } {
  if (state.finished) return { legal: false, reason: "finished" };
  if (state.board[i] !== EMPTY) return { legal: false, reason: "occupied" };
  if (state.koPoint === i)
    return { legal: false, reason: "ko" };

  const { size } = state;
  const board = state.board.slice();
  const color = state.turn;
  const foe = opponent(color);
  board[i] = color;

  let captured = 0;
  let capturedStones: number[] = [];
  for (const n of neighbors(i, size)) {
    if (board[n] === foe) {
      const g = getGroup(board, n, size);
      if (g.liberties.size === 0) {
        for (const s of g.stones) {
          board[s] = EMPTY;
          captured++;
          capturedStones.push(s);
        }
      }
    }
  }

  const selfGroup = getGroup(board, i, size);
  if (selfGroup.liberties.size === 0) {
    return { legal: false, reason: "suicide" };
  }
  return { legal: true };
}

export function playMove(state: GameState, i: number): MoveResult {
  if (state.finished) return { ok: false, reason: "finished" };
  if (state.board[i] !== EMPTY) return { ok: false, reason: "occupied" };
  if (state.koPoint === i)
    return { ok: false, reason: "ko" };

  const next = cloneGame(state);
  const { size } = next;
  const board = next.board;
  const color = next.turn;
  const foe = opponent(color);
  board[i] = color;

  const capturedSet = new Set<number>();
  for (const n of neighbors(i, size)) {
    if (board[n] === foe) {
      const g = getGroup(board, n, size);
      if (g.liberties.size === 0) {
        for (const s of g.stones) {
          if (!capturedSet.has(s)) {
            capturedSet.add(s);
            board[s] = EMPTY;
          }
        }
      }
    }
  }
  const captured = capturedSet.size;

  const selfGroup = getGroup(board, i, size);
  if (selfGroup.liberties.size === 0) {
    return { ok: false, reason: "suicide" };
  }

  if (color === BLACK) next.captures.black += captured;
  else next.captures.white += captured;

  next.koPoint = null;
  if (captured === 1 && selfGroup.stones.length === 1 && selfGroup.liberties.size === 1) {
    next.koPoint = [...capturedSet][0];
  }

  next.history = [...next.history, { type: "move", index: i }];
  next.lastMove = i;
  next.moveNumber += 1;
  next.consecutivePasses = 0;
  next.turn = foe;
  return { ok: true, state: next, captured };
}

export function pass(state: GameState): MoveResult {
  if (state.finished) return { ok: false, reason: "finished" };
  const next = cloneGame(state);
  next.history = [...next.history, { type: "pass" }];
  next.consecutivePasses += 1;
  next.lastMove = null;
  next.koPoint = null;
  next.moveNumber += 1;
  next.turn = opponent(next.turn);
  if (next.consecutivePasses >= 2) {
    next.finished = true;
  }
  return { ok: true, state: next, captured: 0 };
}

export function resign(state: GameState): GameState {
  const next = cloneGame(state);
  next.finished = true;
  next.resigned = next.turn;
  return next;
}

export function undo(state: GameState, steps = 1): GameState {
  if (state.moveNumber === 0) return state;
  const target = Math.max(0, state.moveNumber - steps);
  return replay(state.history.slice(0, target), state.size, state.komi);
}

export function replay(
  history: HistoryAction[],
  size: number,
  komi: number
): GameState {
  let game = createGame(size, komi);
  for (const action of history) {
    const res = action.type === "move"
      ? playMove(game, action.index)
      : pass(game);
    if (!res.ok) break;
    game = res.state;
  }
  return game;
}

export function finalScore(state: GameState): Score {
  if (state.resigned !== null) {
    const winner = opponent(state.resigned);
    return {
      blackArea: 0,
      whiteArea: 0,
      komi: state.komi,
      blackTerritory: 0,
      whiteTerritory: 0,
      blackStones: 0,
      whiteStones: 0,
      winner,
      resigned: state.resigned,
      margin: Infinity,
      reason: "resign",
    };
  }
  return scoreArea(state);
}
