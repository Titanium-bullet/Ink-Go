import { useState } from "react";
import { BLACK, WHITE, type Color } from "../../go/types";
import { Atmosphere, type Phase } from "./Atmosphere";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";

export function ModeSelect({
  onConfirm,
  onBack,
}: {
  /** 人机：AI 执子色；双人：null */
  onConfirm: (opponent: Color | null) => void;
  onBack: () => void;
}) {
  const t = useT();
  const [phase] = useState<Phase>("dusk");
  const [vsAI, setVsAI] = useState(true);
  const [playerColor, setPlayerColor] = useState<Color>(BLACK);

  const opponent = vsAI ? (playerColor === BLACK ? WHITE : BLACK) : null;

  return (
    <main className="play-view mode-select" data-phase={phase}>
      <Atmosphere phase={phase} />
      <div className="mode-select-bloom" aria-hidden="true" />

      <header className="play-header">
        <p className="play-brand mode-brand">{t.mode.brand}</p>
        <LangToggle className="on-light" />
      </header>

      <div className="mode-select-stage">
        <div className="mode-select-inner">
          <p className="mode-kicker">{t.mode.kicker}</p>
          <h2 className="mode-title">{t.mode.title}</h2>
          <p className="mode-sub">{t.mode.sub}</p>

          {/* 对手 */}
          <div className="mode-group">
            <p className="mode-group-cap">{t.mode.groupOpponent}</p>
            <div className="mode-cards">
              <ModeCard
                active={vsAI}
                onClick={() => setVsAI(true)}
                label={t.mode.vsAI}
                desc={t.mode.vsAIDesc}
                glyph={
                  <span className="mode-stone-pair">
                    <MiniStone color={BLACK} />
                    <MiniStone color={WHITE} />
                  </span>
                }
              />
              <ModeCard
                active={!vsAI}
                onClick={() => setVsAI(false)}
                label={t.mode.vsHuman}
                desc={t.mode.vsHumanDesc}
                glyph={
                  <span className="mode-stone-pair">
                    <MiniStone color={WHITE} />
                    <MiniStone color={BLACK} />
                  </span>
                }
              />
            </div>
          </div>

          {/* 执子（仅人机可选） */}
          <div className={`mode-group${vsAI ? "" : " is-dim"}`}>
            <p className="mode-group-cap">{t.mode.groupColor}</p>
            <div className="mode-cards">
              <ModeCard
                active={vsAI && playerColor === BLACK}
                disabled={!vsAI}
                onClick={() => setPlayerColor(BLACK)}
                label={t.mode.blackFirst}
                desc={t.mode.blackFirstDesc}
                glyph={<MiniStone color={BLACK} large />}
              />
              <ModeCard
                active={vsAI && playerColor === WHITE}
                disabled={!vsAI}
                onClick={() => setPlayerColor(WHITE)}
                label={t.mode.whiteSecond}
                desc={t.mode.whiteSecondDesc}
                glyph={<MiniStone color={WHITE} large />}
              />
            </div>
          </div>

          <div className="mode-actions">
            <button
              type="button"
              className="cta-primary mode-confirm"
              onClick={() => onConfirm(opponent)}
            >
              {t.mode.confirm}
            </button>
            <button type="button" className="cta-secondary" onClick={onBack}>
              {t.mode.back}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ModeCard({
  active,
  onClick,
  label,
  desc,
  glyph,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  glyph: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`mode-card${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mode-card-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="mode-card-label">{label}</span>
      <span className="mode-card-desc">{desc}</span>
    </button>
  );
}

function MiniStone({
  color,
  large,
}: {
  color: Color;
  large?: boolean;
}) {
  const size = large ? "2.6rem" : "1.5rem";
  return (
    <span
      className="mini-stone"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        background:
          color === BLACK
            ? "radial-gradient(circle at 35% 30%, #6a5648, #050403 70%)"
            : "radial-gradient(circle at 35% 30%, #ffffff, #c9bda4 72%)",
        boxShadow:
          color === BLACK
            ? "0 2px 10px rgba(0,0,0,0.55), inset 0 0 6px rgba(0,0,0,0.4)"
            : "0 2px 10px rgba(255,255,255,0.28), inset 0 0 6px rgba(0,0,0,0.08)",
      }}
    />
  );
}
