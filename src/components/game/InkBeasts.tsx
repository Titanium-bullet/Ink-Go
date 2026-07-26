import { useMemo } from "react";
import { GameState } from "../../go/types";
import { findBeasts } from "../../go/groups";

export function InkBeasts({
  state,
  cell,
  px,
}: {
  state: GameState;
  cell: number;
  px: (n: number) => number;
}) {
  // 父组件 Goban 因 hover 等局部 state 重渲染时，state 引用不变，memo 命中缓存，
  // 避免每帧重跑全盘棋块分析（findBeasts → analyzeGroups 的多次 BFS）。
  const { turtle, fish } = useMemo(() => findBeasts(state), [state]);
  const s = cell * 0.95;
  if (!turtle && fish.length === 0) return null;

  return (
    <g className="beast-layer" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {turtle && (
        <g transform={`translate(${px(turtle.cx)} ${px(turtle.cy)}) scale(${s})`}>
          <g className="beast-breathe beast-turtle">
            <ellipse rx={1} ry={0.78} />
            <line x1={-0.8} y1={0} x2={0.8} y2={0} className="shell-line" />
            <line x1={0} y1={-0.6} x2={0} y2={0.6} className="shell-line" />
            <circle cx={0} cy={-1.08} r={0.22} />
            <circle cx={-0.85} cy={0.72} r={0.18} />
            <circle cx={0.85} cy={0.72} r={0.18} />
            <circle cx={-0.85} cy={-0.6} r={0.16} />
            <circle cx={0.85} cy={-0.6} r={0.16} />
          </g>
        </g>
      )}

      {fish.map((f, i) => (
        <g
          key={`fish-${i}`}
          transform={`translate(${px(f.cx)} ${px(f.cy)}) scale(${s * 0.8})`}
        >
          <g className="beast-fish">
            <ellipse rx={0.95} ry={0.42} />
            <path d="M 0.9 0 L 1.35 -0.34 L 1.35 0.34 Z" />
            <circle cx={0.5} cy={-0.08} r={0.09} className="fish-eye" />
          </g>
        </g>
      ))}
    </g>
  );
}
