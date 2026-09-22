import type { CSSProperties } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { MATERIALS, type BoardTheme } from "../board/materials";

/**
 * 棋盘质感 demo（#hero-demo 三选一存档）。
 * 三种材质共享同一套几何 / 棋子 / 赢线画法，材质色值统一取自 materials.ts
 * （与游戏内 boardChrome、MiniGoban 同源，防止漂移）。
 * 赢线为「细墨线自绘 + 柔底光 + 收尾子金环」，滚动入镜时播放一次。
 */
export type BoardVariant = BoardTheme;

/* —— 共享几何（三种材质完全同构）—— */
const GRID = 11;
const FACE = { x: 20, y: 10, size: 760 };
const MARGIN = 66;
const CELL = (FACE.size - 2 * MARGIN) / (GRID - 1); // 62.8
const px = (n: number) => FACE.x + MARGIN + n * CELL;
const py = (n: number) => FACE.y + MARGIN + n * CELL;
const STONE_R = CELL * 0.46;
const LINE_W = CELL * 0.03;
const OUTER_W = CELL * 0.067;
const STARS = [2, 5, 8];
const SIDE_H = CELL * 0.52; // 盘侧沿厚度

/* 演示局面：黑五连（第 6 行 3–7 列）+ 攻防散子；三盘同形 */
const BLACK: [number, number][] = [
  [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [4, 6], [6, 7],
];
const WHITE: [number, number][] = [
  [5, 4], [5, 6], [2, 3], [8, 7], [7, 2],
];
const WIN = { row: 5, from: 3, to: 7 };
const WIN_LEN = (WIN.to - WIN.from) * CELL;

/** 滚动入镜后播放一次自绘动画（配合 .is-on） */
function useRevealOnce() {
  const ref = useRef<SVGSVGElement>(null);
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
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

/* —— 共享 defs：棋子渐变 / 投影（与 boardChrome 同源四段渐变）—— */
const StoneDefs = memo(function StoneDefs({ p }: { p: string }) {
  return (
    <>
      <radialGradient id={`${p}sbBlack`} cx="34%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#7a665a" />
        <stop offset="30%" stopColor="#332a24" />
        <stop offset="70%" stopColor="#120d0a" />
        <stop offset="100%" stopColor="#040302" />
      </radialGradient>
      <radialGradient id={`${p}sbWhite`} cx="34%" cy="28%" r="74%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f3ecdc" />
        <stop offset="80%" stopColor="#d8c9a8" />
        <stop offset="100%" stopColor="#b8a784" />
      </radialGradient>
      <radialGradient id={`${p}sbSpec`} cx="34%" cy="26%" r="22%">
        <stop offset="0%" stopColor="#bca48f" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#bca48f" stopOpacity="0" />
      </radialGradient>
      <filter id={`${p}sbShadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="3.6" floodColor="#140d04" floodOpacity="0.45" />
      </filter>
    </>
  );
});

function stopsToJsx(stops: { offset: string; color: string; opacity?: number }[], keyPrefix: string) {
  return stops.map((s) => (
    <stop
      key={`${keyPrefix}${s.offset}`}
      offset={s.offset}
      stopColor={s.color}
      stopOpacity={s.opacity ?? 1}
    />
  ));
}

/* —— 材质 defs + 盘体（面 / 侧沿 / 纹理 / 倒角），色值取自 MATERIALS —— */
const VariantBody = memo(function VariantBody({ p, variant }: { p: string; variant: BoardVariant }) {
  const mat = MATERIALS[variant];
  const fx = FACE.x;
  const fy = FACE.y;
  const fs = FACE.size;

  const drop =
    variant === "paper"
      ? { dy: 16, std: 16, opacity: 0.4 }
      : variant === "lacquer"
        ? { dy: 22, std: 22, opacity: 0.6 }
        : { dy: 22, std: 20, opacity: 0.5 };

  return (
    <>
      <defs>
        <linearGradient id={`${p}sbFace`} x1="0" y1="0" x2="1" y2="1">
          {stopsToJsx(mat.face, "f")}
        </linearGradient>
        <linearGradient id={`${p}sbSide`} x1="0" y1="0" x2="0" y2="1">
          {stopsToJsx(mat.side, "s")}
        </linearGradient>
        <linearGradient id={`${p}sbBevel`} x1="0" y1="0" x2="1" y2="1">
          {stopsToJsx(mat.bevel, "b")}
        </linearGradient>
        {mat.grain && (
          <filter id={`${p}sbGrain`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={mat.grain.baseFrequency}
              numOctaves={mat.grain.numOctaves}
              seed={mat.grain.seed}
            />
            <feColorMatrix type="matrix" values={mat.grain.matrix} />
          </filter>
        )}
        {variant === "paper" && (
          <>
            <radialGradient id={`${p}sbLight`} cx="38%" cy="30%" r="75%">
              <stop offset="0%" stopColor={mat.light.color} stopOpacity={mat.light.opacity} />
              <stop offset="100%" stopColor={mat.light.color} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${p}sbVign`} cx="50%" cy="50%" r="60%">
              <stop offset="58%" stopColor={mat.vignette.color} stopOpacity="0" />
              <stop offset="100%" stopColor={mat.vignette.color} stopOpacity={mat.vignette.opacity} />
            </radialGradient>
          </>
        )}
        <filter id={`${p}sbDrop`} x="-15%" y="-10%" width="130%" height="135%">
          <feDropShadow dx="0" dy={drop.dy} stdDeviation={drop.std} floodColor="#000000" floodOpacity={drop.opacity} />
        </filter>
      </defs>

      {/* 盘体：侧沿 + 盘面 */}
      <g filter={`url(#${p}sbDrop)`}>
        <rect
          x={fx} y={fy + fs} width={fs}
          height={variant === "paper" ? SIDE_H * 0.42 : SIDE_H}
          fill={`url(#${p}sbSide)`}
        />
        <rect x={fx} y={fy} width={fs} height={fs} rx={10} fill={`url(#${p}sbFace)`} />
      </g>

      {/* 纹理（宣纸另有柔光 + 墨晕） */}
      {mat.grain && (
        <rect
          x={fx} y={fy} width={fs} height={fs} rx={10}
          filter={`url(#${p}sbGrain)`} opacity={mat.grain.opacity} style={{ mixBlendMode: "multiply" }}
        />
      )}
      {variant === "paper" && (
        <>
          <rect x={fx} y={fy} width={fs} height={fs} rx={8} fill={`url(#${p}sbLight)`} />
          <rect x={fx} y={fy} width={fs} height={fs} rx={8} fill={`url(#${p}sbVign)`} />
          {/* 装裱细线 */}
          <rect
            x={fx + 16} y={fy + 16} width={fs - 32} height={fs - 32} rx={4}
            fill="none" stroke={mat.grid.color} strokeOpacity="0.3" strokeWidth="1.2"
          />
          {/* 朱印 */}
          <g opacity="0.82" transform={`translate(${fx + fs - 66} ${fy + fs - 66})`}>
            <rect width="30" height="30" rx="4" fill="#b23a28" />
            <rect x="5" y="5" width="20" height="20" rx="2" fill="none" stroke="#f4e6c0" strokeWidth="2" opacity="0.85" />
          </g>
        </>
      )}
      {variant === "wood" && (
        <>
          {/* 直纹木理（静态弧线） */}
          <g fill="none" stroke="#7a5220" strokeLinecap="round">
            <path d={`M212 ${fy + 8} C196 ${fy + 220} 226 ${fy + 430} 208 ${fy + fs - 8}`} strokeWidth="2.2" opacity="0.14" />
            <path d={`M428 ${fy + 8} C444 ${fy + 260} 408 ${fy + 480} 430 ${fy + fs - 8}`} strokeWidth="1.6" opacity="0.11" />
            <path d={`M636 ${fy + 8} C622 ${fy + 240} 652 ${fy + 470} 638 ${fy + fs - 8}`} strokeWidth="2.6" opacity="0.12" />
          </g>
          <rect
            x={fx + 1.5} y={fy + 1.5} width={fs - 3} height={fs - 3} rx={8}
            fill="none" stroke={`url(#${p}sbBevel)`} strokeWidth={mat.bevelWidth} opacity="0.55"
          />
        </>
      )}
      {variant === "lacquer" && (
        <>
          {/* 漆面斜晖 */}
          <linearGradient id={`${p}sbSheen`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mat.light.color} stopOpacity="0.1" />
            <stop offset="35%" stopColor={mat.light.color} stopOpacity="0" />
            <stop offset="65%" stopColor={mat.light.color} stopOpacity="0" />
            <stop offset="100%" stopColor={mat.light.color} stopOpacity="0.05" />
          </linearGradient>
          <rect x={fx} y={fy} width={fs} height={fs} rx={10} fill={`url(#${p}sbSheen)`} />
          {/* 鎏金包边：外金线 + 内细线 */}
          <rect
            x={fx + 2.5} y={fy + 2.5} width={fs - 5} height={fs - 5} rx={8}
            fill="none" stroke={`url(#${p}sbBevel)`} strokeWidth={mat.bevelWidth + 1}
          />
          <rect
            x={fx + 14} y={fy + 14} width={fs - 28} height={fs - 28} rx={5}
            fill="none" stroke={mat.grid.color} strokeOpacity="0.35" strokeWidth="1"
          />
        </>
      )}
    </>
  );
});

/* —— 棋子层 —— */
const Stones = memo(function Stones({
  p,
  blackRim,
}: {
  p: string;
  blackRim: { color: string; width: number } | null;
}) {
  return (
    <g>
      {WHITE.map(([c, r]) => (
        <circle
          key={`w${c}-${r}`}
          cx={px(c)} cy={py(r)} r={STONE_R}
          fill={`url(#${p}sbWhite)`} filter={`url(#${p}sbShadow)`}
        />
      ))}
      {BLACK.map(([c, r]) => (
        <g key={`b${c}-${r}`} filter={`url(#${p}sbShadow)`}>
          <circle cx={px(c)} cy={py(r)} r={STONE_R} fill={`url(#${p}sbBlack)`} />
          <circle
            cx={px(c) - STONE_R * 0.18} cy={py(r) - STONE_R * 0.22}
            r={STONE_R * 0.6} fill={`url(#${p}sbSpec)`}
          />
          {blackRim && (
            <circle
              cx={px(c)} cy={py(r)} r={STONE_R - 0.8}
              fill="none" stroke={blackRim.color} strokeWidth={blackRim.width}
            />
          )}
        </g>
      ))}
    </g>
  );
});

export const StyleBoard = memo(function StyleBoard({
  variant,
  idPrefix,
}: {
  variant: BoardVariant;
  idPrefix: string;
}) {
  const mat = MATERIALS[variant];
  const p = idPrefix;
  const { ref, on } = useRevealOnce();

  const winY = py(WIN.row);
  const wx1 = px(WIN.from);
  const wx2 = px(WIN.to);

  return (
    <svg
      ref={ref}
      className={`style-board${on ? " is-on" : ""}`}
      viewBox="0 0 800 840"
      role="img"
      aria-label={`${variant} 材质棋盘示例`}
    >
      <VariantBody p={p} variant={variant} />
      <StoneDefs p={p} />
      <defs>
        <radialGradient id={`${p}sbGlow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={mat.win.glow} stopOpacity={mat.win.glowOp} />
          <stop offset="100%" stopColor={mat.win.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 网格 */}
      <g stroke={mat.grid.color} strokeOpacity={mat.grid.opacity} strokeWidth={LINE_W} strokeLinecap="round">
        {Array.from({ length: GRID }).map((_, i) => (
          <line key={`v${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(GRID - 1)} />
        ))}
        {Array.from({ length: GRID }).map((_, i) => (
          <line key={`h${i}`} x1={px(0)} y1={py(i)} x2={px(GRID - 1)} y2={py(i)} />
        ))}
      </g>
      {/* 外框线加粗（漆盘先铺一圈柔金再压实线） */}
      {variant === "lacquer" && (
        <rect
          x={px(0)} y={py(0)} width={(GRID - 1) * CELL} height={(GRID - 1) * CELL}
          fill="none" stroke={mat.grid.color} strokeOpacity="0.16" strokeWidth={OUTER_W * 2.4}
        />
      )}
      <rect
        x={px(0)} y={py(0)} width={(GRID - 1) * CELL} height={(GRID - 1) * CELL}
        fill="none" stroke={mat.grid.color}
        strokeOpacity={Math.min(1, mat.grid.opacity + 0.08)}
        strokeWidth={OUTER_W}
      />

      {/* 星位 */}
      {STARS.flatMap((sx) =>
        STARS.map((sy) => (
          <g key={`s${sx}-${sy}`}>
            <circle cx={px(sx)} cy={py(sy)} r={CELL * 0.18} fill={mat.star.halo} opacity="0.2" />
            <circle cx={px(sx)} cy={py(sy)} r={CELL * 0.1} fill={mat.star.core} />
          </g>
        )),
      )}

      {/* 赢线：柔底光 → 棋子 → 细墨线自绘 → 收尾子金环 */}
      <ellipse cx={(wx1 + wx2) / 2} cy={winY} rx={CELL * 2.6} ry={CELL * 1.5} fill={`url(#${p}sbGlow)`} />
      <Stones p={p} blackRim={mat.blackRim} />
      <line
        className="sb-line"
        x1={wx1} y1={winY} x2={wx2} y2={winY}
        stroke={mat.win.line}
        strokeWidth={CELL * 0.115}
        strokeLinecap="round"
        style={{ ["--sb-len" as string]: `${WIN_LEN}` } as CSSProperties}
      />
      <circle
        className="sb-ring"
        cx={wx2} cy={winY}
        r={STONE_R + CELL * 0.1}
        fill="none" stroke={mat.win.ring} strokeWidth={CELL * 0.055}
      />
    </svg>
  );
});
