import type { Phase } from "../../go/types";

export type { Phase };

const MOUNTAIN_FILL: Record<Phase, [string, string, string]> = {
  dawn: ["#1a1410", "#2a1d14", "#3a2a1c"],
  noon: ["#161310", "#241d12", "#332a16"],
  dusk: ["#1c0f0a", "#3a1a10", "#5a2c16"],
  night: ["#070a10", "#0e1620", "#16222e"],
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
  const [f0, f1, f2] = MOUNTAIN_FILL[phase];
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="mist-layer" />

      <svg className="mountain-svg" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <path
          className="mountain-drift-slow"
          d="M-100 470 C160 360 275 420 430 320 C590 220 720 420 875 300 C1030 180 1160 400 1305 290 C1445 200 1540 330 1710 250 L1710 620 L-100 620 Z"
          fill={f0}
          opacity="0.9"
        />
        <path
          className="mountain-drift"
          d="M-80 540 C120 420 210 470 330 350 C460 220 610 400 760 250 C900 120 1000 340 1135 250 C1285 150 1395 320 1710 200 L1710 620 L-80 620 Z"
          fill={f1}
          opacity="0.85"
        />
        <path
          d="M-60 580 C210 530 340 560 560 500 C780 440 970 530 1180 450 C1375 380 1490 430 1690 380 L1690 620 L-60 620 Z"
          fill={f2}
          opacity="0.55"
        />
      </svg>

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
