import { BLACK, Color, GameState, WHITE } from "../../go/types";
import type { Phase } from "./Atmosphere";
import { format, useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";
import { StoneChip } from "../StoneChip";
import { BalancePill } from "../shop/BalancePill";
import { useWallet } from "../../state/wallet";

const SIZES = [9, 13, 19];

export function GameBar({
  state,
  phase,
  muted,
  flavor,
  flavorLocked,
  opponent,
  thinking,
  scoreHint,
  onPass,
  onResign,
  onUndo,
  onConfirmScore,
  onNewGame,
  onSetSize,
  onSetPhase,
  onToggleMute,
  onToggleFlavor,
  onOpenShop,
}: {
  state: GameState;
  phase: Phase;
  muted: boolean;
  flavor: boolean;
  /** 墨兽·灵泉特效包未购入时锁开关 */
  flavorLocked: boolean;
  /** 人机模式：AI 执子颜色；null=双人对弈 */
  opponent: Color | null;
  thinking: boolean;
  /** 死子标记阶段的 GnuGo 比分估算（正=白领先/负=黑领先） */
  scoreHint: number | null;
  onPass: () => void;
  onResign: () => void;
  onUndo: () => void;
  onConfirmScore: () => void;
  onNewGame: () => void;
  onSetSize: (s: number) => void;
  onSetPhase: (p: Phase) => void;
  onToggleMute: () => void;
  onToggleFlavor: () => void;
  onOpenShop: () => void;
}) {
  const t = useT();
  const { balance } = useWallet();
  // 是否轮到 AI（此时玩家不可操作按钮）
  const aiTurn =
    opponent !== null && state.turn === opponent && !state.finished;
  const locked = thinking || aiTurn;
  const marking = state.marking;

  const turnLabel = state.finished
    ? t.game.finished
    : marking
    ? t.game.marking
    : thinking
    ? t.game.thinking
    : aiTurn
    ? `${opponent === BLACK ? t.game.blackAITurn : t.game.whiteAITurn}`
    : state.turn === BLACK
    ? t.game.blackTurn
    : t.game.whiteTurn;

  return (
    <aside className="goban-panel">
      <div className="panel-block turn-block">
        <span
          className={`turn-stone ${state.turn === WHITE ? "is-white" : ""} ${
            state.finished ? "is-dim" : ""
          }`}
        />
        <div>
          <p className="panel-cap">{t.game.turn}</p>
          <p className="panel-val">{turnLabel}</p>
        </div>
        <BalancePill balance={balance} />
      </div>

      <div className="panel-grid">
        <div className="panel-block">
          <p className="panel-cap">{t.game.moves}</p>
          <p className="panel-val">{state.moveNumber}</p>
        </div>
        <div className="panel-block">
          <p className="panel-cap">{t.game.komi}</p>
          <p className="panel-val">{state.komi}</p>
        </div>
        <div className="panel-block capture-block">
          <p className="panel-cap">{t.game.blackCaps}</p>
          <p className="panel-val">
            <StoneChip color={WHITE} size="1.1rem" /> {state.captures.black}
          </p>
        </div>
        <div className="panel-block capture-block">
          <p className="panel-cap">{t.game.whiteCaps}</p>
          <p className="panel-val">
            <StoneChip color={BLACK} size="1.1rem" /> {state.captures.white}
          </p>
        </div>
      </div>

      <div className="panel-block">
        <p className="panel-cap">{t.game.weather}</p>
        <div className="weather-toggle">
          {t.game.phases.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`weather-dot ${phase === p.key ? "is-active" : ""}`}
              onClick={() => onSetPhase(p.key as Phase)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-block">
        <p className="panel-cap">{t.game.board}</p>
        <div className="size-row">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={`goban-btn size-btn ${state.size === s ? "is-active" : ""}`}
              onClick={() => onSetSize(s)}
            >
              {s}{t.game.sizeSuf}
            </button>
          ))}
        </div>
      </div>

      <div className="action-row">
        {marking ? (
          <>
            <button
              type="button"
              className="goban-btn primary"
              onClick={onConfirmScore}
            >
              {t.game.confirmScore}
            </button>
            <button type="button" className="goban-btn" onClick={onUndo}>
              {t.game.resume}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="goban-btn"
              disabled={state.finished || locked}
              onClick={onPass}
            >
              {t.game.pass}
            </button>
            <button
              type="button"
              className="goban-btn"
              disabled={state.moveNumber === 0 || state.finished || locked}
              onClick={onUndo}
            >
              {t.game.undo}
            </button>
            <button
              type="button"
              className="goban-btn danger"
              disabled={state.finished || locked}
              onClick={onResign}
            >
              {t.game.resign}
            </button>
          </>
        )}
        <button type="button" className="goban-btn" onClick={onToggleMute} disabled={locked}>
          {muted ? t.game.muteOn : t.game.muteOff}
        </button>
      </div>
      <button
        type="button"
        className={`goban-btn flavor-toggle${flavorLocked ? " is-locked" : ""}`}
        title={flavorLocked ? t.shop.effectsLocked : undefined}
        onClick={() => (flavorLocked ? onOpenShop() : onToggleFlavor())}
      >
        {flavor ? t.game.beastsOn : t.game.beastsOff}
        {flavorLocked ? " 🔒" : ""}
      </button>
      <button type="button" className="goban-btn primary new-game-btn" onClick={onNewGame}>
        {t.game.newGame}
      </button>
      <LangToggle className="compact on-light" />

      {marking ? (
        <div className="hint marking-hints">
          <p>{t.game.markingHint}</p>
          {scoreHint !== null && (
            <p className="score-hint">
              {format(t.game.scoreHint, {
                side:
                  scoreHint > 0 ? t.game.scoreHintWhite : t.game.scoreHintBlack,
                margin: Math.abs(scoreHint).toFixed(1),
              })}
            </p>
          )}
        </div>
      ) : (
        state.consecutivePasses === 1 &&
        !state.finished && <p className="hint">{t.game.passHint}</p>
      )}
    </aside>
  );
}
