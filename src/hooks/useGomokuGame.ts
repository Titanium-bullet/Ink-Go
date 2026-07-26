import { useCallback, useState } from "react";
import {
  createGame,
  playMove,
  resign as engineResign,
  undo as engineUndo,
} from "../gomoku/engine";
import { GomokuState } from "../gomoku/types";

export interface UseGomokuGame {
  state: GomokuState;
  play: (i: number) => void;
  doResign: () => void;
  undo: (steps?: number) => void;
  newGame: () => void;
}

export function useGomokuGame(size = 15): UseGomokuGame {
  const [state, setState] = useState<GomokuState>(() => createGame(size));

  const play = useCallback((i: number) => {
    setState((prev) => {
      const res = playMove(prev, i);
      return res.ok ? res.state : prev;
    });
  }, []);

  const doResign = useCallback(() => {
    setState((prev) => engineResign(prev));
  }, []);

  const undo = useCallback((steps = 1) => {
    setState((prev) => engineUndo(prev, steps));
  }, []);

  const newGame = useCallback(() => {
    setState((prev) => createGame(prev.size));
  }, []);

  return { state, play, doResign, undo, newGame };
}
