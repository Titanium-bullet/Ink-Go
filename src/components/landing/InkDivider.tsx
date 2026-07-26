import { useReveal } from "../../hooks/useReveal";

/**
 * 水墨笔触分隔线：滚入视口时自绘，并在收笔后荡开一圈淡墨涟漪。
 */
export function InkDivider({ className = "" }: { className?: string }) {
  const [ref, visible] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`ink-divider${visible ? " is-drawn" : ""} ${className}`}
      aria-hidden="true"
    >
      <span className="ink-divider-ripple" />
      <svg viewBox="0 0 1200 24" preserveAspectRatio="none">
        <path
          className={visible ? "is-drawn" : ""}
          d="M10 14 C 180 4, 360 22, 540 10 S 900 20, 1190 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
