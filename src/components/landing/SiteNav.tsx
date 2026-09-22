import { useEffect, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";

/**
 * 常驻 slim 导航：滚出 Hero 后淡入下滑出现，并对当前 section 做高亮（scroll-spy）。
 * 高亮判定：让一条贴近视口上 1/3 的细带与各 section 求交，相交者即当前段。
 */
export function SiteNav({ onPlay, onOpenShop }: { onPlay: () => void; onOpenShop: () => void }) {
  const t = useT();
  const LINKS = [
    { id: "rules", label: t.nav.rules },
    { id: "effects", label: t.nav.effects },
    { id: "weather", label: t.nav.weather },
    { id: "dlc", label: t.nav.gomoku },
    { id: "about", label: t.nav.about },
  ];
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShown(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-38% 0px -58% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  return (
    <nav className={`site-nav${shown ? " is-visible" : ""}`} aria-label={t.nav.aria}>
      <a className="nav-brand" href="#top">
        {t.nav.brand}
      </a>
      <div className="nav-links">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className={active === l.id ? "is-active" : ""}
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className="nav-actions">
        <LangToggle />
        <button type="button" className="nav-play nav-shop" onClick={onOpenShop}>
          {t.nav.shop}
        </button>
        <button type="button" className="nav-play" onClick={onPlay}>
          {t.nav.play}
        </button>
      </div>
    </nav>
  );
}
