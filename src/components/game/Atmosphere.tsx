import { useEffect, useRef } from "react";
import type { Phase } from "../../go/types";

export type { Phase };

// 四层山色（远→近）：远岚受天光偏亮，近山渐入剪影；另有河谷河光随相位换色。
const MOUNTAIN_FILL: Record<Phase, [string, string, string, string]> = {
  dawn: ["#4a3c2c", "#372a1c", "#241a12", "#120d07"],
  noon: ["#48452f", "#343321", "#242315", "#13120a"],
  dusk: ["#54281a", "#412014", "#2c140c", "#150905"],
  night: ["#18212f", "#111a26", "#0b121d", "#060a10"],
};

const RIVER_TINT: Record<Phase, string> = {
  dawn: "#e6c684",
  noon: "#d8d0a8",
  dusk: "#e8915a",
  night: "#8fa6c4",
};

const MOTES = [
  { left: "12%", top: "30%", size: 8, delay: "0s" },
  { left: "26%", top: "62%", size: 5, delay: "2s" },
  { left: "44%", top: "24%", size: 7, delay: "4s" },
  { left: "68%", top: "55%", size: 6, delay: "1s" },
  { left: "82%", top: "38%", size: 9, delay: "3s" },
  { left: "90%", top: "70%", size: 5, delay: "5s" },
];

export function Atmosphere({ phase }: { phase: Phase }) {
  const [f0, f1, f2, f3] = MOUNTAIN_FILL[phase];
  const river = RIVER_TINT[phase];
  const ref = useRef<HTMLDivElement>(null);

  // 对局视图整屏常驻，离屏检测不适用；改为标签页隐藏时暂停全部动画
  // （复用 .is-offscreen 的 animation-play-state 规则，省电）。
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onVis = () => el.classList.toggle("is-offscreen", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div ref={ref} className="atmosphere" aria-hidden="true">
      <div className="mist-layer" />

      {/* 层峦：静态四层（山不动，动势交给雾带与河光——SVG 子节点动画
          会整块重光栅化，此为前车之鉴） */}
      <svg className="mountain-svg" viewBox="0 0 1600 620" preserveAspectRatio="xMidYMax slice">
        <path d="M-100 328 C170 252 300 292 480 218 C660 144 790 268 970 196 C1130 132 1260 240 1410 180 C1530 133 1630 208 1710 168 L1710 660 L-100 660 Z" fill={f0} opacity="0.55" />
        <path d="M-100 402 C180 322 330 362 520 284 C710 206 850 330 1030 254 C1190 188 1320 292 1470 232 C1580 188 1660 256 1710 224 L1710 660 L-100 660 Z" fill={f1} opacity="0.72" />
        <path d="M-80 476 C200 398 350 436 560 356 C770 276 920 400 1120 320 C1290 252 1430 356 1710 286 L1710 660 L-80 660 Z" fill={f2} opacity="0.86" />
        <path d="M-100 546 C240 470 420 506 660 428 C900 350 1060 472 1300 392 C1480 332 1600 412 1710 362 L1710 660 L-100 660 Z" fill={f3} />
      </svg>

      {/* 河光：独立 SVG 层整体呼吸（山谷微光明灭） */}
      <svg className="atmo-river" viewBox="0 0 1600 620" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="atmoRiverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={river} stopOpacity="0.04" />
            <stop offset="100%" stopColor={river} stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <path d="M690 380 C760 448 706 516 806 566 C886 606 920 626 946 660 L1064 660 C994 608 936 570 894 528 C848 482 788 424 758 372 Z" fill="url(#atmoRiverGrad)" />
        <path d="M748 424 C790 488 760 534 826 574 C872 602 896 620 918 640" fill="none" stroke={river} strokeWidth="4" strokeLinecap="round" opacity="0.26" />
      </svg>

      {/* 山脚雾带（HTML 层漂移） */}
      <div className="atmo-fog atmo-fog-a" />
      <div className="atmo-fog atmo-fog-b" />

      {MOTES.map((m, i) => (
        <span
          key={i}
          className="ink-mote"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
          }}
        />
      ))}

      {phase !== "noon" && (
        <svg className="crane-layer" viewBox="0 0 200 80" style={{ right: "8%", top: "16%", width: "12rem" }}>
          <g fill="none" stroke={phase === "night" ? "#8fa6c4" : "#f4efe4"} strokeLinecap="round" strokeWidth="4" opacity="0.8">
            <path d="M20 40 C35 28 50 28 65 40" />
            <path d="M65 40 C80 29 95 29 110 40" />
            <path d="M120 60 C135 48 150 48 165 60" />
            <path d="M165 60 C178 49 190 49 200 60" />
          </g>
        </svg>
      )}
    </div>
  );
}
