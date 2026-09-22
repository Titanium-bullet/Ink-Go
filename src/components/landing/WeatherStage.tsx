import { useState } from "react";
import type { Phase } from "../../go/types";
import { usePauseOffscreen } from "../../hooks/useScrollParallax";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useT } from "../../i18n/LanguageContext";
import { WeatherIcon } from "./WeatherIcon";

const KEYS: Phase[] = ["dawn", "noon", "dusk", "night"];

// 相位粒子组件表（常驻叠层，由 .wx-fx 的 opacity 控制显隐）
const FX: Record<Phase, (p: { reduced: boolean }) => React.ReactElement> = {
  dawn: DawnFx,
  noon: NoonFx,
  dusk: DuskFx,
  night: NightFx,
};

/**
 * 天象沉浸舞台：点击晨/午/暮/夜，天空渐变与山色交叉淡入，
 * 并换上对应相位粒子（晨雾光柱 / 午日轮 / 暮落叶 / 夜萤火繁星）。
 * 性能规则：叠层交叉淡入只动 opacity；粒子只动 transform/opacity；
 * 山色 fill 过渡只在切换瞬间发生；离屏暂停 + reduced-motion 静态化。
 */
export function WeatherStage() {
  const t = useT();
  const [idx, setIdx] = useState(0);
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const phase = KEYS[idx];

  return (
    <div ref={pauseRef} className="wx-stage" data-phase={phase}>
      <div className="wx-frame">
        {/* 天空四相叠层交叉淡入 */}
        {KEYS.map((k) => (
          <div key={k} className={`wx-sky wx-sky-${k}${k === phase ? " is-on" : ""}`} />
        ))}

        {/* 相位光晕（与天空同款交叉淡入） */}
        {KEYS.map((k) => (
          <div key={`g-${k}`} className={`wx-glow wx-glow-${k}${k === phase ? " is-on" : ""}`} />
        ))}

        {/* 山峦：fill 由 [data-phase] 的 CSS 变量驱动，切换时 1.2s 过渡 */}
        <svg className="wx-mountains" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMax slice">
          <path className="wx-m0" d="M-80 420 C200 300 380 350 600 270 C820 190 960 330 1180 250 C1360 185 1480 300 1710 230 L1710 560 L-80 560 Z" />
          <path className="wx-m1" d="M-80 480 C180 390 340 420 560 355 C790 288 930 400 1150 335 C1340 280 1470 380 1710 320 L1710 560 L-80 560 Z" />
          <path className="wx-m2" d="M-60 520 C220 465 380 485 620 435 C860 385 1000 470 1240 420 C1420 382 1540 445 1690 415 L1690 560 L-60 560 Z" />
        </svg>

        {/* 相位粒子：与天空同款的常驻叠层交叉淡入（不做 keyed 重挂载） */}
        {KEYS.map((k) => {
          const Fx = FX[k];
          return (
            <div key={k} className={`wx-fx${k === phase ? " is-on" : ""}`}>
              <Fx reduced={reduced} />
            </div>
          );
        })}

        {/* 选择器 */}
        <div className="wx-selector" role="tablist" aria-label={t.weather.hint}>
          {t.weather.phases.map((p, i) => (
            <button
              key={p.name}
              type="button"
              role="tab"
              aria-selected={i === idx}
              className={`wx-tab${i === idx ? " is-active" : ""}`}
              onClick={() => setIdx(i)}
            >
              <WeatherIcon phase={KEYS[i]} />
              <span className="wx-tab-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- 相位粒子（全部 transform/opacity） ---- */

function DawnFx({ reduced }: { reduced: boolean }) {
  return (
    <>
      <div className="wx-mist wx-mist-a" />
      <div className="wx-mist wx-mist-b" />
      {!reduced && (
        <>
          <div className="wx-shaft" style={{ left: "12%", animationDelay: "-2s" }} />
          <div className="wx-shaft" style={{ left: "38%", animationDelay: "-5s" }} />
          <div className="wx-shaft" style={{ left: "64%", animationDelay: "-8s" }} />
        </>
      )}
    </>
  );
}

function NoonFx({ reduced }: { reduced: boolean }) {
  return (
    <>
      <div className="wx-noon-sun" />
      {!reduced && (
        <>
          <div className="wx-shimmer" style={{ left: "22%", top: "58%", animationDelay: "-1s" }} />
          <div className="wx-shimmer" style={{ left: "48%", top: "40%", animationDelay: "-4s" }} />
          <div className="wx-shimmer" style={{ left: "74%", top: "62%", animationDelay: "-6s" }} />
        </>
      )}
    </>
  );
}

const LEAVES = [
  { left: "8%", delay: "0s", dur: "9s" },
  { left: "24%", delay: "-3s", dur: "11s" },
  { left: "42%", delay: "-6s", dur: "10s" },
  { left: "58%", delay: "-2s", dur: "12s" },
  { left: "74%", delay: "-7s", dur: "9.5s" },
  { left: "88%", delay: "-4.5s", dur: "10.5s" },
];

function DuskFx({ reduced }: { reduced: boolean }) {
  return (
    <>
      <div className="wx-dusk-sun" />
      {(reduced ? LEAVES.slice(0, 2) : LEAVES).map((l, i) => (
        <span
          key={i}
          className="wx-leaf"
          style={{
            left: l.left,
            animationDelay: reduced ? undefined : l.delay,
            animationDuration: l.dur,
            animationPlayState: reduced ? "paused" : undefined,
            top: "-4%",
          }}
        />
      ))}
    </>
  );
}

const FIREFLIES = [
  { left: "12%", top: "46%", delay: "0s" },
  { left: "30%", top: "60%", delay: "-2.2s" },
  { left: "46%", top: "38%", delay: "-4.1s" },
  { left: "62%", top: "56%", delay: "-1.3s" },
  { left: "78%", top: "42%", delay: "-3.4s" },
  { left: "90%", top: "62%", delay: "-5s" },
];

const STARS = [
  { left: "6%", top: "12%" }, { left: "16%", top: "28%" }, { left: "26%", top: "8%" },
  { left: "38%", top: "20%" }, { left: "52%", top: "10%" }, { left: "64%", top: "26%" },
  { left: "76%", top: "12%" }, { left: "88%", top: "22%" }, { left: "94%", top: "34%" },
  { left: "44%", top: "34%" },
];

function NightFx({ reduced }: { reduced: boolean }) {
  return (
    <>
      {STARS.map((s, i) => (
        <span key={`s${i}`} className="wx-star-dot" style={{ left: s.left, top: s.top }} />
      ))}
      <div className="wx-night-moon" />
      {(reduced ? FIREFLIES.slice(0, 2) : FIREFLIES).map((f, i) => (
        <span
          key={`f${i}`}
          className="wx-firefly"
          style={{
            left: f.left,
            top: f.top,
            animationDelay: reduced ? undefined : f.delay,
            animationPlayState: reduced ? "paused" : undefined,
          }}
        />
      ))}
    </>
  );
}
