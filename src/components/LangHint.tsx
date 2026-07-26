import { useEffect, useState } from "react";
import { useLang, useT } from "../i18n/LanguageContext";

const DISMISS_KEY = "inkgo-lang-hint-dismissed";

export function LangHint() {
  const { lang, setLang } = useLang();
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Only nudge English users toward Chinese; hide once switched or dismissed.
  if (lang !== "en" || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="lang-hint" role="status">
      <span className="lang-hint-pointer" aria-hidden="true" />
      <span className="lang-hint-dot" aria-hidden="true" />
      <p className="lang-hint-text">{t.langHint.message}</p>
      <div className="lang-hint-actions">
        <button
          type="button"
          className="lang-hint-cta"
          onClick={() => setLang("zh")}
        >
          {t.langHint.cta}
        </button>
        <button
          type="button"
          className="lang-hint-close"
          onClick={dismiss}
          aria-label={t.langHint.dismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
