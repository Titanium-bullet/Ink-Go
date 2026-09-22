import { useT } from "../../i18n/LanguageContext";

/** 文钱余额徽章：铜钱造型（金圆方孔）+ 数值 */
export function BalancePill({ balance }: { balance: number }) {
  const t = useT();
  return (
    <span className="balance-pill" title={t.shop.balance}>
      <span className="coin-icon" aria-hidden="true" />
      <span className="balance-num">{balance}</span>
      <span className="balance-unit">{t.shop.coinUnit}</span>
    </span>
  );
}
