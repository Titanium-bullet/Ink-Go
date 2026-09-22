import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * 在挂载节点上跟随光标生成短暂的水墨滴涟漪（克制版）。
 * - 仅 pointer:fine 设备与未开启 reduced-motion 时启用（reduced 运行中变化即时生效）
 * - rAF 节流，最小生成间隔 ~90ms，同时在場墨滴上限 8（DOM/图层扰动有界）
 * - 墨滴锚定到挂载层，但监听挂在 window 上：墨迹层本身是
 *   pointer-events:none 的覆盖层（不挡交互），事件永远不会命中它
 * - 每滴随机大小/浓淡、偶发淡墨色，打破等距机械点列；随机参数只写在内联
 *   style 的自定义属性上，动画仍由 .cursor-ink 的 keyframes 统一驱动
 * - 节点销毁时一并清理残留节点
 */
const MIN_INTERVAL_MS = 90;
const MAX_LIVE_DOTS = 8;
/** 墨滴寿命：单一来源，以 inline animationDuration 注入，CSS 不再写死时长 */
const INK_DROP_MS = 820;

export function useInkCursor<T extends HTMLElement = HTMLDivElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;

    let last = 0;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;
    let live = 0;

    const spawn = () => {
      frame = 0;
      if (live >= MAX_LIVE_DOTS) return;
      const dot = document.createElement("span");
      // 大多数金辉墨滴，偶发一滴淡墨，轨迹不单调
      dot.className = Math.random() < 0.25 ? "cursor-ink cursor-ink--wash" : "cursor-ink";
      dot.style.left = `${nextX}px`;
      dot.style.top = `${nextY}px`;
      dot.style.setProperty("--s", (0.7 + Math.random() * 0.8).toFixed(2));
      dot.style.setProperty("--o", (0.55 + Math.random() * 0.35).toFixed(2));
      dot.style.animationDuration = `${INK_DROP_MS}ms`;
      node.appendChild(dot);
      live++;
      window.setTimeout(() => {
        dot.remove();
        live = Math.max(0, live - 1);
      }, INK_DROP_MS);
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      nextX = e.clientX - rect.left;
      nextY = e.clientY - rect.top;
      const now = performance.now();
      if (now - last < MIN_INTERVAL_MS) return;
      last = now;
      if (!frame) frame = requestAnimationFrame(spawn);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      node.querySelectorAll(".cursor-ink").forEach((el) => el.remove());
    };
  }, [reduced]);

  return ref;
}
