import { useEffect, useRef, useState } from "react";
import { Goban } from "./Goban";
import { GameBar } from "./GameBar";
import { ScorePanel } from "./ScorePanel";
import { ResultOverlay } from "./ResultOverlay";
import { Atmosphere, type Phase } from "./Atmosphere";
import { useGoGame } from "../../hooks/useGoGame";
import { useSound } from "../../hooks/useSound";
import { useWallet } from "../../state/wallet";
import { BLACK, type Color } from "../../go/types";
import { useT, format } from "../../i18n/LanguageContext";
import type { AIDifficulty } from "../../ai/types";

export function PlayView({
  opponent,
  difficulty = "medium",
  onBack,
  onSelectMode,
  onOpenShop,
}: {
  opponent: Color | null;
  difficulty?: AIDifficulty;
  onBack: () => void;
  onSelectMode: () => void;
  onOpenShop: () => void;
}) {
  const {
    state,
    score,
    play,
    pass,
    doResign,
    undo,
    toggleDead,
    confirmScore,
    newGame,
    setSize,
    opponent: activeOpponent,
    thinking,
    aiError,
    scoreHint,
  } = useGoGame(19, 6.5, opponent, difficulty);
  const { playStone, playCapture, playPhase, muted, toggleMute, prime } =
    useSound();
  const { owns } = useWallet();
  const t = useT();
  const [phase, setPhase] = useState<Phase>("dusk");
  const [flavor, setFlavor] = useState(true);
  const effectsOwned = owns("ink-effects");
  const flavorOn = flavor && effectsOwned;
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 新一局开始时重置「已关闭落地窗」标记，使终局时落地窗再次弹出
  useEffect(() => {
    if (!state.finished) setDismissed(false);
  }, [state.finished]);

  // 是否轮到 AI：此时锁棋盘（死子标记阶段同样锁定落子）
  const aiTurn =
    activeOpponent !== null &&
    state.turn === activeOpponent &&
    !state.finished &&
    !state.marking;
  const boardLocked = thinking || aiTurn;

  const prevMove = useRef(0);
  const prevCaps = useRef({ black: 0, white: 0 });
  const phaseFirstRef = useRef(true);

  // sound on stone placement & captures
  useEffect(() => {
    const moved = state.moveNumber !== prevMove.current;
    if (moved) {
      if (state.lastMove !== null) playStone();
      const dB = state.captures.black - prevCaps.current.black;
      const dW = state.captures.white - prevCaps.current.white;
      const total = Math.max(0, dB) + Math.max(0, dW);
      if (total > 0) playCapture(total);
    }
    prevMove.current = state.moveNumber;
    prevCaps.current = { ...state.captures };
  }, [state.moveNumber, state.lastMove, state.captures, playStone, playCapture]);

  // one-shot ink reveal on mount
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

  const reasonText = score
    ? score.reason === "resign"
      ? format(t.result.resignReason, {
          side: score.resigned === BLACK ? t.result.black : t.result.white,
        })
      : score.winner === "tie"
        ? t.result.tieReason
        : format(t.result.win, {
            side: score.winner === BLACK ? t.result.black : t.result.white,
            margin: score.margin.toFixed(1),
          })
    : "";

  return (
    <main className="play-view" data-phase={phase}>
      <Atmosphere phase={phase} />
      {!revealed && <div className="ink-reveal" />}

      <header className="play-header">
        <button type="button" className="back-link" onClick={onBack}>
          {t.game.backToRealm}
        </button>
        <p className="play-brand">{t.game.brand}</p>
      </header>

      <div className="play-stage">
        <div className="play-board-col">
          <Goban
            state={state}
            onPlay={play}
            onToggleDead={toggleDead}
            flavor={flavorOn}
            locked={boardLocked}
          />
        </div>

        <div className="play-side">
          <GameBar
            state={state}
            phase={phase}
            muted={muted}
            flavor={flavorOn}
            flavorLocked={!effectsOwned}
            opponent={activeOpponent}
            thinking={thinking}
            scoreHint={scoreHint}
            onPass={pass}
            onResign={doResign}
            onUndo={() => undo()}
            onConfirmScore={confirmScore}
            onNewGame={() => newGame()}
            onSetSize={setSize}
            onSetPhase={setPhase}
            onToggleMute={toggleMute}
            onToggleFlavor={() => setFlavor((f) => !f)}
            onOpenShop={onOpenShop}
          />
          {aiError && (
            <p className="hint" style={{ color: "#d8553a" }}>
              {t.game.aiErrorPrefix}{aiError}
            </p>
          )}
          {(state.finished || state.marking) && score && (
            <ScorePanel score={score} preview={state.marking} />
          )}
        </div>
      </div>

      {state.finished && score && !dismissed && (
        <ResultOverlay
          winner={score.winner}
          reason={reasonText}
          sealText={
            score.winner === BLACK
              ? t.seal.black
              : score.winner === "tie"
                ? t.seal.tie
                : t.seal.white
          }
          score={score}
          onRematch={() => newGame()}
          onBack={onBack}
          onSelectMode={onSelectMode}
          onClose={() => setDismissed(true)}
        />
      )}
    </main>
  );
}
