import { Color } from "../go/types";

// AI 返回的一手：一维下标（与 engine 一致），null 表示虚手
export type AIMove = number | null;

// 统一围棋 AI 接口，GnuGo(WASM) 与自研 MCTS 都实现它
export interface GoAI {
  genmove(
    state: import("../go/types").GameState,
    opts?: { difficulty?: AIDifficulty }
  ): Promise<AIMove>;
  // 终局比分估算（GnuGo 死子判定口径）：正 = 白领先，负 = 黑领先；不可用返回 null
  estimate(state: import("../go/types").GameState): Promise<number | null>;
  // 开始新对局 / 切换棋盘尺寸时调用
  setSize(size: number): void;
}

export type AIDifficulty = "weak" | "medium" | "strong";

// 对手配置
export interface OpponentConfig {
  // 引擎：null=双人对弈，"gnugo"=GnuGo，"mcts"=自研引擎
  engine: "gnugo" | "mcts" | null;
  // 仅 GnuGo 有效。注：GnuGo 等级被 wasm 编译期固定（无导出可调），
  // weak/medium 由适配层概率性替换合理随机手实现强度差，strong 为原始 GnuGo。
  difficulty: AIDifficulty;
  // AI 执子颜色（双人模式忽略）
  color: Color;
}
