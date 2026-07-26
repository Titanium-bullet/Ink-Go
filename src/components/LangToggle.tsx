import { useLang, useT } from "../i18n/LanguageContext";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, toggle } = useLang();
  const t = useT();
  const isEn = lang === "en";
  return (
    <button
      type="button"
      className={`lang-toggle${isEn ? " is-en" : ""}${className ? ` ${className}` : ""}`}
      onClick={toggle}
      aria-label={t.langToggle.aria}
      role="switch"
      aria-checked={isEn}
    >
      <span className="lang-toggle-track">
        <span className="lang-toggle-opt">{t.langToggle.zh}</span>
        <span className="lang-toggle-opt">{t.langToggle.en}</span>
      </span>
      <span className="lang-toggle-knob" />
    </button>
  );
}
