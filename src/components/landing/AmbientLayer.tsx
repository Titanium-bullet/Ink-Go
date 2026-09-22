import { useEffect, useRef, type CSSProperties } from "react";

const MOTES: { left: string; top: string; size: number; delay: string; dur: string; gold?: boolean }[] = [
  { left: "10%", top: "26%", size: 6, delay: "0s", dur: "20s" },
  { left: "44%", top: "38%", size: 7, delay: "2s", dur: "26s", gold: true },
  { left: "72%", top: "60%", size: 6, delay: "1.5s", dur: "24s" },
  { left: "89%", top: "40%", size: 4, delay: "5s", dur: "22s", gold: true },
];

/**
 * 全页常驻氛围层：fixed 定位、pointer-events:none、z-index:0。
 * 一团慢漂移的雾气 + 四颗散落的浮尘，把 Hero 的气息延续到所有段落。
 * fixed 元素相对视口不动，因此浮尘只靠 mote-float 自漂，不挂滚动视差。
 * fixed 层无法用离屏检测暂停，改为标签页隐藏时暂停（复用 .is-offscreen
 * 的 animation-play-state 规则）；墨尘用预模糊径向渐变，不挂 filter: blur。
 */
export function AmbientLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onVis = () => el.classList.toggle("is-offscreen", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div ref={ref} className="ambient-layer" aria-hidden="true">
      <div className="ambient-mist" />
      {MOTES.map((m, i) => (
        <span
          key={i}
          className={`ambient-mote${m.gold ? " is-gold" : ""}`}
          style={
            {
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              animationDelay: m.delay,
              animationDuration: m.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
