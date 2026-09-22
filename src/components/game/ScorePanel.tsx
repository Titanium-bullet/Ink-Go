import { BLACK } from "../../go/types";
import { Score } from "../../go/types";
import { Seal } from "./Seal";
import { useT, format } from "../../i18n/LanguageContext";

export function ScorePanel({
  score,
  preview = false,
}: {
  score: Score;
  /** 死子标记阶段：随点选即时变化的预览比分 */
  preview?: boolean;
}) {
  const t = useT();
  const blackWins = score.winner === BLACK;
  const winnerName =
    score.winner === BLACK
      ? t.result.black
      : score.winner === "tie"
        ? t.result.draw
        : t.result.white;
  const sealText =
    score.winner === BLACK
      ? t.seal.black
      : score.winner === "tie"
        ? t.seal.tie
        : t.seal.white;
  const reasonText =
    score.reason === "resign"
      ? format(t.result.resignReason, {
          side: score.resigned === BLACK ? t.result.black : t.result.white,
        })
      : score.winner === "tie"
        ? t.result.tieReason
        : format(t.result.win, { side: winnerName, margin: score.margin.toFixed(1) });

  return (
    <div className={`score-panel${preview ? " is-preview" : ""}`}>
      <div className="score-head">
        <div>
          <p className="score-kicker">
            {preview ? t.game.marking : t.result.endKicker}
          </p>
          <h3 className="score-title">
            {winnerName}
            {score.winner !== "tie" ? t.result.winSuffix : ""}
          </h3>
          <p className="score-reason">{reasonText}</p>
        </div>
        {score.winner !== "tie" && (
          <Seal text={sealText} size={58} className="seal-stamp" />
        )}
      </div>

      {/* 认输局无数子数据，不渲染空 0/0 行（避免与盘面实际棋子数脱节） */}
      {score.reason !== "resign" && (
        <div className="score-rows">
          <ScoreRow
            name={t.result.black}
            area={score.blackArea}
            stones={score.blackStones}
            territory={score.blackTerritory}
            komi={0}
            dead={score.deadBlack}
            highlight={blackWins}
          />
          <ScoreRow
            name={t.result.white}
            area={score.whiteArea}
            stones={score.whiteStones}
            territory={score.whiteTerritory}
            komi={score.komi}
            dead={score.deadWhite}
            highlight={!blackWins && score.winner !== "tie"}
          />
        </div>
      )}
      <p className="score-foot">{t.result.scoreFootLong}</p>
    </div>
  );
}

function ScoreRow({
  name,
  area,
  stones,
  territory,
  komi,
  dead,
  highlight,
}: {
  name: string;
  area: number;
  stones: number;
  territory: number;
  komi: number;
  dead: number;
  highlight: boolean;
}) {
  const t = useT();
  return (
    <div className={`score-row ${highlight ? "is-winner" : ""}`}>
      <span className="score-name">{name}</span>
      <div className="score-detail">
        <span>{t.result.stones} {stones}</span>
        <span>{t.result.territory} {territory}</span>
        {komi > 0 && <span>{t.result.komi} {komi}</span>}
        {dead > 0 && <span className="score-dead">{t.result.dead} {dead}</span>}
      </div>
      <span className="score-total">{area.toFixed(1)}</span>
    </div>
  );
}
