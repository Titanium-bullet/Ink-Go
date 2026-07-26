import { BLACK, type Color, type Score } from "../../go/types";
import { Seal } from "./Seal";
import { useT } from "../../i18n/LanguageContext";

type Winner = Color | "tie";

export interface ResultOverlayProps {
  winner: Winner;
  reason: string;
  /** 印章单字：黑 / 白 / 和 */
  sealText: string;
  onRematch: () => void;
  onBack: () => void;
  /** 关闭落地窗，回看棋局（关闭后右侧显示精简结算） */
  onClose?: () => void;
  /** 围棋：返回模式选择页 */
  onSelectMode?: () => void;
  /** 围棋：详细比分 */
  score?: Score;
  /** 五子棋：手数等附注 */
  note?: string;
}

export function ResultOverlay({
  winner,
  reason,
  sealText,
  onRematch,
  onBack,
  onClose,
  onSelectMode,
  score,
  note,
}: ResultOverlayProps) {
  const t = useT();
  const isTie = winner === "tie";
  const winnerName = isTie
    ? t.result.draw
    : winner === BLACK
      ? t.result.blackWin
      : t.result.whiteWin;

  return (
    <div className="result-overlay" role="dialog" aria-modal="true">
      {/* 墨晕扩散揭幕 */}
      <div className="result-bloom" aria-hidden="true" />

      <div className="result-card">
        {/* 印章砸落 */}
        {!isTie && (
          <div className="result-seal-wrap">
            <Seal text={sealText} size={150} className="result-seal" />
          </div>
        )}
        {isTie && <div className="result-seal-wrap result-seal-tie">{t.seal.tie}</div>}

        {/* 墨线书法写胜方 */}
        <p className="result-kicker">{t.result.endKicker}</p>
        <h2 className="result-title">
          <span className="result-title-ink-line" aria-hidden="true">
            <svg viewBox="0 0 320 12" preserveAspectRatio="none">
              <line
                className="result-write-line"
                x1="4"
                y1="6"
                x2="316"
                y2="6"
              />
            </svg>
          </span>
          <span className="result-title-text">{winnerName}</span>
        </h2>
        <p className="result-reason">{reason}</p>

        {/* 围棋比分明细（认输局无数子数据，不渲染空 0/0 行） */}
        {score && score.reason !== "resign" && (
          <div className="result-score">
            <ResultScoreRow
              name={t.result.black}
              area={score.blackArea}
              stones={score.blackStones}
              territory={score.blackTerritory}
              komi={0}
              highlight={!isTie && winner === BLACK}
            />
            <ResultScoreRow
              name={t.result.white}
              area={score.whiteArea}
              stones={score.whiteStones}
              territory={score.whiteTerritory}
              komi={score.komi}
              highlight={!isTie && winner !== BLACK}
            />
            <p className="result-score-foot">{t.result.scoreFoot}</p>
          </div>
        )}

        {note && <p className="result-note">{note}</p>}

        <div className="result-actions">
          <button type="button" className="cta-primary" onClick={onRematch}>
            {t.result.rematch}
          </button>
          {onClose && (
            <button type="button" className="cta-secondary" onClick={onClose}>
              {t.result.review}
            </button>
          )}
          {onSelectMode && (
            <button type="button" className="cta-secondary" onClick={onSelectMode}>
              {t.result.changeMode}
            </button>
          )}
          <button type="button" className="cta-secondary" onClick={onBack}>
            {t.result.backToRealm}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultScoreRow({
  name,
  area,
  stones,
  territory,
  komi,
  highlight,
}: {
  name: string;
  area: number;
  stones: number;
  territory: number;
  komi: number;
  highlight: boolean;
}) {
  const t = useT();
  return (
    <div className={`result-score-row${highlight ? " is-winner" : ""}`}>
      <span className="result-score-name">{name}</span>
      <span className="result-score-detail">
        <span>{t.result.stones} {stones}</span>
        <span>{t.result.territory} {territory}</span>
        {komi > 0 && <span>{t.result.komi} {komi}</span>}
      </span>
      <span className="result-score-total">{area.toFixed(1)}</span>
    </div>
  );
}
