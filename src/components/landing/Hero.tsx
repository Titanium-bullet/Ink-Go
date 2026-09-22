import { usePauseOffscreen } from "../../hooks/useScrollParallax";
import { useHeroParallax } from "../../hooks/useHeroParallax";
import { useT } from "../../i18n/LanguageContext";
import { LangToggle } from "../LangToggle";
import { MiniGobanInner } from "../board/MiniGoban";

// Hero 示意局（11 路）：取意古典名局的中盘阵型——四角星位/挂角定型，
// 中腹白两子（4,6)(8,6）分断黑势，最后一手黑（7,6）深楔其间（耳赤一手式的侵入），
// 墨绦自天元流向这一手。
const HERO_BLACK: [number, number][] = [
  [2, 2], [8, 2], [2, 8], // 三个星位（取势）
  [5, 5], // 天元
  [4, 3], // 左上挂角后外靠
  [6, 5], [7, 6], // 中腹连出 + 最后一手深楔白阵
  [4, 8], // 下边拆
];
const HERO_WHITE: [number, number][] = [
  [3, 2], [2, 4], // 左上挂角/飞压
  [7, 3], [6, 2], // 右上压迫黑星
  [4, 6], [8, 6], // 中腹分断黑势
  [3, 9], // 下边伸展
];
const HERO_LAST: [number, number] = [7, 6];
const HERO_INK_FROM: [number, number] = [5, 5];

const HERO_MOTES = [
  { left: "14%", top: "34%", size: 7, delay: "0s" },
  { left: "28%", top: "62%", size: 4, delay: "3s" },
  { left: "46%", top: "26%", size: 6, delay: "5s" },
  { left: "70%", top: "50%", size: 5, delay: "1.5s" },
  { left: "84%", top: "36%", size: 8, delay: "4s" },
];

export function Hero({
  onPlay,
  onOpenShop,
}: {
  onPlay: () => void;
  onOpenShop: () => void;
}) {
  const t = useT();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  return (
    <section
      id="top"
      ref={(node) => {
        pauseRef.current = node;
      }}
      className="relative min-h-screen overflow-hidden bg-[#17120f] text-[#f4efe4]"
    >
      <InkHeroScene />
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <a href="#top" className="text-lg tracking-[0.35em]">{t.hero.brand}</a>
        <div className="flex items-center gap-6">
          <div className="hidden gap-8 text-sm tracking-[0.22em] text-[#efe5d3]/80 md:flex">
            <a className="transition hover:text-[#d8b36e]" href="#dlc">{t.hero.navGomoku}</a>
            <button type="button" className="transition hover:text-[#d8b36e]" onClick={onPlay}>
              {t.hero.navPlay}
            </button>
            <button type="button" className="transition hover:text-[#d8b36e]" onClick={onOpenShop}>
              {t.nav.shop}
            </button>
          </div>
          <LangToggle />
        </div>
      </nav>
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

// 山河场景：三层各自独立 SVG（视差 transform 直写在包裹层，SVG 内部零动画——
// SVG 子节点不享受合成层，任何内部动画都会让整块全屏 SVG 每帧重光栅化）。
// 鹤群做整只 SVG 的 transform 飞行；棋盘内的脉动辉光改为静态 + 顶层 HTML 呼吸光。
function InkHeroScene() {
  const { back, mid, front } = useHeroParallax();
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-wash absolute inset-0" />
      <div className="hero-mist" />
      <div className="hero-sun" />

      <div ref={back} className="hero-layer">
        <svg className="hero-layer-svg" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMax slice">
          {/* 层峦：远岚受天光偏蓝紫，近山渐入墨色 */}
          <path d="M-100 596 C150 522 268 560 430 476 C592 392 704 512 884 430 C1050 354 1170 470 1330 398 C1470 336 1600 420 1710 372 L1710 980 L-100 980 Z" fill="#343041" opacity="0.5" />
          <path d="M-100 646 C160 566 280 606 450 520 C620 434 740 552 910 476 C1080 400 1200 512 1350 446 C1490 386 1610 462 1710 420 L1710 980 L-100 980 Z" fill="#2a2531" opacity="0.66" />
          <path d="M-80 712 C180 626 320 664 500 574 C680 484 820 606 1000 522 C1160 448 1290 552 1440 492 C1560 445 1650 512 1710 470 L1710 980 L-80 980 Z" fill="#1f1a1e" opacity="0.82" />
          <path d="M-100 760 C200 690 340 724 540 640 C740 556 900 672 1090 590 C1260 516 1400 616 1710 540 L1710 980 L-100 980 Z" fill="#141013" opacity="0.92" />
        </svg>
      </div>

      {/* 河：自山谷蜿蜒入画底（独立层整体呼吸，合成器友好） */}
      <div className="hero-layer hero-river">
        <svg className="hero-layer-svg" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="heroRiverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8d3a5" stopOpacity="0.02" />
              <stop offset="55%" stopColor="#e6c684" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#f0d9a0" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path d="M648 676 C716 748 664 826 772 884 C862 934 906 956 946 982 L1088 982 C1004 922 934 878 884 828 C832 776 762 716 726 664 Z" fill="url(#heroRiverGrad)" />
          <path d="M700 716 C744 786 716 836 792 884 C848 918 880 938 908 960" fill="none" stroke="#f5e2b0" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
          <path d="M770 806 C800 852 836 880 868 902" fill="none" stroke="#f5e2b0" strokeWidth="3" strokeLinecap="round" opacity="0.22" />
        </svg>
      </div>

      {/* 云海：山峦与棋盘之间的流云带 */}
      <div className="hero-clouds">
        <span />
        <span />
        <span />
      </div>

      {/* 最近山脊 + 山脚雾带 */}
      <div className="hero-near">
        <svg className="hero-layer-svg" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMax slice">
          <path d="M-100 828 C240 748 420 784 660 706 C900 628 1060 748 1300 666 C1480 604 1600 684 1710 632 L1710 980 L-100 980 Z" fill="#0b0908" />
        </svg>
        <div className="hero-fog hero-fog-a" />
        <div className="hero-fog hero-fog-b" />
      </div>

      <div ref={mid} className="hero-layer">
        <svg className="hero-layer-svg" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMax slice">
          {/* 棋盘稍收右下：右上天空留给日轮，构图成「日照山河、盘踞右麓」 */}
          <g transform="translate(1185 505) rotate(-9) scale(0.75) translate(-400 -420)">
            <MiniGobanInner
              p="hero"
              lines={11}
              black={HERO_BLACK}
              white={HERO_WHITE}
              lastMove={HERO_LAST}
              ink={{ from: HERO_INK_FROM, to: HERO_LAST }}
            />
          </g>
        </svg>
      </div>

      <div ref={front} className="hero-layer">
        <svg className="hero-layer-svg hero-cranes" viewBox="0 0 1600 950" preserveAspectRatio="xMidYMax slice">
          <g fill="none" stroke="#f4efe4" strokeLinecap="round" strokeWidth="4" opacity="0.78">
            <path d="M1030 250 C1060 220 1090 220 1125 250" />
            <path d="M1125 250 C1154 222 1188 220 1220 248" />
            <path d="M1230 430 C1265 398 1300 400 1335 428" />
            <path d="M1335 428 C1360 405 1390 405 1425 430" />
          </g>
        </svg>
      </div>

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

      {/* 斜光柱 + 全屏呼吸光（HTML 层，合成器友好） */}
      <div className="hero-shafts" />
      <div className="hero-breath" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#17120f] via-[#17120f]/72 to-[#17120f]/15" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#17120f] to-transparent" />
    </div>
  );
}
