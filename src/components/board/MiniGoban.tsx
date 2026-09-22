import type { CSSProperties } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { MATERIALS, type BoardTheme } from "./materials";

/**
 * 迷你棋盘（落地页预览用）：材质与游戏内 boardChrome 同源（materials.ts）。
 * - MiniGobanInner：<g> 形态，供嵌入宿主 SVG（Hero 视差层），局部坐标 0..800 × 0..840
 * - MiniGoban：独立 <svg> 形态（DLC 预览等）
 * 赢线画法：柔底光 → 棋子 → 细墨线自绘 → 收尾子金环。
 * 滚动/挂载后播放一次自绘动画（IntersectionObserver 加 is-on）。
 */

export const MG_VIEW = { w: 800, h: 840 };
const FACE = { x: 20, y: 10, size: 760 };
const MARGIN = 66;
const SIDE_H = 33;

function mgGeom(lines: number) {
  const cell = (FACE.size - 2 * MARGIN) / (lines - 1);
  return {
    cell,
    px: (n: number) => FACE.x + MARGIN + n * cell,
    py: (n: number) => FACE.y + MARGIN + n * cell,
    stoneR: cell * 0.46,
  };
}

function mgStars(lines: number): number[] {
  if (lines === 15) return [3, 7, 11];
  if (lines === 13) return [3, 6, 9];
  if (lines === 11) return [2, 5, 8];
  if (lines === 9) return [2, 4, 6];
  return [Math.floor(lines / 2)];
}

export interface MiniGobanProps {
  /** SVG defs id 前缀，同屏多盘时必须唯一 */
  p: string;
  lines?: number;
  theme?: BoardTheme;
  black: [number, number][];
  white: [number, number][];
  /** 赢线（五连等共线子，任意方向）：柔光 + 自绘墨线 + 收尾子金环 */
  win?: { from: [number, number]; to: [number, number] };
  /** 最后一手金环标记 */
  lastMove?: [number, number];
  /** 落子墨绦：从 from 子流向 to 子，自绘一次 */
  ink?: { from: [number, number]; to: [number, number] };
  className?: string;
}

/** 滚动入镜后置 is-on，播一次自绘动画 */
function useRevealOnce() {
  const ref = useRef<SVGGElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

const MaterialDefs = memo(function MaterialDefs({
  p,
  theme,
}: {
  p: string;
  theme: BoardTheme;
}) {
  const mat = MATERIALS[theme];
  return (
    <defs>
      <linearGradient id={`${p}mgFace`} x1="0" y1="0" x2="1" y2="1">
        {mat.face.map((s) => (
          <stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </linearGradient>
      <linearGradient id={`${p}mgSide`} x1="0" y1="0" x2="0" y2="1">
        {mat.side.map((s) => (
          <stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </linearGradient>
      <linearGradient id={`${p}mgBevel`} x1="0" y1="0" x2="1" y2="1">
        {mat.bevel.map((s) => (
          <stop
            key={s.offset}
            offset={s.offset}
            stopColor={s.color}
            stopOpacity={s.opacity ?? 1}
          />
        ))}
      </linearGradient>
      <radialGradient id={`${p}mgGlow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={mat.win.glow} stopOpacity={mat.win.glowOp} />
        <stop offset="100%" stopColor={mat.win.glow} stopOpacity="0" />
      </radialGradient>
      {mat.grain && (
        <filter id={`${p}mgGrain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={mat.grain.baseFrequency}
            numOctaves={mat.grain.numOctaves}
            seed={mat.grain.seed}
          />
          <feColorMatrix type="matrix" values={mat.grain.matrix} />
        </filter>
      )}
      <filter id={`${p}mgDrop`} x="-15%" y="-10%" width="130%" height="135%">
        <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#000000" floodOpacity="0.5" />
      </filter>
      {/* 棋子渐变与 boardChrome 同源 */}
      <radialGradient id={`${p}mgBlack`} cx="34%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#7a665a" />
        <stop offset="30%" stopColor="#332a24" />
        <stop offset="70%" stopColor="#120d0a" />
        <stop offset="100%" stopColor="#040302" />
      </radialGradient>
      <radialGradient id={`${p}mgWhite`} cx="34%" cy="28%" r="74%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f3ecdc" />
        <stop offset="80%" stopColor="#d8c9a8" />
        <stop offset="100%" stopColor="#b8a784" />
      </radialGradient>
      <radialGradient id={`${p}mgSpec`} cx="34%" cy="26%" r="22%">
        <stop offset="0%" stopColor="#bca48f" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#bca48f" stopOpacity="0" />
      </radialGradient>
      <filter id={`${p}mgShadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="3.6" floodColor="#140d04" floodOpacity="0.45" />
      </filter>
    </defs>
  );
});

export const MiniGobanInner = memo(function MiniGobanInner({
  p,
  lines = 11,
  theme = "wood",
  black,
  white,
  win,
  lastMove,
  ink: inkProp,
  className,
}: MiniGobanProps) {
  const { cell, px, py, stoneR } = mgGeom(lines);
  const mat = MATERIALS[theme];
  const { ref, on } = useRevealOnce();
  const stars = mgStars(lines);
  const gridW = Math.max(1.2, cell * 0.03);
  const outerW = cell * 0.067;

  const winY1 = win ? py(win.from[1]) : 0;
  const winY2 = win ? py(win.to[1]) : 0;
  const winX1 = win ? px(win.from[0]) : 0;
  const winX2 = win ? px(win.to[0]) : 0;
  const winLen = win ? Math.hypot(winX2 - winX1, winY2 - winY1) : 0;
  // 斜向赢线的柔底光：ellipse 随赢线方向旋转
  const winAng = win ? (Math.atan2(winY2 - winY1, winX2 - winX1) * 180) / Math.PI : 0;
  const winMidX = (winX1 + winX2) / 2;
  const winMidY = (winY1 + winY2) / 2;

  const ink = inkProp
    ? (() => {
        const [fc, fr] = inkProp.from;
        const [tc, tr] = inkProp.to;
        const fx = px(fc);
        const fy = py(fr);
        const tx = px(tc);
        const ty = py(tr);
        const dx = tx - fx;
        const dy = ty - fy;
        return {
          d: `M${fx} ${fy} C ${fx + dx * 0.15} ${fy + dy * 0.7}, ${fx + dx * 0.5} ${ty}, ${tx} ${ty}`,
          len: Math.hypot(dx, dy) * 1.18,
        };
      })()
    : null;

  return (
    <g ref={ref} className={`mg${on ? " is-on" : ""}${className ? ` ${className}` : ""}`}>
      <MaterialDefs p={p} theme={theme} />

      {/* 盘体：侧沿 + 盘面 + 纹理 + 倒角 */}
      <g filter={`url(#${p}mgDrop)`}>
        <rect x={FACE.x} y={FACE.y + FACE.size} width={FACE.size} height={SIDE_H} fill={`url(#${p}mgSide)`} />
        <rect x={FACE.x} y={FACE.y} width={FACE.size} height={FACE.size} rx={10} fill={`url(#${p}mgFace)`} />
      </g>
      {mat.grain && (
        <rect
          x={FACE.x} y={FACE.y} width={FACE.size} height={FACE.size} rx={10}
          filter={`url(#${p}mgGrain)`} opacity={mat.grain.opacity} style={{ mixBlendMode: "multiply" }}
        />
      )}
      {/* 柔光（漆面即高光斜晖） */}
      <rect x={FACE.x} y={FACE.y} width={FACE.size} height={FACE.size} rx={10} fill={`url(#${p}mgGlow)`} opacity="0.4" />
      <rect
        x={FACE.x + 1.5} y={FACE.y + 1.5} width={FACE.size - 3} height={FACE.size - 3} rx={8}
        fill="none" stroke={`url(#${p}mgBevel)`} strokeWidth={mat.bevelWidth} opacity="0.7"
      />

      {/* 网格 + 加粗外框 */}
      <g stroke={mat.grid.color} strokeOpacity={mat.grid.opacity} strokeWidth={gridW} strokeLinecap="round">
        {Array.from({ length: lines }).map((_, i) => (
          <line key={`v${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(lines - 1)} />
        ))}
        {Array.from({ length: lines }).map((_, i) => (
          <line key={`h${i}`} x1={px(0)} y1={py(i)} x2={px(lines - 1)} y2={py(i)} />
        ))}
      </g>
      <rect
        x={px(0)} y={py(0)} width={(lines - 1) * cell} height={(lines - 1) * cell}
        fill="none" stroke={mat.grid.color}
        strokeOpacity={Math.min(1, mat.grid.opacity + 0.06)} strokeWidth={outerW}
      />

      {/* 星位 */}
      {stars.flatMap((sx) =>
        stars.map((sy) => (
          <g key={`s${sx}-${sy}`}>
            <circle cx={px(sx)} cy={py(sy)} r={cell * 0.18} fill={mat.star.halo} opacity="0.2" />
            <circle cx={px(sx)} cy={py(sy)} r={cell * 0.1} fill={mat.star.core} />
          </g>
        )),
      )}

      {/* 赢线柔底光（棋子之下），随赢线方向旋转 */}
      {win && (
        <ellipse
          cx={winMidX}
          cy={winMidY}
          rx={winLen / 2 + cell * 1.7}
          ry={cell * 1.5}
          fill={`url(#${p}mgGlow)`}
          transform={`rotate(${winAng} ${winMidX} ${winMidY})`}
        />
      )}

      {/* 棋子 */}
      {white.map(([c, r]) => (
        <circle
          key={`w${c}-${r}`}
          cx={px(c)} cy={py(r)} r={stoneR}
          fill={`url(#${p}mgWhite)`} filter={`url(#${p}mgShadow)`}
        />
      ))}
      {black.map(([c, r]) => (
        <g key={`b${c}-${r}`} filter={`url(#${p}mgShadow)`}>
          <circle cx={px(c)} cy={py(r)} r={stoneR} fill={`url(#${p}mgBlack)`} />
          <circle
            cx={px(c) - stoneR * 0.18} cy={py(r) - stoneR * 0.22}
            r={stoneR * 0.6} fill={`url(#${p}mgSpec)`}
          />
          {mat.blackRim && (
            <circle
              cx={px(c)} cy={py(r)} r={stoneR - 0.8}
              fill="none" stroke={mat.blackRim.color} strokeWidth={mat.blackRim.width}
            />
          )}
        </g>
      ))}

      {/* 赢线墨绦（自绘）+ 收尾子金环 */}
      {win && (
        <>
          <line
            className="mg-line"
            x1={winX1} y1={winY1} x2={winX2} y2={winY2}
            stroke={mat.win.line}
            strokeWidth={cell * 0.115}
            strokeLinecap="round"
            style={{ ["--mg-len" as string]: `${winLen}` } as CSSProperties}
          />
          <circle
            className="mg-ring"
            cx={winX2} cy={winY2}
            r={stoneR + cell * 0.1}
            fill="none" stroke={mat.win.ring} strokeWidth={cell * 0.055}
          />
        </>
      )}

      {/* 落子墨绦（自绘）+ 最后一手金环 */}
      {ink && (
        <path
          className="mg-ink"
          d={ink.d}
          fill="none"
          stroke={theme === "lacquer" ? mat.win.line : "#241708"}
          strokeWidth={cell * 0.12}
          strokeLinecap="round"
          opacity="0.8"
          style={{ ["--mg-ink-len" as string]: `${ink.len}` } as CSSProperties}
        />
      )}
      {lastMove && (
        <circle
          cx={px(lastMove[0])} cy={py(lastMove[1])}
          r={stoneR + cell * 0.09}
          fill="none" stroke={mat.win.ring} strokeWidth={cell * 0.05} opacity="0.85"
        />
      )}
    </g>
  );
});


export const MiniGoban = memo(function MiniGoban(props: MiniGobanProps) {
  return (
    <svg className={props.className ?? "mini-goban"} viewBox={`0 0 ${MG_VIEW.w} ${MG_VIEW.h}`} aria-hidden="true">
      <MiniGobanInner {...props} />
    </svg>
  );
});
