import { useEffect, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { localToday, useWallet } from "../../state/wallet";

const DISMISS_KEY = "inkgo-daily-hint-day";

/**
 * 每日文钱提醒弹窗（仿 LangHint）：当天未领取时浮现，
 * 「去领取」跳往墨阁并当日不再提醒；× 仅当日关闭。
 */
export function WalletHint({ onClaim }: { onClaim: () => void }) {
  const t = useT();
  const { canClaimDaily } = useWallet();
  const [dismissedDay, setDismissedDay] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissedDay(localStorage.getItem(DISMISS_KEY));
    } catch {
      setDismissedDay(null);
    }
    setReady(true);
  }, []);

  if (!ready || !canClaimDaily || dismissedDay === localToday()) return null;

  const dismiss = () => {
    const today = localToday();
    setDismissedDay(today);
    try {
      localStorage.setItem(DISMISS_KEY, today);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="lang-hint wallet-hint" role="status">
      <span className="lang-hint-pointer" aria-hidden="true" />
      <span className="lang-hint-dot" aria-hidden="true" />
      <p className="lang-hint-text">{t.shop.dailyHintMessage}</p>
      <div className="lang-hint-actions">
        <button
          type="button"
          className="lang-hint-cta"
          onClick={() => {
            dismiss();
            onClaim();
          }}
        >
          {t.shop.dailyHintCta}
        </button>
        <button
          type="button"
          className="lang-hint-close"
          onClick={dismiss}
          aria-label={t.shop.dailyHintDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
