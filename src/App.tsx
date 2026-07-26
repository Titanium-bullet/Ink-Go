import { useState, type CSSProperties } from "react";
import { PlayView } from "./components/game/PlayView";
import { DemoPanel } from "./components/game/DemoPanel";
import { ModeSelect } from "./components/game/ModeSelect";
import { GomokuView } from "./components/gomoku/GomokuView";
import { Reveal } from "./components/landing/Reveal";
import { InkDivider } from "./components/landing/InkDivider";
import { WeatherIcon } from "./components/landing/WeatherIcon";
import { AmbientLayer } from "./components/landing/AmbientLayer";
import { SiteNav } from "./components/landing/SiteNav";
import { useParallax } from "./hooks/useParallax";
import { useInkCursor } from "./hooks/useInkCursor";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { useScrollParallax, usePauseOffscreen } from "./hooks/useScrollParallax";
import { useReveal } from "./hooks/useReveal";
import { useT } from "./i18n/LanguageContext";
import { LangToggle } from "./components/LangToggle";
import { LangHint } from "./components/LangHint";
import type { Color } from "./go/types";
import type { Phase } from "./go/types";

const WEATHER_PHASES: Phase[] = ["dawn", "noon", "dusk", "night"];

export default function App() {
  const [view, setView] = useState<"landing" | "select" | "go" | "gomoku">(
    "landing",
  );
  const [goOpponent, setGoOpponent] = useState<Color | null>(null);
  if (view === "select") {
    return (
      <ModeSelect
        onConfirm={(opp) => {
          setGoOpponent(opp);
          setView("go");
        }}
        onBack={() => setView("landing")}
      />
    );
  }
  if (view === "go") {
    return (
      <PlayView
        opponent={goOpponent}
        onBack={() => setView("landing")}
        onSelectMode={() => setView("select")}
      />
    );
  }
  if (view === "gomoku") {
    return <GomokuView onBack={() => setView("landing")} />;
  }
  return (
    <Landing
      onPlay={() => setView("select")}
      onPlayGomoku={() => setView("gomoku")}
    />
  );
}

function Landing({
  onPlay,
  onPlayGomoku,
}: {
  onPlay: () => void;
  onPlayGomoku: () => void;
}) {
  const t = useT();
  const weatherPhases = t.weather.phases.map((p, i) => ({
    name: p.name,
    phase: WEATHER_PHASES[i],
    line: p.line,
  }));
  const progress = useScrollProgress();
  const [effectsRef, effectsVisible] = useReveal<HTMLElement>();
  const [dlcRef, dlcVisible] = useReveal<HTMLElement>();
  const dlcPxRef = useScrollParallax<HTMLDivElement>(0.6);
  const weatherPxRef = useScrollParallax<HTMLDivElement>(0.5);
  const inkRef = useInkCursor<HTMLDivElement>();
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4efe4] text-[#201916]">
      <AmbientLayer />
      <div ref={inkRef} className="ink-cursor-layer" aria-hidden="true" />
      <SiteNav onPlay={onPlay} />
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <Hero onPlay={onPlay} />

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
        className={`relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
          effectsVisible ? " is-visible" : ""
        }`}
      >
        <div className="ink-bloom-sweep" aria-hidden="true" />
        <div className="absolute inset-0 beast-wash opacity-40" />
        <div className="relative mx-auto max-w-7xl">
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

      <section id="weather" className="relative px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="wipe" className="mb-16 max-w-3xl space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#896b41]">{t.weather.kicker}</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.weather.title}</h2>
            <p className="text-lg leading-8 text-[#695d51]">
              {t.weather.desc}
            </p>
          </Reveal>
          <div ref={weatherPxRef} className="scroll-slow">
            <div className="weather-river grid gap-8 md:grid-cols-4">
              {weatherPhases.map((phase, index) => (
                <Reveal
                  key={phase.name}
                  as="article"
                  i={index}
                  variant="bloom"
                  className="weather-phase ink-card min-h-52 border-t border-[#201916]/20 pt-6"
                >
                  <WeatherIcon phase={phase.phase} />
                  <h3 className="mb-5 text-6xl font-light text-[#b79d72]">{phase.name}</h3>
                  <p className="text-lg leading-8 text-[#695d51]">{phase.line}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <InkDivider />
      </div>

      <section
        id="dlc"
        ref={dlcRef}
        className={`relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
          dlcVisible ? " is-visible" : ""
        }`}
      >
        <div className="ink-bloom-sweep" aria-hidden="true" style={{ ["--bx" as string]: "70%" }} />
        <div className="absolute inset-0 beast-wash opacity-40" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal variant="wipe" className="mb-14 max-w-3xl space-y-5">
            <p className="text-sm tracking-[0.5em] text-[#d8b36e]">{t.dlc.kicker}</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
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
                <button type="button" className="cta-primary" onClick={onPlayGomoku}>
                  {t.dlc.enterGomoku}
                </button>
                <button
                  type="button"
                  className="cta-secondary"
                  onClick={onPlay}
                >
                  {t.dlc.backToGo}
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

      <section className="relative px-6 py-24 sm:px-10 lg:px-16">
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
            <button type="button" className="cta-primary" onClick={onPlay}>
              {t.why.experienceGo}
            </button>
            <button type="button" className="cta-primary" onClick={onPlayGomoku}>
              {t.why.experienceGomoku}
            </button>
          </div>
        </div>
      </section>

      <AboutDeveloper />
    </main>
  );
}

function Hero({ onPlay }: { onPlay: () => void }) {
  const t = useT();
  const parallaxRef = useParallax<HTMLElement>();
  const scrollRef = useScrollParallax<HTMLElement>();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  return (
    <section
      id="top"
      ref={(node) => {
        parallaxRef.current = node;
        scrollRef.current = node;
        pauseRef.current = node;
      }}
      className="relative min-h-screen overflow-hidden bg-[#17120f] text-[#f4efe4]"
    >
      <InkHeroScene />
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <a href="#top" className="text-lg tracking-[0.35em]">{t.hero.brand}</a>
        <div className="flex items-center gap-6">
          <div className="hidden gap-8 text-sm tracking-[0.22em] text-[#efe5d3]/80 md:flex">
            <a className="transition hover:text-white" href="#rules">{t.hero.navRules}</a>
            <a className="transition hover:text-white" href="#effects">{t.hero.navEffects}</a>
            <a className="transition hover:text-white" href="#weather">{t.hero.navWeather}</a>
            <a className="transition hover:text-[#d8b36e]" href="#dlc">{t.hero.navGomoku}</a>
            <button type="button" className="transition hover:text-[#d8b36e]" onClick={onPlay}>
              {t.hero.navPlay}
            </button>
          </div>
          <LangToggle />
        </div>
      </nav>
      <LangHint />

      <div className="relative z-10 flex min-h-[calc(100vh-88px)] items-center px-6 pb-16 sm:px-10 lg:px-16">
        <div className="max-w-4xl space-y-8">
          <p className="hero-kicker text-sm tracking-[0.55em] text-[#d8b36e]">{t.hero.kicker}</p>
          <div className="space-y-5">
            <h1 className="hero-title text-[clamp(4rem,13vw,12rem)] leading-[1.02] tracking-[0.04em]">
              {t.hero.titleA}<br />{t.hero.titleB}
            </h1>
            <p className="max-w-3xl text-[clamp(1.7rem,4vw,4rem)] font-light leading-tight text-[#efe5d3]">
              {t.hero.sub}
            </p>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#d8cfc0] sm:text-xl">
            {t.hero.desc}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button type="button" className="cta-primary" onClick={onPlay}>
              {t.hero.ctaPlay}
            </button>
            <a className="cta-secondary" href="#rules">{t.hero.ctaRules}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

const HERO_MOTES = [
  { left: "14%", top: "34%", size: 7, delay: "0s" },
  { left: "28%", top: "62%", size: 4, delay: "3s" },
  { left: "46%", top: "26%", size: 6, delay: "5s" },
  { left: "70%", top: "50%", size: 5, delay: "1.5s" },
  { left: "84%", top: "36%", size: 8, delay: "4s" },
];

function InkHeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-wash absolute inset-0" />
      <div className="hero-mist" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="koGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e6a747" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#81361f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#201916" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="boardFade" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e8d3a5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5c4028" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g className="px-back">
          <path className="mountain-drift" d="M-80 570 C120 440 210 500 330 360 C460 210 610 430 760 250 C900 90 1000 360 1135 250 C1285 130 1395 340 1710 190 L1710 980 L-80 980 Z" fill="#0d0b0a" opacity="0.78" />
          <path className="mountain-drift-slow" d="M-100 675 C160 560 275 625 430 475 C590 315 720 560 875 405 C1030 250 1160 520 1305 390 C1445 265 1540 430 1710 330 L1710 980 L-100 980 Z" fill="#231915" opacity="0.82" />
          <path d="M-60 750 C210 690 340 730 560 650 C780 570 970 690 1180 590 C1375 500 1490 570 1690 500 L1690 980 L-60 980 Z" fill="#f4efe4" opacity="0.07" />
        </g>

        <g className="px-mid">
          <g className="hero-board" transform="translate(850 185) rotate(-10)">
            <rect x="0" y="0" width="610" height="610" fill="url(#boardFade)" opacity="0.9" />
            {Array.from({ length: 11 }).map((_, index) => (
              <g key={index} stroke="#dcc89d" strokeOpacity="0.22" strokeWidth="2">
                <line x1={55 + index * 50} y1="55" x2={55 + index * 50} y2="555" />
                <line x1="55" y1={55 + index * 50} x2="555" y2={55 + index * 50} />
              </g>
            ))}
            <circle className="dragon-glow" cx="355" cy="305" r="90" fill="url(#koGlow)" />
            <path className="hero-ink-line" d="M95 105 C210 160 245 270 355 305" fill="none" stroke="#0d0b0a" strokeWidth="6" strokeLinecap="round" />
            <g>
              <circle cx="105" cy="105" r="22" fill="#0d0b0a" />
              <circle cx="155" cy="155" r="22" fill="#f5efe2" opacity="0.92" />
              <circle cx="255" cy="205" r="22" fill="#0d0b0a" />
              <circle cx="305" cy="255" r="22" fill="#f5efe2" opacity="0.92" />
              <circle className="stone-pulse" cx="355" cy="305" r="24" fill="#0d0b0a" />
              <circle cx="405" cy="305" r="22" fill="#f5efe2" opacity="0.92" />
              <circle cx="355" cy="355" r="22" fill="#f5efe2" opacity="0.92" />
            </g>
            <path className="ink-beast-shadow" d="M320 260 C370 205 455 240 455 310 C452 390 350 400 305 345 C276 310 286 283 320 260 Z" fill="#070605" opacity="0.5" />
          </g>
        </g>

        <g className="px-front">
          <g className="crane-flight" fill="none" stroke="#f4efe4" strokeLinecap="round" strokeWidth="4" opacity="0.78">
            <path d="M1030 250 C1060 220 1090 220 1125 250" />
            <path d="M1125 250 C1154 222 1188 220 1220 248" />
            <path d="M1230 430 C1265 398 1300 400 1335 428" />
            <path d="M1335 428 C1360 405 1390 405 1425 430" />
          </g>
        </g>
      </svg>
      {HERO_MOTES.map((m, i) => (
        <span
          key={i}
          className="hero-mote"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#17120f] via-[#17120f]/72 to-[#17120f]/15" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#17120f] to-transparent" />
    </div>
  );
}

function GomokuInkPreview() {
  const winStones = [60, 155, 250, 345, 440];
  const lineLen = 440 - 60;
  return (
    <div className="dlc-preview" aria-hidden="true">
      <svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="dlcBoard" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e8d3a5" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#5c4028" stopOpacity="0.06" />
          </linearGradient>
          <radialGradient id="dlcBlack" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#7a665a" />
            <stop offset="55%" stopColor="#1c1510" />
            <stop offset="100%" stopColor="#040302" />
          </radialGradient>
          <radialGradient id="dlcWhite" cx="34%" cy="28%" r="74%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#dfd0ad" />
            <stop offset="100%" stopColor="#b8a784" />
          </radialGradient>
          <radialGradient id="dlcWinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e6a747" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e6a747" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="520" height="200" fill="url(#dlcBoard)" />
        <g stroke="#dcc89d" strokeOpacity="0.16" strokeWidth="2">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="40" y1={30 + i * 35} x2="480" y2={30 + i * 35} />
          ))}
        </g>

        <line
          x1="60"
          y1="100"
          x2="440"
          y2="100"
          stroke="#e6a747"
          strokeWidth="34"
          strokeLinecap="round"
          opacity="0.4"
        />
        <line
          className="dlc-ink-line"
          x1="60"
          y1="100"
          x2="440"
          y2="100"
          stroke="#0a0807"
          strokeWidth="9"
          strokeLinecap="round"
          style={{ ["--dlc-len" as string]: `${lineLen}` } as CSSProperties}
        />

        {winStones.map((x, i) => (
          <g key={`w${i}`}>
            <circle cx={x} cy={100} r={56} fill="url(#dlcWinGlow)" />
            <circle cx={x} cy={100} r="26" fill="url(#dlcBlack)" />
            <circle cx={x - 5} cy={-5 + 100} r="15" fill="#bca48f" opacity="0.18" />
          </g>
        ))}

        <circle cx="250" cy="40" r="20" fill="url(#dlcWhite)" opacity="0.9" />
        <circle cx="345" cy="165" r="20" fill="url(#dlcWhite)" opacity="0.9" />
        <circle cx="155" cy="165" r="20" fill="url(#dlcWhite)" opacity="0.6" />
      </svg>
    </div>
  );
}

function AboutDeveloper() {
  const t = useT();
  const [ref, visible] = useReveal<HTMLElement>();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  return (
    <section
      id="about"
      ref={(node) => {
        ref.current = node;
        pauseRef.current = node;
      }}
      className={`relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
        visible ? " is-visible" : ""
      }`}
    >
      <div className="ink-bloom-sweep" aria-hidden="true" style={{ ["--bx" as string]: "20%", ["--by" as string]: "30%" }} />
      <div className="relative mx-auto max-w-5xl">
        <Reveal variant="wipe">
          <p className="text-sm tracking-[0.5em] text-[#d8b36e]">
            {t.about.kicker}
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col items-start gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* 头像 + 名字 */}
          <Reveal variant="bloom" className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* 头像占位 —— 待定，换成 <img> 即可 */}
            <div
              className="about-ring flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #6a5648, #050403 72%)",
                boxShadow: "0 0 44px rgba(216,179,110,0.22)",
                border: "1px solid rgba(216,179,110,0.3)",
              }}
            >
              <span
                className="text-3xl font-light tracking-[0.12em] text-[#d8b36e]"
                style={{ fontFamily: '"Georgia","Cambria",serif' }}
              >
                TB
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.about.author}
              </h2>
              <p className="mt-3 text-2xl font-medium tracking-wide text-[#d8b36e] sm:text-3xl">
                {t.about.name}
              </p>
            </div>
          </Reveal>

          {/* 两个邮箱 —— 放在头像名字右侧 */}
          <div className="grid gap-8 sm:grid-cols-2 lg:max-w-md lg:gap-10">
            <Reveal variant="bloom" i={0} className="border-t border-[#f4efe4]/15 pt-5">
              <p className="text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email1Cap}
              </p>
              <a
                href="mailto:titanium_bullet@icloud.com"
                className="mt-2 block break-all text-base text-[#d8cfc0] transition hover:text-[#f4efe4] hover:underline"
              >
                titanium_bullet@icloud.com
              </a>
            </Reveal>
            <Reveal variant="bloom" i={1} className="border-t border-[#f4efe4]/15 pt-5">
              <p className="text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email2Cap}
              </p>
              <a
                href="mailto:ruihuachen@icloud.com"
                className="mt-2 block break-all text-base text-[#d8cfc0] transition hover:text-[#f4efe4] hover:underline"
              >
                ruihuachen@icloud.com
              </a>
            </Reveal>
          </div>
        </div>

        <p className="mt-16 text-xs tracking-[0.3em] text-[#695d51]">
          {t.about.foot}
        </p>
      </div>
    </section>
  );
}
