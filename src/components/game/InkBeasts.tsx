import { useMemo } from "react";
import { GameState } from "../../go/types";
import { findBeasts, GroupInfo } from "../../go/groups";

/** 棋串质心可能落在空点（长条形棋串尤甚），墨兽取距质心最近的一颗
    己方棋子作锚，保证虚影始终骑在实体棋形上而不悬空。 */
function anchorOf(g: GroupInfo, size: number): number {
  let best = g.stones[0];
  let bestDist = Infinity;
  for (const s of g.stones) {
    const dx = (s % size) - g.cx;
    const dy = Math.floor(s / size) - g.cy;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

/** 体型随棋串规模生长：略有大小之分即可，不做巨兽以免遮盘。 */
function turtleScale(cell: number, n: number): number {
  return cell * Math.min(1.5, Math.max(0.92, 0.68 + 0.2 * Math.sqrt(n)));
}

function fishScale(cell: number, n: number): number {
  return cell * Math.min(1.3, Math.max(0.85, 0.62 + 0.16 * Math.sqrt(n)));
}

/** 平顶六边形甲片 path（中心原点）：玄龟甲面的鳞甲单元 */
function hex(cx: number, cy: number, w: number, h: number): string {
  return `M ${cx - w / 2} ${cy} L ${cx - w / 4} ${cy - h / 2} L ${cx + w / 4} ${cy - h / 2} L ${cx + w / 2} ${cy} L ${cx + w / 4} ${cy + h / 2} L ${cx - w / 4} ${cy + h / 2} Z`;
}

export function InkBeasts({
  state,
  cell,
  px,
}: {
  state: GameState;
  cell: number;
  px: (n: number) => number;
}) {
  const size = state.size;
  // 父组件 Goban 因 hover 等局部 state 重渲染时，state 引用不变，memo 命中缓存，
  // 避免每帧重跑全盘棋块分析（findBeasts → analyzeGroups 的多次 BFS）。
  const { turtle, fish } = useMemo(() => findBeasts(state), [state]);
  if (!turtle && fish.length === 0) return null;

  return (
    <g className="beast-layer" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <defs>
        <radialGradient id="beastShell" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#2b211a" />
          <stop offset="55%" stopColor="#17110d" />
          <stop offset="100%" stopColor="#0a0807" />
        </radialGradient>
        <radialGradient id="beastHalo">
          <stop offset="0%" stopColor="#0a0807" stopOpacity="0.2" />
          <stop offset="72%" stopColor="#0a0807" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0a0807" stopOpacity="0" />
        </radialGradient>
        {/* 墨云：玄龟出场时的凝聚氛围，比 halo 更大一圈 */}
        <radialGradient id="beastCloud">
          <stop offset="0%" stopColor="#141017" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#141017" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#141017" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="beastFish" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#f0c060" />
          <stop offset="55%" stopColor="#e6a747" />
          <stop offset="100%" stopColor="#b79d72" />
        </radialGradient>
        {/* 甲片阵列裁剪到龟甲椭圆内，侧列只露一半也有鳞甲感 */}
        <clipPath id="beastShellClip">
          <ellipse rx={1} ry={0.78} />
        </clipPath>
      </defs>

      {turtle &&
        (() => {
          const a = anchorOf(turtle, size);
          return (
            <g
              key={`turtle-${a}`}
              transform={`translate(${px(a % size)} ${px(Math.floor(a / size))}) scale(${turtleScale(cell, turtle.stoneCount)})`}
            >
              {/* emerge（一次性入场）/ cloud-drift（墨云漂移）/ breathe（呼吸）
                  都驱动 transform，同元素会互相覆盖，故分层嵌套各管一层 */}
              <g className="beast-emerge">
                <g className="turtle-cloud-a">
                  <ellipse className="turtle-cloud" rx={1.9} ry={1.05} />
                </g>
                <g className="turtle-cloud-b">
                  <ellipse className="turtle-cloud" rx={1.75} ry={0.9} />
                </g>
                <g className="beast-breathe">
                  <ellipse className="turtle-halo" rx={1.42} ry={1.16} />
                  <g className="beast-turtle">
                    {/* 龟甲：墨晕渐变打底，金线勾出轮廓 */}
                    <ellipse rx={1} ry={0.78} fill="url(#beastShell)" />
                    <ellipse rx={1} ry={0.78} fill="none" stroke="#d8b36e" strokeOpacity="0.55" strokeWidth={0.05} />
                    {/* 六边形甲片阵列（中列三片大、侧列两片小），裁剪进甲面 */}
                    <g className="shell-plates" clipPath="url(#beastShellClip)">
                      <path d={hex(0, -0.3, 0.5, 0.34)} />
                      <path d={hex(0, 0.08, 0.5, 0.34)} />
                      <path d={hex(0, 0.44, 0.44, 0.3)} />
                      <path d={hex(-0.62, -0.1, 0.4, 0.3)} />
                      <path d={hex(-0.62, 0.32, 0.36, 0.26)} />
                      <path d={hex(0.62, -0.1, 0.4, 0.3)} />
                      <path d={hex(0.62, 0.32, 0.36, 0.26)} />
                    </g>
                    {/* 头（上）、桨叶状四足（斜置）、尾 */}
                    <path
                      className="turtle-part"
                      d="M 0 -0.92 C 0.17 -0.99 0.18 -1.27 0 -1.37 C -0.18 -1.27 -0.17 -0.99 0 -0.92 Z"
                    />
                    <ellipse className="turtle-part" cx={-0.95} cy={-0.42} rx={0.15} ry={0.26} transform="rotate(-32 -0.95 -0.42)" />
                    <ellipse className="turtle-part" cx={0.95} cy={-0.42} rx={0.15} ry={0.26} transform="rotate(32 0.95 -0.42)" />
                    <ellipse className="turtle-part" cx={-0.97} cy={0.52} rx={0.14} ry={0.24} transform="rotate(24 -0.97 0.52)" />
                    <ellipse className="turtle-part" cx={0.97} cy={0.52} rx={0.14} ry={0.24} transform="rotate(-24 0.97 0.52)" />
                    <path className="turtle-part" d="M -0.1 0.72 Q 0 1.12 0.12 0.74 Z" />
                  </g>
                </g>
              </g>
            </g>
          );
        })()}

      {fish.map((f) => {
        const a = anchorOf(f, size);
        return (
          <g
            key={`fish-${a}`}
            transform={`translate(${px(a % size)} ${px(Math.floor(a / size))}) scale(${fishScale(cell, f.stoneCount)})`}
          >
            <g className="beast-emerge">
              <g className="beast-breathe beast-fish">
                {/* 摆尾独立一层：与 breathe 同为 transform 动画，同层会互相覆盖 */}
                <g className="fish-sway">
                  {/* 流线鱼身，头朝左 */}
                  <path d="M -0.95 0 C -0.78 -0.36 -0.1 -0.46 0.52 -0.3 C 0.76 -0.22 0.86 -0.11 0.88 0 C 0.86 0.11 0.76 0.22 0.52 0.3 C -0.1 0.46 -0.78 0.36 -0.95 0 Z" fill="url(#beastFish)" />
                  {/* 双飘长尾鳍 */}
                  <path className="fin" d="M 0.8 -0.05 Q 1.3 -0.38 1.88 -0.58 Q 1.5 -0.12 1.42 0.02 Z" />
                  <path className="fin" d="M 0.8 0.05 Q 1.3 0.38 1.88 0.58 Q 1.5 0.12 1.42 -0.02 Z" />
                  {/* 背鳍 + 腹鳍 */}
                  <path className="fin" d="M -0.32 -0.38 Q 0.02 -0.68 0.38 -0.38 Q 0 -0.46 -0.32 -0.38 Z" />
                  <path className="fin" d="M -0.18 0.36 Q 0.02 0.56 0.3 0.34 Q 0 0.42 -0.18 0.36 Z" />
                  {/* 鳃弧 */}
                  <path className="gill" d="M -0.52 -0.17 Q -0.42 0 -0.52 0.17" />
                  <circle className="fish-eye" cx={-0.68} cy={-0.07} r={0.08} />
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}
