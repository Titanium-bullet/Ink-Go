import { useEffect, useRef } from "react";

/**
 * 在挂载节点上跟随光标生成短暂的水墨滴涟漪（克制版）。
 * - 仅 pointer:fine 设备与未开启 reduced-motion 时启用
 * - rAF 节流，最小生成间隔 ~45ms
 * - 节点销毁时一并清理残留节点
 */
export function useInkCursor<T extends HTMLElement = HTMLDivElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduce) return;

    let last = 0;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const spawn = () => {
      frame = 0;
      const dot = document.createElement("span");
      dot.className = "cursor-ink";
      dot.style.left = `${nextX}px`;
      dot.style.top = `${nextY}px`;
      node.appendChild(dot);
      window.setTimeout(() => dot.remove(), 820);
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      nextX = e.clientX - rect.left;
      nextY = e.clientY - rect.top;
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      if (!frame) frame = requestAnimationFrame(spawn);
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      node.querySelectorAll(".cursor-ink").forEach((el) => el.remove());
    };
  }, []);

  return ref;
}
