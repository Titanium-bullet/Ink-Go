import type { Phase } from "../../go/types";

const TINT: Record<Phase, string> = {
  dawn: "rgba(232,192,116,0.10)",
  noon: "rgba(230,200,121,0.12)",
  dusk: "rgba(232,145,90,0.12)",
  night: "rgba(143,166,196,0.12)",
};

/**
 * 晨 / 午 / 暮 / 夜 的迷你动画图标。克制：低饱和、缓慢循环。
 */
export function WeatherIcon({ phase }: { phase: Phase }) {
  return (
    <span
      className="weather-icon"
      data-phase={phase}
      aria-hidden="true"
      style={{ background: `radial-gradient(circle, ${TINT[phase]}, transparent 70%)` }}
    >
      <svg viewBox="0 0 64 64" width="56" height="56">
        {phase === "dawn" && <Dawn />}
        {phase === "noon" && <Noon />}
        {phase === "dusk" && <Dusk />}
        {phase === "night" && <Night />}
      </svg>
    </span>
  );
}

function Dawn() {
  return (
    <g className="wx-dawn">
      <line x1="10" y1="46" x2="54" y2="46" stroke="#b79d72" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle className="wx-sun" cx="32" cy="46" r="11" fill="#e8c074" opacity="0.9" />
      <path d="M18 46 a14 14 0 0 1 28 0 Z" fill="#17120f" opacity="0.9" />
    </g>
  );
}

function Noon() {
  return (
    <g className="wx-noon">
      <g className="wx-rays" stroke="#e6c879" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="10" x2="32" y2="18" />
        <line x1="32" y1="46" x2="32" y2="54" />
        <line x1="10" y1="32" x2="18" y2="32" />
        <line x1="46" y1="32" x2="54" y2="32" />
        <line x1="16" y1="16" x2="21" y2="21" />
        <line x1="43" y1="43" x2="48" y2="48" />
        <line x1="48" y1="16" x2="43" y2="21" />
        <line x1="21" y1="43" x2="16" y2="48" />
      </g>
      <circle cx="32" cy="32" r="9" fill="#e6c879" opacity="0.92" />
    </g>
  );
}

function Dusk() {
  return (
    <g className="wx-dusk">
      <circle className="wx-sun-low" cx="32" cy="40" r="10" fill="#e8915a" opacity="0.85" />
      <line x1="8" y1="52" x2="56" y2="52" stroke="#b79d72" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path className="wx-haze" d="M10 44 H54" stroke="#e8915a" strokeWidth="6" strokeLinecap="round" opacity="0.2" />
    </g>
  );
}

function Night() {
  return (
    <g className="wx-night">
      <path
        className="wx-moon"
        d="M40 18 a16 16 0 1 0 6 24 a12 12 0 0 1 -6 -24 Z"
        fill="#8fa6c4"
        opacity="0.92"
      />
      <circle className="wx-star" cx="16" cy="18" r="1.6" fill="#d8e4f0" />
      <circle className="wx-star wx-star-b" cx="22" cy="40" r="1.3" fill="#d8e4f0" />
      <circle className="wx-star wx-star-c" cx="12" cy="32" r="1.1" fill="#d8e4f0" />
    </g>
  );
}
