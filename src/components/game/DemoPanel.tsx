import { useEffect, useState } from "react";
import { Goban } from "./Goban";
import { ScorePanel } from "./ScorePanel";
import { useSound } from "../../hooks/useSound";
import { createGame, playMove, resign, finalScore } from "../../go/engine";
import { BLACK, WHITE, GameState } from "../../go/types";
import { useT } from "../../i18n/LanguageContext";

type Key = "spring" | "turtle" | "fish" | "ko" | "seal";

const SCENARIO_KEYS: Key[] = ["spring", "turtle", "fish", "ko", "seal"];

function preset(black: number[], white: number[], turn = BLACK): GameState {
  const g = createGame(9, 6.5);
  for (const i of black) g.board[i] = BLACK;
  for (const i of white) g.board[i] = WHITE;
  g.turn = turn;
  return g;
}

// 9x9 indices: idx = y*9 + x
function build(key: Key): GameState {
  switch (key) {
    case "spring":
      // empty board — nine star points manifest as 灵泉
      return preset([], [], BLACK);
    case "turtle":
      // black wall y=2, x=2..7 (thick) + a couple white far away
      return preset([20, 21, 22, 23, 24, 25], [56, 38], WHITE);
    case "fish":
      // black {(0,0),(1,0)} in atari (1 liberty at (2,0))
      return preset([0, 1], [9, 10], BLACK);
    case "ko":
      // PRE-capture: black to play (2,1)=11, captures white (1,1)=10 -> ko forms,
      // rift appears at (1,1); by ko rule white cannot immediately recapture there.
      return preset([9, 1, 19], [10, 12, 2, 20], BLACK);
    case "seal": {
      const g = preset([0, 1, 2, 9, 10, 18, 19], [72, 73, 74, 80, 81], WHITE);
      return resign(g);
    }
  }
}

export function DemoPanel() {
  const t = useT();
  const [scenario, setScenario] = useState<Key>("spring");
  const [state, setState] = useState<GameState>(() => build("spring"));
  const { playStone, playCapture } = useSound({ music: false });

  useEffect(() => {
    setState(build(scenario));
  }, [scenario]);

  const handlePlay = (i: number) => {
    const r = playMove(state, i);
    if (!r.ok) return;
    setState(r.state);
    playStone();
    if (r.captured > 0) playCapture(r.captured);
  };

  const current = t.effects.scenarios[SCENARIO_KEYS.indexOf(scenario)];
  const score = state.finished ? finalScore(state) : null;

  return (
    <div className="demo-panel grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="play-board-col">
        <Goban state={state} onPlay={handlePlay} flavor />
      </div>

      <aside className="goban-panel showcase-panel">
        <p className="panel-cap">{t.effects.catalog}</p>
        <div className="scenario-list">
          {t.effects.scenarios.map((s, idx) => (
            <button
              key={SCENARIO_KEYS[idx]}
              type="button"
              className={`scenario-item ${scenario === SCENARIO_KEYS[idx] ? "is-active" : ""}`}
              onClick={() => setScenario(SCENARIO_KEYS[idx])}
            >
              <span className="scenario-name">{s.name}</span>
              <span className="scenario-tag">{s.tag}</span>
            </button>
          ))}
        </div>

        <div className="scenario-desc">
          <p className="panel-cap">{current.name}</p>
          <p className="desc-body">{current.desc}</p>
        </div>

        {score && <ScorePanel score={score} />}

        <button
          type="button"
          className="goban-btn flavor-toggle"
          onClick={() => setState(build(scenario))}
        >
          {t.effects.reset}
        </button>
      </aside>
    </div>
  );
}
