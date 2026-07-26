import { BLACK, WHITE } from "../../go/types";
import { GomokuState } from "../../gomoku/types";
import type { Phase } from "../game/Atmosphere";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";

export function GomokuBar({
  state,
  phase,
  muted,
  onResign,
  onUndo,
  onNewGame,
  onSetPhase,
  onToggleMute,
}: {
  state: GomokuState;
  phase: Phase;
  muted: boolean;
  onResign: () => void;
  onUndo: (steps?: number) => void;
  onNewGame: () => void;
  onSetPhase: (p: Phase) => void;
  onToggleMute: () => void;
}) {
  const t = useT();
  const turnLabel = state.finished
    ? t.gomoku.finished
    : state.turn === BLACK
    ? t.gomoku.blackTurn
    : t.gomoku.whiteTurn;

  return (
    <aside className="goban-panel">
      <div className="panel-block turn-block">
        <span
          className={`turn-stone ${state.turn === WHITE ? "is-white" : ""} ${
            state.finished ? "is-dim" : ""
          }`}
        />
        <div>
          <p className="panel-cap">{t.gomoku.turn}</p>
          <p className="panel-val">{turnLabel}</p>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel-block">
          <p className="panel-cap">{t.gomoku.moves}</p>
          <p className="panel-val">{state.moveNumber}</p>
        </div>
        <div className="panel-block">
          <p className="panel-cap">{t.gomoku.rule}</p>
          <p className="panel-val" style={{ fontSize: "1rem", lineHeight: 1.4 }}>
            {t.gomoku.ruleVal}
          </p>
        </div>
      </div>

      <div className="panel-block">
        <p className="panel-cap">{t.gomoku.weather}</p>
        <div className="weather-toggle">
          {t.gomoku.phases.map((p) => (
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

      <p className="panel-cap" style={{ marginBottom: "0.4rem" }}>
        {t.gomoku.goal}
      </p>
      <p
        className="gomoku-tip"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <span style={{ opacity: 0.85 }}>{t.gomoku.goalTipLead}</span>
        <span
          className="mini-stone"
          style={{
            display: "inline-block",
            width: "0.7rem",
            height: "0.7rem",
            background:
              "radial-gradient(circle at 35% 30%, #5a4a40, #050403 70%)",
          }}
        />
        <span
          className="mini-stone"
          style={{
            display: "inline-block",
            width: "0.7rem",
            height: "0.7rem",
            background:
              "radial-gradient(circle at 35% 30%, #ffffff, #c9bda4 72%)",
          }}
        />
        <span style={{ opacity: 0.85 }}>{t.gomoku.goalTipTail}</span>
      </p>

      <div className="action-row is-three">
        <button
          type="button"
          className="goban-btn"
          disabled={state.moveNumber === 0 || state.finished}
          onClick={() => onUndo(1)}
        >
          {t.gomoku.undo}
        </button>
        <button
          type="button"
          className="goban-btn danger"
          disabled={state.finished}
          onClick={onResign}
        >
          {t.gomoku.resign}
        </button>
        <button type="button" className="goban-btn" onClick={onToggleMute}>
          {muted ? t.gomoku.muteOn : t.gomoku.muteOff}
        </button>
      </div>
      <button
        type="button"
        className="goban-btn primary new-game-btn"
        onClick={onNewGame}
      >
        {t.gomoku.newGame}
      </button>
      <LangToggle className="compact on-light" />
    </aside>
  );
}
