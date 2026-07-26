import { BLACK, Color, GameState, WHITE } from "../../go/types";
import type { Phase } from "./Atmosphere";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";

const SIZES = [9, 13, 19];

function MiniStone({ color }: { color: number }) {
  return (
    <span
      className="mini-stone"
      style={{
        background:
          color === BLACK
            ? "radial-gradient(circle at 35% 30%, #5a4a40, #050403 70%)"
            : "radial-gradient(circle at 35% 30%, #ffffff, #c9bda4 72%)",
        boxShadow:
          color === BLACK
            ? "0 0 6px rgba(0,0,0,0.6)"
            : "0 0 6px rgba(255,255,255,0.4)",
      }}
    />
  );
}

export function GameBar({
  state,
  phase,
  muted,
  flavor,
  opponent,
  thinking,
  onPass,
  onResign,
  onUndo,
  onNewGame,
  onSetSize,
  onSetPhase,
  onToggleMute,
  onToggleFlavor,
}: {
  state: GameState;
  phase: Phase;
  muted: boolean;
  flavor: boolean;
  /** 人机模式：AI 执子颜色；null=双人对弈 */
  opponent: Color | null;
  thinking: boolean;
  onPass: () => void;
  onResign: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  onSetSize: (s: number) => void;
  onSetPhase: (p: Phase) => void;
  onToggleMute: () => void;
  onToggleFlavor: () => void;
}) {
  const t = useT();
  // 是否轮到 AI（此时玩家不可操作按钮）
  const aiTurn = opponent !== null && state.turn === opponent && !state.finished;
  const locked = thinking || aiTurn;

  const turnLabel = state.finished
    ? t.game.finished
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
            <MiniStone color={WHITE} /> {state.captures.black}
          </p>
        </div>
        <div className="panel-block capture-block">
          <p className="panel-cap">{t.game.whiteCaps}</p>
          <p className="panel-val">
            <MiniStone color={BLACK} /> {state.captures.white}
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
        <button type="button" className="goban-btn" onClick={onToggleMute} disabled={locked}>
          {muted ? t.game.muteOn : t.game.muteOff}
        </button>
      </div>
      <button
        type="button"
        className="goban-btn flavor-toggle"
        onClick={onToggleFlavor}
      >
        {flavor ? t.game.beastsOn : t.game.beastsOff}
      </button>
      <button type="button" className="goban-btn primary new-game-btn" onClick={onNewGame}>
        {t.game.newGame}
      </button>
      <LangToggle className="compact on-light" />

      {state.consecutivePasses === 1 && !state.finished && (
        <p className="hint">{t.game.passHint}</p>
      )}
    </aside>
  );
}
