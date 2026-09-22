import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  confirmScore as engineConfirm,
  createGame,
  finalScore,
  isLegal,
  pass as enginePass,
  playMove,
  resign,
  toggleDead as engineToggleDead,
  undo as engineUndo,
} from "../go/engine";
import { Color, GameState, Score } from "../go/types";
import type { AIDifficulty } from "../ai/types";
import { useAI } from "../ai/useAI";

export interface UseGoGame {
  state: GameState;
  /** 终局或死子标记阶段的实时比分（标记阶段随死子点选即时变化） */
  score: Score | null;
  /** 人机模式：AI 执子颜色；null=双人对弈 */
  opponent: Color | null;
  /** AI 思考中（用于锁棋盘 / 思考指示） */
  thinking: boolean;
  /** AI 错误信息（非 null 表示 worker 走子失败，需提示） */
  aiError: string | null;
  /** 死子标记阶段的 GnuGo 比分估算（正=白领先/负=黑领先）；双人模式或估算失败为 null */
  scoreHint: number | null;
  tryPlay: (i: number) => string | null;
  play: (i: number) => void;
  pass: () => void;
  doResign: () => void;
  undo: (steps?: number) => void;
  /** 标记阶段：点选棋子整组切换死/活 */
  toggleDead: (i: number) => void;
  /** 标记阶段确认：按当前死子标记定盘终局 */
  confirmScore: () => void;
  newGame: (size?: number, komi?: number) => void;
  setSize: (size: number) => void;
  setOpponent: (color: Color | null) => void;
}

export function useGoGame(
  initialSize = 19,
  initialKomi = 6.5,
  initialOpponent: Color | null = null,
  initialDifficulty: AIDifficulty = "medium",
): UseGoGame {
  const [state, setState] = useState<GameState>(() =>
    createGame(initialSize, initialKomi)
  );
  const [opponent, setOpponent] = useState<Color | null>(initialOpponent);
  const [difficulty] = useState<AIDifficulty>(initialDifficulty);
  const [thinking, setThinking] = useState(false);
  const { genmove, estimate, workerError, clearError } = useAI();
  const [aiError, setAiError] = useState<string | null>(null);
  const [scoreHint, setScoreHint] = useState<number | null>(null);

  const score = useMemo(
    () => (state.finished || state.marking ? finalScore(state) : null),
    [state]
  );

  const tryPlay = useCallback(
    (i: number): string | null => {
      const check = isLegal(state, i);
      return check.legal ? null : check.reason ?? "illegal";
    },
    [state]
  );

  const play = useCallback((i: number) => {
    setState((prev) => {
      const res = playMove(prev, i);
      return res.ok ? res.state : prev;
    });
  }, []);

  const pass = useCallback(() => {
    setState((prev) => {
      const res = enginePass(prev);
      return res.ok ? res.state : prev;
    });
  }, []);

  const doResign = useCallback(() => {
    setState((prev) => resign(prev));
  }, []);

  // 人机模式默认回退两手（AI 的回应 + 玩家上一手），双人模式一手。
  const undo = useCallback(
    (steps?: number) => {
      setState((prev) =>
        engineUndo(prev, steps ?? (opponent !== null ? 2 : 1))
      );
    },
    [opponent]
  );

  const toggleDead = useCallback((i: number) => {
    setState((prev) => engineToggleDead(prev, i));
  }, []);

  const confirmScore = useCallback(() => {
    setState((prev) => engineConfirm(prev));
  }, []);

  const newGame = useCallback((size?: number, komi?: number) => {
    setState((prev) => createGame(size ?? prev.size, komi ?? prev.komi));
    setAiError(null);
    clearError();
  }, [clearError]);

  const setSize = useCallback((size: number) => {
    setState((prev) => createGame(size, prev.komi));
  }, []);

  // 进入死子标记阶段（人机模式）时向 GnuGo 要一次比分估算作参考。
  // 仅在 marking 翻转 / 手数变化时触发，死子点选不会重复请求。
  useEffect(() => {
    setScoreHint(null);
    if (!state.marking || opponent === null) return;
    let cancelled = false;
    estimate(state).then((v) => {
      if (!cancelled) setScoreHint(v);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.marking, state.moveNumber, opponent, estimate]);

  // ---- AI 回合拦截 ----
  // 轮到 AI 且未结束（含标记阶段）且未在思考时，触发 worker 取招。thinkingRef 防重入；
  // effect cleanup 用 cancelled flag 撤销"在途"的取招（如玩家中途新局/悔棋）。
  const thinkingRef = useRef(false);
  useEffect(() => {
    if (opponent === null) return;
    if (state.finished) return;
    if (state.marking) return;
    if (state.turn !== opponent) return;
    if (thinkingRef.current) return;

    thinkingRef.current = true;
    setThinking(true);
    setAiError(null);
    clearError();
    let cancelled = false;

    genmove(state, difficulty)
      .then(async (move) => {
        if (cancelled) return;
        if (move === null) {
          pass();
          return;
        }
        // 防死锁：GnuGo 极少回非法手（SGF 同源重建，棋盘一致），但若与
        // 我方 ko/自杀规则有分歧被引擎拒收，重试一次；仍不行则替 AI 虚手，
        // 保证对局永远能推进，不会卡死在 AI 回合。
        if (isLegal(state, move).legal) {
          play(move);
          return;
        }
        const retry = await genmove(state, difficulty);
        if (cancelled) return;
        if (retry !== null && isLegal(state, retry).legal) {
          play(retry);
        } else {
          pass();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // 只展示首行（emscripten abort 等会带整屏堆栈，截断避免刷屏）
        const msg = String(err?.message ?? err).split("\n")[0];
        setAiError(msg.length > 90 ? `${msg.slice(0, 90)}…` : msg);
        // 防 deadlock：worker 崩溃 / 启动失败(CSP) / 超时时，若不推进对局，
        // state.turn 仍是 AI 方，棋盘永久锁死。此处替 AI 虚手一拍，与
        // 「非法手→retry→仍非法则 pass」的兜底策略一致，保证对局永远能推进。
        pass();
      })
      .finally(() => {
        if (cancelled) return;
        thinkingRef.current = false;
        setThinking(false);
      });

    return () => {
      cancelled = true;
      thinkingRef.current = false;
      setThinking(false);
    };
  }, [state, opponent, difficulty, genmove, play, pass, clearError]);

  return {
    state,
    score,
    opponent,
    thinking,
    aiError: aiError ?? workerError,
    scoreHint,
    tryPlay,
    play,
    pass,
    doResign,
    undo,
    toggleDead,
    confirmScore,
    newGame,
    setSize,
    setOpponent,
  };
}
