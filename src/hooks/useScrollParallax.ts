import { useEffect, useRef } from "react";

/**
 * 滚动视差驱动器：模块级单例，整页只挂一个 passive scroll 监听 + 一个 rAF。
 * 每个被注册的节点在滚动时拿到自己的进度，写进 CSS 变量 `--sy`（范围约 [-1, 1]，
 * 0 表示节点中心正对视口中心，负值在下方/尚未滚到，正值在上方/已经滚过）。
 *
 * CSS 侧用 `.px-slow/-mid/-fast` 把 `--sy` 翻译成不同幅度的 translateY，
 * 与既有鼠标视差（`--mx/--my`）双驱动，互不冲突。
 *
 * reduced-motion 下注册为 no-op，`--sy` 恒为 0。
 */
type NodeEntry = { node: HTMLElement; strength: number };
let registry: NodeEntry[] = [];
let listeners = 0;
let frame = 0;

function pump() {
  frame = 0;
  const vh = window.innerHeight || 1;
  const half = vh / 2;
  for (const { node, strength } of registry) {
    const rect = node.getBoundingClientRect();
    // 节点完全在视口外则跳过，省去写样式
    if (rect.bottom < -200 || rect.top > vh + 200) continue;
    const center = rect.top + rect.height / 2;
    const denom = half + rect.height / 2 || 1;
    let sy = (half - center) / denom;
    if (sy > 1) sy = 1;
    else if (sy < -1) sy = -1;
    node.style.setProperty("--sy", (sy * strength).toFixed(4));
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(pump);
}

function bind() {
  if (listeners === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
  }
  listeners += 1;
}

function unbind() {
  listeners -= 1;
  if (listeners === 0) {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
}

export function useScrollParallax<T extends HTMLElement = HTMLDivElement>(
  strength = 1,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const entry: NodeEntry = { node, strength };
    registry.push(entry);
    bind();

    return () => {
      registry = registry.filter((e) => e !== entry);
      unbind();
    };
  }, [strength]);

  return ref;
}

/**
 * 节点离开视口时给它打上 `is-offscreen` 类，供 CSS 把内部无限动画
 * `animation-play-state: paused`（见 .is-offscreen 规则），省电省 GPU。
 * 进视口即移除该类。
 */
export function usePauseOffscreen<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "100px 0px",
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          node.classList.toggle("is-offscreen", !entry.isIntersecting);
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
