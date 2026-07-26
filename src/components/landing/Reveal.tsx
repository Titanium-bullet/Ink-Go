import type { ReactNode, ElementType } from "react";
import { useReveal } from "../../hooks/useReveal";

type Variant = "rise" | "wipe" | "bloom" | "draw";

interface RevealProps {
  children: ReactNode;
  /** 错峰序号，越大越晚入场 */
  i?: number;
  /** 每级延迟（ms） */
  step?: number;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  /**
   * 入场样式：
   * - rise：默认，opacity + translateY 缓入（向后兼容）
   * - wipe：clip-path 笔锋自下而上揭开，适合标题
   * - bloom：先背后墨晕扩散再升起，适合卡片（配合 .ink-card）
   * - draw：单纯 opacity，留给 SVG 笔触自绘
   */
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  rise: "reveal",
  wipe: "reveal-wipe",
  bloom: "reveal-bloom",
  draw: "reveal-draw",
};

/**
 * 包裹子节点，滚入视口时以水墨缓入。
 * 通过 --i 自定义属性驱动 CSS transition-delay 实现错峰。
 */
export function Reveal({
  children,
  i = 0,
  step = 90,
  as,
  className = "",
  style,
  variant = "rise",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const [ref, visible] = useReveal<HTMLDivElement>();
  const base = VARIANT_CLASS[variant];
  return (
    <Tag
      ref={ref}
      className={`${base} ${visible ? "is-visible" : ""} ${className}`}
      style={{ ["--i" as string]: i, ["--reveal-step" as string]: `${step}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}
