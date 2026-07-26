import { useEffect, useRef } from "react";

/**
 * 鼠标视差：监听容器 pointermove，把归一化坐标写入 CSS 变量 --mx / --my（范围约 [-1, 1]）。
 * rAF 节流；触屏（无精确指针）与 reduced-motion 下禁用。
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  strength = 1,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduce) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const apply = () => {
      frame = 0;
      node.style.setProperty("--mx", nextX.toFixed(3));
      node.style.setProperty("--my", nextY.toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      nextX = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * strength;
      nextY = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * strength;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}
