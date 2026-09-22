import {
  BLACK,
  Color,
  EMPTY,
  GameState,
  HistoryAction,
  Score,
  opponent,
} from "./types";
import { getGroup, neighbors } from "./board";
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
    marking: false,
    deadStones: [],
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
    deadStones: state.deadStones.slice(),
  };
}

// re-export：board 基础算法的历史入口（groups.ts 等自此导入）
export { getGroup, neighbors };
export type { Group } from "./board";

export type MoveResult =
  | { ok: true; state: GameState; captured: number }
  | { ok: false; reason: string };

// 落子模拟核心：提子 + 自杀判定，在盘面副本上一次完成。
// isLegal 与 playMove 共用这一份逻辑，避免「查合法」和「真落子」两份
// 拷贝各自漂移（历史上 isLegal 里还残留过永不读取的死变量）。
function simulateMove(
  state: GameState,
  i: number
):
  | {
      ok: true;
      board: Color[];
      captured: number[];
      selfStones: number;
      selfLiberties: number;
    }
  | { ok: false; reason: string } {
  const { size } = state;
  const board = state.board.slice();
  const color = state.turn;
  const foe = opponent(color);
  board[i] = color;

  const capturedSet = new Set<number>();
  for (const n of neighbors(i, size)) {
    if (board[n] === foe) {
      const g = getGroup(board, n, size);
      if (g.liberties.size === 0) {
        for (const s of g.stones) capturedSet.add(s);
      }
    }
  }
  for (const s of capturedSet) board[s] = EMPTY;

  const selfGroup = getGroup(board, i, size);
  if (selfGroup.liberties.size === 0) {
    return { ok: false, reason: "suicide" };
  }
  return {
    ok: true,
    board,
    captured: [...capturedSet],
    selfStones: selfGroup.stones.length,
    selfLiberties: selfGroup.liberties.size,
  };
}

function moveGuards(state: GameState, i: number): string | null {
  if (state.finished) return "finished";
  if (state.marking) return "marking";
  if (state.board[i] !== EMPTY) return "occupied";
  if (state.koPoint === i) return "ko";
  return null;
}

export function isLegal(
  state: GameState,
  i: number
): { legal: boolean; reason?: string } {
  const guard = moveGuards(state, i);
  if (guard) return { legal: false, reason: guard };
  const sim = simulateMove(state, i);
  return sim.ok ? { legal: true } : { legal: false, reason: sim.reason };
}

export function playMove(state: GameState, i: number): MoveResult {
  const guard = moveGuards(state, i);
  if (guard) return { ok: false, reason: guard };

  const sim = simulateMove(state, i);
  if (!sim.ok) return { ok: false, reason: sim.reason };

  const next = cloneGame(state);
  next.board = sim.board;
  const color = next.turn;
  const foe = opponent(color);
  const captured = sim.captured.length;

  if (color === BLACK) next.captures.black += captured;
  else next.captures.white += captured;

  next.koPoint = null;
  if (captured === 1 && sim.selfStones === 1 && sim.selfLiberties === 1) {
    next.koPoint = sim.captured[0];
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
  if (state.marking) return { ok: false, reason: "marking" };
  const next = cloneGame(state);
  next.history = [...next.history, { type: "pass" }];
  next.consecutivePasses += 1;
  next.lastMove = null;
  next.koPoint = null;
  next.moveNumber += 1;
  next.turn = opponent(next.turn);
  if (next.consecutivePasses >= 2) {
    // 不直接终局：进入死子标记阶段，玩家点选死子后由 confirmScore 定盘。
    next.marking = true;
  }
  return { ok: true, state: next, captured: 0 };
}

// 标记阶段：点选一枚棋子，整组切换死/活。非标记阶段或空点原样返回。
export function toggleDead(state: GameState, i: number): GameState {
  if (!state.marking || state.board[i] === EMPTY) return state;
  const group = getGroup(state.board, i, state.size);
  const dead = new Set(state.deadStones);
  const markDead = !dead.has(i);
  for (const s of group.stones) {
    if (markDead) dead.add(s);
    else dead.delete(s);
  }
  const next = cloneGame(state);
  next.deadStones = [...dead].sort((a, b) => a - b);
  return next;
}

// 标记阶段确认：按当前死子标记定盘终局。
export function confirmScore(state: GameState): GameState {
  if (!state.marking) return state;
  const next = cloneGame(state);
  next.marking = false;
  next.finished = true;
  return next;
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
      deadBlack: 0,
      deadWhite: 0,
      winner,
      resigned: state.resigned,
      margin: Infinity,
      reason: "resign",
    };
  }
  return scoreArea(state);
}
