import { useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { FAVICONS, applyFavicon, faviconDataUri } from "./FaviconDefs";

/** 站点图标方案选择器：点击即时把该方案应用为浏览器标签图标（默认为「双弈」） */
export function FaviconPicker() {
  const t = useT();
  const [active, setActive] = useState<string>("pair");
  return (
    <div className="favicon-picker">
      <p className="panel-cap">{t.effects.faviconCap}</p>
      <div className="favicon-row">
        {FAVICONS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`favicon-opt${active === f.id ? " is-active" : ""}`}
            onClick={() => {
              applyFavicon(f.svg);
              setActive(f.id);
            }}
          >
            <img
              src={faviconDataUri(f.svg)}
              alt={t.effects.faviconNames[f.nameKey]}
              width={34}
              height={34}
            />
            <span>{t.effects.faviconNames[f.nameKey]}</span>
          </button>
        ))}
      </div>
      <p className="favicon-hint">{t.effects.faviconHint}</p>
    </div>
  );
}
