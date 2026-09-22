import { useState } from "react";
import { BLACK, WHITE, type Color } from "../../go/types";
import type { AIDifficulty } from "../../ai/types";
import { Atmosphere, type Phase } from "./Atmosphere";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";
import { StoneChip } from "../StoneChip";
import { useWallet } from "../../state/wallet";
import { BalancePill } from "../shop/BalancePill";

export function ModeSelect({
  onConfirm,
  onBack,
  onOpenShop,
}: {
  /** 人机：AI 执子色 + 难度；双人：(null, undefined) */
  onConfirm: (opponent: Color | null, difficulty?: AIDifficulty) => void;
  onBack: () => void;
  onOpenShop: () => void;
}) {
  const t = useT();
  const { balance } = useWallet();
  const [phase] = useState<Phase>("dusk");
  const [vsAI, setVsAI] = useState(true);
  const [playerColor, setPlayerColor] = useState<Color>(BLACK);
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");

  const opponent = vsAI ? (playerColor === BLACK ? WHITE : BLACK) : null;

  return (
    <main className="play-view mode-select" data-phase={phase}>
      <Atmosphere phase={phase} />
      <div className="mode-select-bloom" aria-hidden="true" />

      <header className="play-header">
        <p className="play-brand mode-brand">{t.mode.brand}</p>
        <div className="mode-header-right">
          <BalancePill balance={balance} />
          <LangToggle className="on-light" />
        </div>
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

          {/* 对手棋力（仅人机可选）：棋士 / 国手 两位水墨人物 */}
          <div className={`mode-group${vsAI ? "" : " is-dim"}`}>
            <p className="mode-group-cap">{t.mode.groupDifficulty}</p>
            <div className="mode-cards">
              <ModeCard
                active={vsAI && difficulty === "medium"}
                disabled={!vsAI}
                onClick={() => setDifficulty("medium")}
                label={t.mode.medium}
                desc={t.mode.mediumDesc}
                glyph={<SageGlyph variant="kishi" />}
              />
              <ModeCard
                active={vsAI && difficulty === "strong"}
                disabled={!vsAI}
                onClick={() => setDifficulty("strong")}
                label={t.mode.strong}
                desc={t.mode.strongDesc}
                glyph={<SageGlyph variant="guoshou" />}
              />
            </div>
          </div>

          <div className="mode-actions">
            <button
              type="button"
              className="cta-primary mode-confirm"
              onClick={() => onConfirm(opponent, vsAI ? difficulty : undefined)}
            >
              {t.mode.confirm}
            </button>
            <button type="button" className="cta-secondary" onClick={onOpenShop}>
              {t.nav.shop}
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
  return <StoneChip color={color} size={large ? "2.6rem" : "1.5rem"} />;
}

// 对手人物图示（水墨剪影）：棋士 = 素巾束发的年轻棋客，国手 = 高冠长髯的宽袍长者。
// 剪影 + 宣纸面色 + 一笔金线（交领/冠带），与全站墨/纸/金色板同源。
function SageGlyph({ variant }: { variant: "kishi" | "guoshou" }) {
  const ink = "#17110d";
  const hair = "#2b211a";
  const face = "#d8cfc0";
  const gold = "#d8b36e";
  return (
    <svg
      viewBox="0 0 48 48"
      width="2.6rem"
      height="2.6rem"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {variant === "kishi" ? (
        <>
          {/* 素巾束发 */}
          <path d="M16.5 10.5 C18.5 5 29.5 5 31.5 10.5 L30 13.6 C27 11.4 21 11.4 18 13.6 Z" fill={hair} />
          <circle cx="24" cy="17.5" r="7.6" fill={hair} />
          <ellipse cx="24" cy="18.8" rx="5.6" ry="6.4" fill={face} />
          {/* 交领袍 */}
          <path d="M7 46 C8.5 33 15 26.5 24 26.5 C33 26.5 39.5 33 41 46 Z" fill={ink} />
          <path
            d="M17.5 28 L24 36.5 L30.5 28"
            fill="none" stroke={gold} strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="21.4" cy="17.8" r="1" fill={ink} />
          <circle cx="26.6" cy="17.8" r="1" fill={ink} />
        </>
      ) : (
        <>
          {/* 进贤冠 + 金冠带 */}
          <path d="M18.5 4 L29.5 4 L28 11 L20 11 Z" fill={hair} />
          <rect x="16.5" y="10.2" width="15" height="2.6" rx="1.3" fill={gold} opacity="0.9" />
          <circle cx="24" cy="17.5" r="7.2" fill={hair} />
          <ellipse cx="24" cy="18.8" rx="5.3" ry="6.1" fill={face} />
          {/* 宽袍大袖 */}
          <path d="M4.5 46 C6 33 15 26 24 26 C33 26 42 33 43.5 46 Z" fill={ink} />
          {/* 长髯三缕垂胸 */}
          <path d="M20.3 24 C19.3 29.5 20.3 34.5 18.6 39.5" fill="none" stroke={hair} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M24 24.5 L24 41.5" fill="none" stroke={hair} strokeWidth="1.9" strokeLinecap="round" />
          <path d="M27.7 24 C28.7 29.5 27.7 34.5 29.4 39.5" fill="none" stroke={hair} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="21.4" cy="18" r="1" fill={ink} />
          <circle cx="26.6" cy="18" r="1" fill={ink} />
        </>
      )}
    </svg>
  );
}
