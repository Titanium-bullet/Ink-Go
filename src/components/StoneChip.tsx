import { BLACK, type Color } from "../go/types";

// 小尺寸棋子（模式选择卡片 / 侧栏提子计数等）。
// 渐变与棋盘 SVG 棋子同源：四段径向渐变 + 左上柔和高光，
// 替换早期"两段灰褐渐变 + 大块白斑"的粗糙质感。
export function StoneChip({
  color,
  size = "1.5rem",
}: {
  color: Color;
  size?: string;
}) {
  const isBlack = color === BLACK;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: isBlack
          ? "radial-gradient(circle at 30% 22%, rgba(188,164,143,0.5) 0%, rgba(188,164,143,0) 42%), radial-gradient(circle at 34% 28%, #7a665a 0%, #332a24 30%, #120d0a 70%, #040302 100%)"
          : "radial-gradient(circle at 34% 28%, #ffffff 0%, #f3ecdc 45%, #d8c9a8 80%, #b8a784 100%)",
        boxShadow: isBlack
          ? "0 2px 6px rgba(0,0,0,0.5), inset 0 0 3px rgba(0,0,0,0.5)"
          : "0 2px 6px rgba(0,0,0,0.25), inset 0 0 4px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
    />
  );
}
