import { useEffect, useState } from "react";
import { PlayView } from "./components/game/PlayView";
import { DemoPanel } from "./components/game/DemoPanel";
import { ModeSelect } from "./components/game/ModeSelect";
import { GomokuView } from "./components/gomoku/GomokuView";
import { ShopView } from "./components/shop/ShopView";
import { PurchaseModal } from "./components/shop/PurchaseModal";
import { WalletHint } from "./components/shop/WalletHint";
import { Reveal } from "./components/landing/Reveal";
import { InkDivider } from "./components/landing/InkDivider";
import { AmbientLayer } from "./components/landing/AmbientLayer";
import { SiteNav } from "./components/landing/SiteNav";
import { WeatherStage } from "./components/landing/WeatherStage";
import { Hero } from "./components/landing/Hero";
import { RulesScroll } from "./components/landing/RulesScroll";
import { LangHint } from "./components/LangHint";
import { HeroDemo } from "./components/landing/HeroDemo";
import { GomokuInkPreview } from "./components/landing/GomokuInkPreview";
import { AboutDeveloper } from "./components/landing/AboutDeveloper";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { useScrollParallax, usePauseOffscreen } from "./hooks/useScrollParallax";
import { useReveal } from "./hooks/useReveal";
import { useInkCursor } from "./hooks/useInkCursor";
import { useT } from "./i18n/LanguageContext";
import { useWallet, PRODUCTS } from "./state/wallet";
import type { Color } from "./go/types";
import type { AIDifficulty } from "./ai/types";

export default function App() {
  const [view, setView] = useState<
    "landing" | "select" | "go" | "gomoku" | "herodemo" | "shop"
  >("landing");
  const [goOpponent, setGoOpponent] = useState<Color | null>(null);
  const [goDifficulty, setGoDifficulty] =
    useState<AIDifficulty>("medium");

  // 切换视图时回到页首：落地页深部进对弈/商店时，残留滚动会让新视图顶部被滚出视口
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // hash 直达路由：#hero-demo 方案对比 / #shop 墨阁（刷新与分享直达）
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      if (hash === "#hero-demo") {
        setView((v) => (v === "herodemo" ? v : "herodemo"));
      } else if (hash === "#shop") {
        setView((v) => (v === "shop" ? v : "shop"));
      } else {
        setView((v) => (v === "herodemo" ? "landing" : v));
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  if (view === "herodemo") {
    return <HeroDemo />;
  }
  if (view === "shop") {
    return (
      <ShopView
        onBack={() => setView("landing")}
        onEnterGomoku={() => setView("gomoku")}
      />
    );
  }
  if (view === "select") {
    return (
      <ModeSelect
        onConfirm={(opp, difficulty) => {
          setGoOpponent(opp);
          if (difficulty) setGoDifficulty(difficulty);
          setView("go");
        }}
        onBack={() => setView("landing")}
        onOpenShop={() => setView("shop")}
      />
    );
  }
  if (view === "go") {
    return (
      <PlayView
        opponent={goOpponent}
        difficulty={goDifficulty}
        onBack={() => setView("landing")}
        onSelectMode={() => setView("select")}
        onOpenShop={() => setView("shop")}
      />
    );
  }
  if (view === "gomoku") {
    return <GomokuView onBack={() => setView("landing")} />;
  }
  return (
    <Landing
      onPlay={() => setView("select")}
      onOpenShop={() => setView("shop")}
      onPlayGomoku={() => setView("gomoku")}
    />
  );
}

function Landing({
  onPlay,
  onOpenShop,
  onPlayGomoku,
}: {
  onPlay: () => void;
  onOpenShop: () => void;
  onPlayGomoku: () => void;
}) {
  const t = useT();
  const { owns } = useWallet();
  const [dlcModal, setDlcModal] = useState(false);
  // 连珠 DLC：未拥有时先弹购入确认，盖章后直接入局
  const gomokuEntry = () => {
    if (owns("gomoku-dlc")) onPlayGomoku();
    else setDlcModal(true);
  };
  const progressRef = useScrollProgress<HTMLDivElement>();
  const [effectsRef, effectsVisible] = useReveal<HTMLElement>();
  const [dlcRef, dlcVisible] = useReveal<HTMLElement>();
  const dlcPxRef = useScrollParallax<HTMLDivElement>(0.6);
  const inkRef = useInkCursor<HTMLDivElement>();
  const effectsPauseRef = usePauseOffscreen<HTMLDivElement>();
  const weatherPauseRef = usePauseOffscreen<HTMLDivElement>();
  const dlcPauseRef = usePauseOffscreen<HTMLDivElement>();
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4efe4] text-[#201916]">
      <AmbientLayer />
      <div ref={inkRef} className="ink-cursor-layer" aria-hidden="true" />
      <SiteNav onPlay={onPlay} onOpenShop={onOpenShop} />
      {/* 两张提示卡共用一个锚点纵向堆叠，互不重叠 */}
      <div className="hint-stack">
        <LangHint />
        <WalletHint onClaim={onOpenShop} />
      </div>
      <div ref={progressRef} className="scroll-progress" aria-hidden="true">
        <span />
      </div>
      <Hero onPlay={onPlay} onOpenShop={onOpenShop} />


      <section id="rules" className="relative px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.95fr_1.4fr] lg:items-start">
          <Reveal variant="wipe" className="sticky top-10 space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#896b41]">{t.rules.kicker}</p>
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.rules.title}
            </h2>
            <p className="max-w-lg text-lg leading-8 text-[#695d51]">
              {t.rules.sub}
            </p>
            <div className="pt-4">
              <RulesScroll />
            </div>
          </Reveal>

          <div className="space-y-12 border-l border-[#201916]/15 pl-8 sm:pl-12">
            {t.rules.notes.map((item, index) => (
              <Reveal
                key={item.title}
                as="article"
                i={index}
                variant="bloom"
                className="ink-card grid gap-5 sm:grid-cols-[5rem_1fr]"
              >
                <span className="ink-num text-5xl font-light text-[#b79d72]">0{index + 1}</span>
                <div className="space-y-3">
                  <h3 className="text-2xl font-medium">{item.title}</h3>
                  <p className="max-w-2xl text-lg leading-8 text-[#695d51]">{item.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <InkDivider />
      </div>


      <section
        id="effects"
        ref={effectsRef}
        className={`cv-auto relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
          effectsVisible ? " is-visible" : ""
        }`}
      >
        <div className="ink-bloom-sweep" aria-hidden="true" />
        <div className="absolute inset-0 beast-wash opacity-40" />
        <div ref={effectsPauseRef} className="relative mx-auto max-w-7xl">
          <Reveal variant="wipe" className="mb-14 max-w-3xl space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#d8b36e]">{t.effects.kicker}</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.effects.title}</h2>
            <p className="text-lg leading-8 text-[#d8cfc0]">
              {t.effects.desc}
            </p>
          </Reveal>
          <DemoPanel />
        </div>
      </section>


      <section id="weather" className="cv-auto relative px-6 py-24 sm:px-10 lg:px-16">
        <div ref={weatherPauseRef} className="mx-auto max-w-7xl">
          <Reveal variant="wipe" className="mb-10 max-w-3xl space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#896b41]">{t.weather.kicker}</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.weather.title}</h2>
            <p className="text-lg leading-8 text-[#695d51]">
              {t.weather.desc}
            </p>
          </Reveal>
          <Reveal variant="bloom" i={0}>
            <WeatherStage />
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <InkDivider />
      </div>


      <section
        id="dlc"
        ref={dlcRef}
        className={`cv-auto relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
          dlcVisible ? " is-visible" : ""
        }`}
      >
        <div className="ink-bloom-sweep" aria-hidden="true" style={{ ["--bx" as string]: "70%" }} />
        <div className="absolute inset-0 beast-wash opacity-40" />
        <div ref={dlcPauseRef} className="relative mx-auto max-w-7xl">
          <Reveal variant="wipe" className="mb-14 max-w-3xl space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#d8b36e]">{t.dlc.kicker}</p>
            <h2 className="whitespace-nowrap text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.lang === "zh" ? (
                <>
                  {t.dlc.titleLead}
                  <span
                    className="tracking-[0.04em]"
                    style={{
                      display: "inline-block",
                      fontFamily: '"Georgia", "Cambria", "Times New Roman", serif',
                      fontSize: "1.14em",
                      lineHeight: 1,
                      fontWeight: 400,
                      transform: "translateY(0.06em)",
                    }}
                  >
                    DLC
                  </span>
                  {t.dlc.titleTail}
                </>
              ) : (
                <>
                  {t.dlc.titleLead} DLC{t.dlc.titleTail}
                </>
              )}
            </h2>
            <p className="text-lg leading-8 text-[#d8cfc0]">
               {t.dlc.desc}
            </p>
          </Reveal>

          <div className="grid gap-16 lg:grid-cols-[0.95fr_1.4fr] lg:items-start">
            <Reveal variant="bloom" className="sticky top-10 space-y-8">
              <div ref={dlcPxRef} className="scroll-mid">
                <GomokuInkPreview />
              </div>
              <div className="flex flex-wrap gap-4">
                <button type="button" className="cta-primary" onClick={gomokuEntry}>
                  {owns("gomoku-dlc") ? (
                    t.dlc.enterGomoku
                  ) : (
                    <>
                      {t.dlc.unlockGomoku}
                      <span
                        className="cta-price"
                        aria-label={`${t.shop.balance} ${PRODUCTS["gomoku-dlc"].price}`}
                      >
                        <span className="coin-icon coin-icon-sm" aria-hidden="true" />
                        {PRODUCTS["gomoku-dlc"].price}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </Reveal>

            <div className="space-y-12 border-l border-[#f4efe4]/15 pl-8 sm:pl-12">
              {t.dlc.notes.map((item, index) => (
                <Reveal
                  key={item.title}
                  as="article"
                  i={index}
                  variant="bloom"
                  className="ink-card grid gap-5 sm:grid-cols-[5rem_1fr]"
                >
                  <span className="ink-num text-5xl font-light text-[#b79d72]">0{index + 1}</span>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-medium">{item.title}</h3>
                    <p className="max-w-2xl text-lg leading-8 text-[#d8cfc0]">{item.copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section id="why" className="cv-auto relative px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal variant="wipe" i={0}>
            <p className="mb-5 text-sm tracking-[0.5em] text-[#896b41]">{t.why.kicker}</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">{t.why.title}</h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 text-left md:grid-cols-3">
            {t.why.points.map((copy, index) => (
              <Reveal
                key={copy}
                as="p"
                i={index + 1}
                variant="bloom"
                className="ink-card border-t border-[#201916]/20 pt-5 text-lg leading-8 text-[#695d51]"
              >
                {copy}
              </Reveal>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <button type="button" className="cta-primary cta-ink" onClick={onPlay}>
              <span className="ink-stones" aria-hidden="true">
                <i className="is-black" />
                <i className="is-white" />
              </span>
              {t.why.experienceGo}
            </button>
            <button type="button" className="cta-primary cta-ink" onClick={gomokuEntry}>
              <span className="ink-stones ink-stones--row5" aria-hidden="true">
                <i /><i /><i /><i /><i />
              </span>
              {t.why.experienceGomoku}
            </button>
          </div>
        </div>
      </section>


      <AboutDeveloper />

      {dlcModal && (
        <PurchaseModal
          product="gomoku-dlc"
          onClose={() => setDlcModal(false)}
          onPurchased={onPlayGomoku}
        />
      )}
    </main>
  );
}
