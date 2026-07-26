import { Color } from "../go/types";

// AI 返回的一手：一维下标（与 engine 一致），null 表示虚手
export type AIMove = number | null;

// 统一围棋 AI 接口，GnuGo(WASM) 与自研 MCTS 都实现它
export interface GoAI {
  genmove(state: import("../go/types").GameState): Promise<AIMove>;
  // 开始新对局 / 切换棋盘尺寸时调用
  setSize(size: number): void;
}

export type AIDifficulty = "weak" | "medium" | "strong";

// GnuGo level 映射：弱=1 / 中=5 / 强=10
export const DIFFICULTY_LEVEL: Record<AIDifficulty, number> = {
  weak: 1,
  medium: 5,
  strong: 10,
};

// 对手配置
export interface OpponentConfig {
  // 引擎：null=双人对弈，"gnugo"=GnuGo，"mcts"=自研引擎
  engine: "gnugo" | "mcts" | null;
  // 仅 GnuGo 有效
  difficulty: AIDifficulty;
  // AI 执子颜色（双人模式忽略）
  color: Color;
}
