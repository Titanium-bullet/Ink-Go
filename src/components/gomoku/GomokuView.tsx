import { useEffect, useRef, useState } from "react";
import { GomokuBoard } from "./GomokuBoard";
import { GomokuBar } from "./GomokuBar";
import { GomokuResult } from "./GomokuResult";
import { ResultOverlay } from "../game/ResultOverlay";
import { Atmosphere, type Phase } from "../game/Atmosphere";
import { useGomokuGame } from "../../hooks/useGomokuGame";
import { useSound } from "../../hooks/useSound";
import { BLACK } from "../../go/types";
import { useT, format } from "../../i18n/LanguageContext";

export function GomokuView({
  onBack,
}: {
  onBack: () => void;
}) {
  const { state, play, doResign, undo, newGame } = useGomokuGame(15);
  const { playStone, playPhase, muted, toggleMute, prime } = useSound();
  const t = useT();
  const [phase, setPhase] = useState<Phase>("dusk");
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 新一局开始时重置「已关闭落地窗」标记，使终局时落地窗再次弹出
  useEffect(() => {
    if (!state.finished) setDismissed(false);
  }, [state.finished]);

  const prevMove = useRef(0);
  const phaseFirstRef = useRef(true);

  useEffect(() => {
    if (state.moveNumber !== prevMove.current && state.lastMove !== null) {
      playStone();
    }
    prevMove.current = state.moveNumber;
  }, [state.moveNumber, state.lastMove, playStone]);

  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 1150);
    return () => window.clearTimeout(id);
  }, []);

  // 天象应声:切换晨午暮夜时触发,首次挂载不响
  useEffect(() => {
    if (phaseFirstRef.current) {
      phaseFirstRef.current = false;
      return;
    }
    playPhase(phase);
  }, [phase, playPhase]);

  // 首次交互后解锁 AudioContext 并起背景雅乐
  useEffect(() => prime(), [prime]);

  return (
    <main className="play-view" data-phase={phase}>
      <Atmosphere phase={phase} />
      {!revealed && <div className="ink-reveal" />}

      <header className="play-header">
        <button type="button" className="back-link" onClick={onBack}>
          {t.gomoku.backToRealm}
        </button>
        <p className="play-brand">{t.gomoku.brand}</p>
      </header>

      <div className="play-stage">
        <div className="play-board-col">
          <GomokuBoard state={state} onPlay={play} />
        </div>

        <div className="play-side">
          <GomokuBar
            state={state}
            phase={phase}
            muted={muted}
            onResign={doResign}
            onUndo={undo}
            onNewGame={newGame}
            onSetPhase={setPhase}
            onToggleMute={toggleMute}
          />
          {state.finished && state.winner && <GomokuResult state={state} />}
        </div>
      </div>

      {state.finished && state.winner && !dismissed && (
        <ResultOverlay
          winner={state.winner}
          reason={
            state.resigned !== null
              ? format(t.gomoku.resignReason, {
                  side:
                    state.resigned === BLACK
                      ? t.gomoku.blackWin
                      : t.gomoku.whiteWin,
                })
              : state.winner === "tie"
                ? t.gomoku.drawReason
                : t.gomoku.winReason
          }
          sealText={
            state.winner === "tie"
              ? t.seal.tie
              : state.winner === BLACK
                ? t.seal.black
                : t.seal.white
          }
          note={format(t.gomoku.note, { n: state.moveNumber })}
          onRematch={newGame}
          onBack={onBack}
          onClose={() => setDismissed(true)}
        />
      )}
    </main>
  );
}
