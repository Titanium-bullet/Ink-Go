import { useEffect, useRef } from "react";

/**
 * Hero 三层视差：滚动 + 鼠标合并为「每层一次 style.transform 直写」。
 *
 * 为什么不用 CSS 变量方案：--sy/--mx/--my 写在 section 根上时，自定义属性
 * 变化会让整棵子树进入样式重算（Blink 无法证明后代没用它），配合 .px-* 的
 * 420-650ms transition 逐帧 retarget，滚动全程都在烧主线程。这里改为：
 *   - 只写 3 个包裹层自己的 style.transform（失效范围 = 元素自身）
 *   - 不用 transition，平滑由 rAF 内 lerp 提供（事件驱动，静止即停帧）
 */
const LAYER_FACTORS = [
  { mx: -8, my: -5, sy: 22 }, // back
  { mx: 14, my: 9, sy: -42 }, // mid
  { mx: 26, my: 16, sy: -72 }, // front
] as const;

export function useHeroParallax() {
  const back = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = [back.current, mid.current, front.current];
    if (nodes.some((n) => !n)) return;
    const els = nodes as HTMLDivElement[];

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let targetSy = 0;
    let curX = 0;
    let curY = 0;
    let curSy = 0;

    const measure = () => {
      // 以 back 层（铺满 hero）的几何代表整个 hero 的滚动进度
      const rect = els[0].getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const half = vh / 2;
      const center = rect.top + rect.height / 2;
      const denom = half + rect.height / 2 || 1;
      let sy = (half - center) / denom;
      if (sy > 1) sy = 1;
      else if (sy < -1) sy = -1;
      targetSy = sy;
    };

    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    };

    const onScroll = () => {
      measure();
      schedule();
    };

    const tick = () => {
      curX += (targetX - curX) * 0.09;
      curY += (targetY - curY) * 0.09;
      curSy += (targetSy - curSy) * 0.16;
      for (let i = 0; i < els.length; i++) {
        const k = LAYER_FACTORS[i];
        els[i].style.transform = `translate3d(${(k.mx * curX).toFixed(2)}px, ${(
          k.my * curY +
          k.sy * curSy
        ).toFixed(2)}px, 0)`;
      }
      const settled =
        Math.abs(targetX - curX) < 0.002 &&
        Math.abs(targetY - curY) < 0.002 &&
        Math.abs(targetSy - curSy) < 0.002;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    measure();
    if (!coarse) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    schedule();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { back, mid, front };
}
