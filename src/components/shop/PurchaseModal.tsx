import { useEffect, useRef, useState } from "react";
import { format, useT } from "../../i18n/LanguageContext";
import { PRODUCTS, useWallet, type ProductId } from "../../state/wallet";
import { Seal } from "../game/Seal";

/**
 * 购入确认弹窗（复用 result-overlay 视觉）：确认 → 红印盖章 → 自动关闭。
 * onPurchased 在盖章展示完毕后回调（如购买 DLC 后直接入局）。
 */
export function PurchaseModal({
  product,
  onClose,
  onPurchased,
}: {
  product: ProductId;
  onClose: () => void;
  onPurchased?: () => void;
}) {
  const t = useT();
  const { balance, purchase } = useWallet();
  const [stage, setStage] = useState<"confirm" | "done">("confirm");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const price = PRODUCTS[product].price;
  const name = t.shop.products[product].name;
  const affordable = balance >= price;

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === "confirm") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, onClose]);

  const confirm = () => {
    if (!purchase(product)) return;
    setStage("done");
    // 展示盖章后收尾：有回调（如 DLC 买完入局）则回调，否则自动关闭
    window.setTimeout(() => {
      if (onPurchased) onPurchased();
      else onClose();
    }, 1250);
  };

  return (
    <div className="result-overlay shop-modal" role="dialog" aria-modal="true" aria-label={t.shop.purchaseTitle}>
      <div className="result-bloom" onClick={stage === "confirm" ? onClose : undefined} />
      <div className="result-card shop-modal-card">
        {stage === "confirm" ? (
          <>
            <p className="shop-modal-kicker">{t.shop.purchaseTitle}</p>
            <h3 className="shop-modal-name">{name}</h3>
            <p className="shop-modal-desc">{t.shop.products[product].desc}</p>
            <p className="shop-modal-price">
              {format(t.shop.purchaseDesc, { price: String(price), name })}
            </p>
            <p className="shop-modal-balance">
              {format(t.shop.purchaseBalance, { balance: String(balance) })}
            </p>
            <div className="result-actions">
              <button
                ref={confirmRef}
                type="button"
                className="goban-btn primary"
                disabled={!affordable}
                onClick={confirm}
              >
                {affordable
                  ? t.shop.confirmBuy
                  : format(t.shop.insufficient, { lack: String(price - balance) })}
              </button>
              <button type="button" className="goban-btn" onClick={onClose}>
                {t.shop.purchaseCancel}
              </button>
            </div>
          </>
        ) : (
          <div className="shop-modal-done">
            <Seal text={t.shop.stampText} size={92} className="shop-seal" />
            <h3 className="shop-modal-name">{name}</h3>
            <p className="shop-modal-owned">{t.shop.owned}</p>
          </div>
        )}
      </div>
    </div>
  );
}
