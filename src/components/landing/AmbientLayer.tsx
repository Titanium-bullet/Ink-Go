import type { CSSProperties } from "react";

const MOTES: { left: string; top: string; size: number; delay: string; dur: string; gold?: boolean }[] = [
  { left: "8%", top: "22%", size: 6, delay: "0s", dur: "18s" },
  { left: "26%", top: "70%", size: 4, delay: "4s", dur: "22s", gold: true },
  { left: "44%", top: "38%", size: 7, delay: "2s", dur: "26s" },
  { left: "63%", top: "16%", size: 5, delay: "6s", dur: "20s", gold: true },
  { left: "78%", top: "64%", size: 6, delay: "1.5s", dur: "24s" },
  { left: "90%", top: "44%", size: 4, delay: "5s", dur: "19s", gold: true },
];

/**
 * 全页常驻氛围层：fixed 定位、pointer-events:none、z-index:0。
 * 一团慢漂移的雾气 + 六颗散落的浮尘，把 Hero 的气息延续到所有段落。
 * fixed 元素相对视口不动，因此浮尘只靠 mote-float 自漂，不挂滚动视差。
 */
export function AmbientLayer() {
  return (
    <div className="ambient-layer" aria-hidden="true">
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
