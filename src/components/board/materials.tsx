/**
 * 棋盘材质单一来源：wood 写实木纹（默认）/ paper 宣纸水墨 / lacquer 玄漆鎏金。
 * 游戏内底座（boardChrome）、落地页预览（MiniGoban）与质感存档（StyleBoard）
 * 全部从这里取色，防止多份 hex 漂移。
 */

export type BoardTheme = "wood" | "paper" | "lacquer";

export interface GradientStop {
  offset: string;
  color: string;
  opacity?: number;
}

export interface MaterialSpec {
  /** 盘面主渐变（对角线方向） */
  face: GradientStop[];
  /** 柔光/漆面高光（径向） */
  light: { color: string; opacity: number };
  /** 边缘暗角 */
  vignette: { color: string; opacity: number };
  /** 纹理噪声：lacquer 为 null（漆面无纹理） */
  grain: {
    baseFrequency: string;
    numOctaves: number;
    seed: number;
    /** feColorMatrix values（把噪声染成材质色） */
    matrix: string;
    opacity: number;
  } | null;
  /** 边缘倒角描边渐变 */
  bevel: GradientStop[];
  bevelWidth: number;
  /** 迷你盘侧沿（厚度） */
  side: GradientStop[];
  grid: { color: string; opacity: number };
  star: { halo: string; core: string };
  coord: string;
  /** 五连赢线配色（墨线 / 金环 / 底光） */
  win: { line: string; ring: string; glow: string; glowOp: number };
  /** 玄漆盘黑子描边（其余材质为 null） */
  blackRim: { color: string; width: number } | null;
}

export const BOARD_THEMES: BoardTheme[] = ["wood", "paper", "lacquer"];

export const MATERIALS: Record<BoardTheme, MaterialSpec> = {
  wood: {
    face: [
      { offset: "0%", color: "#eec987" },
      { offset: "52%", color: "#ddb05f" },
      { offset: "100%", color: "#c99548" },
    ],
    light: { color: "#fff3d2", opacity: 0.5 },
    vignette: { color: "#2a1c0c", opacity: 0.42 },
    grain: {
      baseFrequency: "0.12 0.008",
      numOctaves: 4,
      seed: 11,
      matrix: "0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0 0.05  0.55 0 0 0 0",
      opacity: 0.55,
    },
    bevel: [
      { offset: "0%", color: "#fff4d6", opacity: 0.6 },
      { offset: "40%", color: "#fff4d6", opacity: 0 },
      { offset: "62%", color: "#3c2408", opacity: 0 },
      { offset: "100%", color: "#3c2408", opacity: 0.5 },
    ],
    bevelWidth: 2.5,
    side: [
      { offset: "0%", color: "#8a5f28" },
      { offset: "100%", color: "#4a300f" },
    ],
    grid: { color: "#3a230e", opacity: 0.9 },
    star: { halo: "#3a230e", core: "#2a1808" },
    coord: "#54401f",
    win: { line: "#140c06", ring: "#f5b94a", glow: "#e6a747", glowOp: 0.26 },
    blackRim: null,
  },
  paper: {
    face: [
      { offset: "0%", color: "#f4e6c0" },
      { offset: "55%", color: "#e9d6aa" },
      { offset: "100%", color: "#d6bd85" },
    ],
    light: { color: "#fdf6dd", opacity: 0.75 },
    vignette: { color: "#3a2a14", opacity: 0.24 },
    grain: {
      baseFrequency: "0.7",
      numOctaves: 2,
      seed: 7,
      matrix: "0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.18  0.35 0 0 0 0",
      opacity: 0.5,
    },
    bevel: [
      { offset: "0%", color: "#fffaf0", opacity: 0.7 },
      { offset: "45%", color: "#fffaf0", opacity: 0 },
      { offset: "60%", color: "#3a2a14", opacity: 0 },
      { offset: "100%", color: "#3a2a14", opacity: 0.32 },
    ],
    bevelWidth: 2,
    side: [
      { offset: "0%", color: "#a98c5c" },
      { offset: "100%", color: "#83683f" },
    ],
    grid: { color: "#2a1c10", opacity: 0.92 },
    star: { halo: "#2a1c10", core: "#241608" },
    coord: "#4a3a20",
    win: { line: "#17100a", ring: "#b9862e", glow: "#6f6250", glowOp: 0.22 },
    blackRim: null,
  },
  lacquer: {
    face: [
      { offset: "0%", color: "#1e150d" },
      { offset: "55%", color: "#120c07" },
      { offset: "100%", color: "#0b0705" },
    ],
    light: { color: "#f0dcaa", opacity: 0.09 },
    vignette: { color: "#000000", opacity: 0.5 },
    grain: null,
    bevel: [
      { offset: "0%", color: "#f0d493" },
      { offset: "50%", color: "#c39a55" },
      { offset: "100%", color: "#8a6528" },
    ],
    bevelWidth: 4,
    side: [
      { offset: "0%", color: "#241a10" },
      { offset: "100%", color: "#0d0805" },
    ],
    grid: { color: "#d8b36e", opacity: 0.82 },
    star: { halo: "#d8b36e", core: "#e8c887" },
    coord: "#c9a86b",
    win: { line: "#f0c465", ring: "#f5d78a", glow: "#e8b458", glowOp: 0.3 },
    blackRim: { color: "rgba(238, 206, 146, 0.32)", width: 1.6 },
  },
};
