// 棋盘「底座」共享层 —— 纸纹 / 渐变定义 / 网格 / 星位 / 坐标。
// 围棋 Goban 与五子棋 GomokuBoard 的底座完全同构（原先两处 ~200 行重复），
// 差异只有 id 前缀（两盘同屏时 SVG id 不能撞）与星位风格。
//
// 这些子组件只依赖 size / letters / flavor 等基本不变 的输入，
// 全部 React.memo：hover、落子、比分变化都不会再 diff 这几百个节点。
import { memo } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { MATERIALS, type BoardTheme } from "../board/materials";

export const VIEW = 1000;
export const MARGIN = 74;

export interface Geom {
  size: number;
  cell: number;
  px: (n: number) => number;
  stoneR: number;
}

export function boardGeom(size: number): Geom {
  const cell = (VIEW - 2 * MARGIN) / (size - 1);
  return {
    size,
    cell,
    px: (n: number) => MARGIN + n * cell,
    stoneR: cell * 0.46,
  };
}

/** id 前缀（围棋传 ""，五子棋传 "gm"），保证两盘同屏时渐变/滤镜 id 不冲突 */
export const BoardDefs = memo(function BoardDefs({
  p,
  theme = "wood",
}: {
  p: string;
  theme?: BoardTheme;
}) {
  const mat = MATERIALS[theme];
  return (
    <defs>
      {/* 盘面（材质来自 materials.ts 单一来源） */}
      <linearGradient id={`${p}paperBase`} x1="0" y1="0" x2="1" y2="1">
        {mat.face.map((s) => (
          <stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </linearGradient>
      <linearGradient id={`${p}paperBevel`} x1="0" y1="0" x2="1" y2="1">
        {mat.bevel.map((s) => (
          <stop
            key={s.offset}
            offset={s.offset}
            stopColor={s.color}
            stopOpacity={s.opacity ?? 1}
          />
        ))}
      </linearGradient>
      <radialGradient id={`${p}paperLight`} cx="38%" cy="30%" r="75%">
        <stop offset="0%" stopColor={mat.light.color} stopOpacity={mat.light.opacity} />
        <stop offset="100%" stopColor={mat.light.color} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}vignette`} cx="50%" cy="50%" r="62%">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor={mat.vignette.color} stopOpacity={mat.vignette.opacity} />
      </radialGradient>
      {/* 直纹木理：横向低频、纵向高频的拉伸噪声（漆面材质 opacity 置 0） */}
      <filter id={`${p}paperGrain`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={mat.grain?.baseFrequency ?? "0.12 0.008"}
          numOctaves={mat.grain?.numOctaves ?? 4}
          seed={mat.grain?.seed ?? 11}
        />
        <feColorMatrix type="matrix" values={mat.grain?.matrix ?? "0"} />
      </filter>

      {/* stones */}
      <radialGradient id={`${p}blackStone`} cx="34%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#7a665a" />
        <stop offset="30%" stopColor="#332a24" />
        <stop offset="70%" stopColor="#120d0a" />
        <stop offset="100%" stopColor="#040302" />
      </radialGradient>
      <radialGradient id={`${p}whiteStone`} cx="34%" cy="28%" r="74%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f3ecdc" />
        <stop offset="80%" stopColor="#d8c9a8" />
        <stop offset="100%" stopColor="#b8a784" />
      </radialGradient>
      <radialGradient id={`${p}blackSpec`} cx="34%" cy="26%" r="22%">
        <stop offset="0%" stopColor="#bca48f" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#bca48f" stopOpacity="0" />
      </radialGradient>

      <filter id={`${p}stoneShadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="3.4" floodColor="#1a1208" floodOpacity="0.5" />
      </filter>
      <filter id={`${p}jadeGlow`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#fff7e2" floodOpacity="0.5" />
      </filter>

      {/* ko rift 龙脉裂隙（仅围棋用） */}
      <radialGradient id={`${p}riftGrad`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f5b94a" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#c8392a" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#3a1a2a" stopOpacity="0" />
      </radialGradient>

      {/* 灵泉 spirit spring — warm amber-gold, kept subdued so it reads as a
          water vein under the board rather than a flashing beacon */}
      <radialGradient id={`${p}springGlow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e0a847" stopOpacity="0.3" />
        <stop offset="55%" stopColor="#9a6b25" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#6e4a18" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}springCore`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e6cd96" />
        <stop offset="60%" stopColor="#a8752a" />
        <stop offset="100%" stopColor="#5d3c14" />
      </radialGradient>
    </defs>
  );
});

export const BoardPaper = memo(function BoardPaper({
  p,
  theme = "wood",
}: {
  p: string;
  theme?: BoardTheme;
}) {
  const mat = MATERIALS[theme];
  return (
    <g>
      <rect x="0" y="0" width={VIEW} height={VIEW} fill={`url(#${p}paperBase)`} />
      <rect x="0" y="0" width={VIEW} height={VIEW} fill={`url(#${p}paperLight)`} />
      {mat.grain && (
        <rect
          x="0"
          y="0"
          width={VIEW}
          height={VIEW}
          filter={`url(#${p}paperGrain)`}
          opacity={mat.grain.opacity}
          style={{ mixBlendMode: "multiply" }}
        />
      )}
      <rect x="0" y="0" width={VIEW} height={VIEW} fill={`url(#${p}vignette)`} />
      <rect
        x="1.5"
        y="1.5"
        width={VIEW - 3}
        height={VIEW - 3}
        fill="none"
        stroke={`url(#${p}paperBevel)`}
        strokeWidth={mat.bevelWidth + 1}
        opacity="0.7"
      />
    </g>
  );
});

export const BoardGrid = memo(function BoardGrid({
  size,
  theme = "wood",
}: {
  size: number;
  theme?: BoardTheme;
}) {
  const { cell, px } = boardGeom(size);
  const mat = MATERIALS[theme];
  return (
    <g stroke={mat.grid.color} strokeOpacity={mat.grid.opacity} strokeWidth={Math.max(1.1, cell * 0.02)} strokeLinecap="round">
      {Array.from({ length: size }).map((_, i) => (
        <line key={`v${i}`} x1={px(i)} y1={px(0)} x2={px(i)} y2={px(size - 1)} />
      ))}
      {Array.from({ length: size }).map((_, i) => (
        <line key={`h${i}`} x1={px(0)} y1={px(i)} x2={px(size - 1)} y2={px(i)} />
      ))}
    </g>
  );
});

function goStarPoints(size: number): number[] {
  if (size === 19) return [3, 9, 15];
  if (size === 13) return [3, 6, 9];
  if (size === 9) return [2, 4, 6];
  const c = Math.floor(size / 2);
  return [c];
}

function gomokuStarPoints(size: number): number[] {
  if (size === 15) return [3, 7, 11];
  const c = Math.floor(size / 2);
  return [c];
}

/** 星位。kind: "go" 开墨兽时化作灵泉（SMIL 弹簧），否则/plain 均为墨点 */
export const BoardStars = memo(function BoardStars({
  size,
  kind,
  flavor,
  theme = "wood",
  p = "",
}: {
  size: number;
  kind: "go" | "gomoku";
  flavor: boolean;
  theme?: BoardTheme;
  /** SVG defs id 前缀，同屏多盘时必须唯一（与 BoardDefs 一致） */
  p?: string;
}) {
  const { cell, px } = boardGeom(size);
  const mat = MATERIALS[theme];
  const stars = kind === "go" ? goStarPoints(size) : gomokuStarPoints(size);
  const spring = kind === "go" && flavor;
  return (
    <g>
      {stars.flatMap((sx) =>
        stars.map((sy) =>
          spring ? (
            <g key={`s${sx}-${sy}`}>
              <circle cx={px(sx)} cy={px(sy)} r={cell * 0.21} fill={`url(#${p}springGlow)`} />
              <circle cx={px(sx)} cy={px(sy)} r={cell * 0.085} fill={`url(#${p}springCore)`} />
              <SpringRipples cx={px(sx)} cy={px(sy)} cell={cell} />
            </g>
          ) : (
            <g key={`s${sx}-${sy}`}>
              <circle cx={px(sx)} cy={px(sy)} r={cell * 0.16} fill={mat.star.halo} opacity="0.28" />
              <circle cx={px(sx)} cy={px(sy)} r={cell * 0.09} fill={mat.star.core} />
            </g>
          )
        )
      )}
    </g>
  );
});

// SMIL 弹簧单独成组件：prefers-reduced-motion 时不渲染 <animate>（CSS 管不到 SMIL）。
function SpringRipples({ cx, cy, cell }: { cx: number; cy: number; cell: number }) {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <circle cx={cx} cy={cy} r={cell * 0.10} fill="none" stroke="#d3b271" strokeWidth={cell * 0.03} opacity="0">
        {!reduced && (
          <>
            <animate attributeName="r" values={`${cell * 0.09};${cell * 0.24}`} dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0" dur="3.2s" repeatCount="indefinite" />
          </>
        )}
      </circle>
      <circle cx={cx} cy={cy} r={cell * 0.10} fill="none" stroke="#d3b271" strokeWidth={cell * 0.026} opacity="0">
        {!reduced && (
          <>
            <animate attributeName="r" values={`${cell * 0.09};${cell * 0.24}`} dur="3.2s" begin="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0" dur="3.2s" begin="1.6s" repeatCount="indefinite" />
          </>
        )}
      </circle>
    </>
  );
}

export const BoardCoords = memo(function BoardCoords({
  size,
  letters,
  theme = "wood",
}: {
  size: number;
  letters: string;
  theme?: BoardTheme;
}) {
  const { cell, px } = boardGeom(size);
  return (
    <g fill={MATERIALS[theme].coord} fontSize={cell * 0.3} fontFamily="serif" textAnchor="middle">
      {Array.from({ length: size }).map((_, i) => (
        <g key={`coord${i}`}>
          <text x={px(i)} y={MARGIN * 0.5} dominantBaseline="middle">{letters[i]}</text>
          <text x={px(i)} y={VIEW - MARGIN * 0.5} dominantBaseline="middle">{letters[i]}</text>
          <text x={MARGIN * 0.45} y={px(i)} dominantBaseline="middle">{size - i}</text>
          <text x={VIEW - MARGIN * 0.45} y={px(i)} dominantBaseline="middle">{size - i}</text>
        </g>
      ))}
    </g>
  );
});
