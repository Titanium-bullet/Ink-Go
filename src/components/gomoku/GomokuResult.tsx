import { BLACK, type Color } from "../../go/types";
import type { GomokuState } from "../../gomoku/types";
import { Seal } from "../game/Seal";
import { useT, format } from "../../i18n/LanguageContext";

export function GomokuResult({ state }: { state: GomokuState }) {
  const t = useT();
  const winner = state.winner;
  const isTie = winner === "tie";
  const winnerName = isTie
    ? t.gomoku.draw
    : (winner as Color) === BLACK
      ? t.gomoku.blackWin
      : t.gomoku.whiteWin;
  const sealText = isTie
    ? t.seal.tie
    : (winner as Color) === BLACK
      ? t.seal.black
      : t.seal.white;

  const sideFor = (c: Color) =>
    c === BLACK ? t.gomoku.blackWin : t.gomoku.whiteWin;

  let reason: string;
  if (state.resigned !== null) {
    reason = format(t.gomoku.resignReason, { side: sideFor(state.resigned) });
  } else if (isTie) {
    reason = t.gomoku.drawReason;
  } else {
    reason = t.gomoku.winReason;
  }

  return (
    <div className="score-panel">
      <div className="score-head">
        <div>
          <p className="score-kicker">{t.gomoku.endKicker}</p>
          <h3 className="score-title">
            {winnerName}
            {!isTie ? t.gomoku.winSuffix : ""}
          </h3>
          <p className="score-reason">{reason}</p>
        </div>
        {!isTie && <Seal text={sealText} size={58} className="seal-stamp" />}
      </div>
      <p className="score-foot">{t.gomoku.scoreFoot}</p>
    </div>
  );
}
