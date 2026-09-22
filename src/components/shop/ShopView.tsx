import { useState } from "react";
import { format, useT } from "../../i18n/LanguageContext";
import { MATERIALS, type BoardTheme } from "../board/materials";
import { BLACK, WHITE } from "../../go/types";
import { StoneChip } from "../StoneChip";
import { DAILY_REWARD, PRODUCTS, useWallet, type ProductId } from "../../state/wallet";
import { BalancePill } from "./BalancePill";
import { MoquanLogo, WenCard } from "./BankBrand";
import { PurchaseModal } from "./PurchaseModal";
import { ShopBackdrop } from "./ShopBackdrop";

/** 材质小样：盘面渐变 + 三路网格 + 一对棋子 */
function Swatch({ theme }: { theme: BoardTheme }) {
  const mat = MATERIALS[theme];
  const gid = `swatch-${theme}`;
  return (
    <svg className="shop-swatch" viewBox="0 0 72 72" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          {mat.face.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="64" height="64" rx="10" fill={`url(#${gid})`} />
      <g stroke={mat.grid.color} strokeOpacity={Math.min(1, mat.grid.opacity)} strokeWidth="1.4">
        {[16, 36, 56].map((v) => (
          <line key={`v${v}`} x1={v} y1="9" x2={v} y2="63" />
        ))}
        {[16, 36, 56].map((v) => (
          <line key={`h${v}`} x1="9" y1={v} x2="63" y2={v} />
        ))}
      </g>
      <rect x="4" y="4" width="64" height="64" rx="10" fill="none" stroke={mat.bevel[0].color} strokeOpacity={mat.bevel[0].opacity ?? 0.6} strokeWidth="2" />
      <circle cx="36" cy="36" r="7.5" fill="#120d0a" />
      {mat.blackRim && <circle cx="36" cy="36" r="7" fill="none" stroke={mat.blackRim.color} strokeWidth="1" />}
      <circle cx="50" cy="50" r="7.5" fill="#f3ecdc" />
    </svg>
  );
}

type CardState =
  | { kind: "buy" }
  | { kind: "insufficient"; lack: number }
  | { kind: "owned" }
  | { kind: "inUse" }
  | { kind: "defaultWood" }
  | { kind: "enter" };

export function ShopView({
  onBack,
  onEnterGomoku,
}: {
  onBack: () => void;
  onEnterGomoku: () => void;
}) {
  const t = useT();
  const { balance, owned, equippedBoard, equipBoard, canClaimDaily, claimDaily } = useWallet();
  const [pending, setPending] = useState<ProductId | null>(null);

  const owns = (id: ProductId) => owned.includes(id);

  const cardState = (kind: "board" | "dlc" | "effects", id: ProductId, theme?: BoardTheme): CardState => {
    if (kind === "board") {
      if (theme === "wood") return equippedBoard === "wood" ? { kind: "inUse" } : { kind: "defaultWood" };
      if (owns(id)) return equippedBoard === theme ? { kind: "inUse" } : { kind: "owned" };
    } else if (owns(id)) {
      return kind === "dlc" ? { kind: "enter" } : { kind: "owned" };
    }
    const lack = PRODUCTS[id].price - balance;
    return lack > 0 ? { kind: "insufficient", lack } : { kind: "buy" };
  };

  const renderCard = (args: {
    id: ProductId | "skin-wood";
    kind: "board" | "dlc" | "effects";
    theme?: BoardTheme;
  }) => {
    const { id, kind, theme } = args;
    const price = id in PRODUCTS ? PRODUCTS[id as ProductId].price : null;
    const name = t.shop.products[id].name;
    const desc = t.shop.products[id].desc;
    const state = cardState(kind, id as ProductId, theme);
    return (
      <div key={id} className={`shop-card is-${state.kind}`}>
        <div className="shop-card-visual">
          {theme ? (
            <Swatch theme={theme} />
          ) : kind === "dlc" ? (
            <span className="shop-card-glyph" aria-hidden="true">
              <StoneChip color={BLACK} size="2rem" />
              <StoneChip color={WHITE} size="2rem" />
            </span>
          ) : (
            <span className="shop-card-glyph" aria-hidden="true">
              <span className="coin-icon coin-icon-lg" />
            </span>
          )}
        </div>
        <h3 className="shop-card-name">{name}</h3>
        <p className="shop-card-desc">{desc}</p>
        <div className="shop-card-foot">
          <span className="shop-price">
            {(state.kind === "buy" || state.kind === "insufficient") && price !== null
              ? format(t.shop.priceTag, { price: String(price) })
              : state.kind === "inUse"
                ? t.shop.inUse
                : t.shop.owned}
          </span>
          {state.kind === "buy" && price !== null && (
            <button type="button" className="goban-btn primary shop-buy" onClick={() => setPending(id as ProductId)}>
              {t.shop.buy}
            </button>
          )}
          {state.kind === "insufficient" && (
            <button type="button" className="goban-btn shop-buy" disabled>
              {format(t.shop.insufficient, { lack: String(state.lack) })}
            </button>
          )}
          {state.kind === "owned" && kind === "board" && (
            <button type="button" className="goban-btn primary shop-buy" onClick={() => equipBoard(theme!)}>
              {t.shop.use}
            </button>
          )}
          {state.kind === "defaultWood" && (
            <button type="button" className="goban-btn primary shop-buy" onClick={() => equipBoard("wood")}>
              {t.shop.use}
            </button>
          )}
          {state.kind === "enter" && (
            <button type="button" className="goban-btn primary shop-buy" onClick={onEnterGomoku}>
              {t.dlc.enterGomoku}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="play-view shop-view" data-phase="dusk">
      <ShopBackdrop />

      <header className="play-header">
        <button type="button" className="back-link" onClick={onBack}>
          {t.shop.back}
        </button>
        <p className="play-brand">{t.game.brand}</p>
      </header>

      <div className="shop-stage">
        <div className="shop-head">
          <div>
            <p className="shop-kicker">{t.shop.kicker}</p>
            <h1 className="shop-title">{t.shop.title}</h1>
            <p className="shop-sub">{t.shop.sub}</p>
          </div>
          <BalancePill balance={balance} />
        </div>

        {/* 每日登录领取条 */}
        <div className={`shop-daily${canClaimDaily ? " is-claimable" : ""}`}>
          <span className="coin-icon coin-icon-lg" aria-hidden="true" />
          <div className="shop-daily-text">
            <p className="shop-daily-cap">{t.shop.dailyCap}</p>
            <p className="shop-daily-sub">
              {canClaimDaily ? t.shop.dailySub : t.shop.dailyClaimed}
            </p>
          </div>
          {canClaimDaily && (
            <button
              type="button"
              className="goban-btn primary shop-daily-cta"
              onClick={() => claimDaily()}
            >
              {format(t.shop.dailyClaimCta, { amount: String(DAILY_REWARD) })}
            </button>
          )}
        </div>

        <section className="shop-group">
          <h2 className="shop-group-cap">{t.shop.groups.boards}</h2>
          <div className="shop-cards">
            {renderCard({ id: "skin-paper", kind: "board", theme: "paper" })}
            {renderCard({ id: "skin-lacquer", kind: "board", theme: "lacquer" })}
            {renderCard({ id: "skin-wood", kind: "board", theme: "wood" })}
          </div>
        </section>

        <div className="shop-duo">
          <section className="shop-group">
            <h2 className="shop-group-cap">{t.shop.groups.gameplay}</h2>
            <div className="shop-cards">
              {renderCard({ id: "gomoku-dlc", kind: "dlc" })}
            </div>
          </section>

          <section className="shop-group">
            <h2 className="shop-group-cap">{t.shop.groups.effects}</h2>
            <div className="shop-cards">
              {renderCard({ id: "ink-effects", kind: "effects" })}
            </div>
          </section>
        </div>

        <section className="shop-group shop-bank-group">
          <h2 className="shop-group-cap">{t.shop.bank.cap}</h2>
          <div className="shop-bank">
            <div className="shop-bank-info">
              <MoquanLogo size={104} />
              <h3 className="shop-bank-name">{t.shop.bank.name}</h3>
              <p className="shop-bank-en">{t.shop.bank.enName}</p>
              <p className="shop-bank-motto">{t.shop.bank.motto}</p>
              <p className="shop-bank-desc">{t.shop.bank.desc}</p>
              <p className="shop-bank-exclusive">{t.shop.bank.exclusive}</p>
            </div>
            <div className="shop-bank-card">
              <WenCard />
            </div>
          </div>
        </section>
      </div>

      {pending && (
        <PurchaseModal product={pending} onClose={() => setPending(null)} />
      )}
    </main>
  );
}
