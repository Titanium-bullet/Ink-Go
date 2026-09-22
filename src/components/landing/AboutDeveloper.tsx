import { usePauseOffscreen } from "../../hooks/useScrollParallax";
import { useReveal } from "../../hooks/useReveal";
import { useT } from "../../i18n/LanguageContext";
import { Reveal } from "./Reveal";

export function AboutDeveloper() {
  const t = useT();
  const [ref, visible] = useReveal<HTMLElement>();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  // 误拖选的邮箱文字会保持高亮（::selection 为亮白），鼠标移出区块时清掉，
  // 避免「点亮后移开不恢复」的观感；悬停期间选区保留可正常 ⌘C 复制。
  const clearSelection = () => {
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      /* ignore */
    }
  };
  return (
    <section
      id="about"
      ref={(node) => {
        ref.current = node;
        pauseRef.current = node;
      }}
      onMouseLeave={clearSelection}
      className={`cv-auto relative bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16${
        visible ? " is-visible" : ""
      }`}
    >
      <div className="relative mx-auto max-w-5xl">
        <Reveal variant="wipe">
          <p className="text-sm tracking-[0.5em] text-[#d8b36e]">
            {t.about.kicker}
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col items-start gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* 头像 + 名字 */}
          <Reveal variant="bloom" className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* 头像占位 —— 待定，换成 <img> 即可；静止零金色发光，悬停才点亮 */}
            <div
              className="about-ring flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #6a5648, #050403 72%)",
              }}
            >
              <span
                className="text-3xl font-light tracking-[0.12em] text-[#d8b36e]"
                style={{ fontFamily: '"Georgia","Cambria",serif' }}
              >
                TB
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.about.author}
              </h2>
              <p className="mt-3 text-2xl font-medium tracking-wide text-[#d8b36e] sm:text-3xl">
                {t.about.name}
              </p>
            </div>
          </Reveal>

          {/* 两个邮箱 —— 卡片式：金线上边 + 标签在上 + 地址整行不折行 */}
          <div className="grid gap-8 sm:grid-cols-2 lg:max-w-xl lg:gap-12">
            <Reveal variant="bloom" i={0} className="border-t border-[#d8b36e]/30 pt-4">
              <p className="text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email1Cap}
              </p>
              <a
                href="mailto:titanium_bullet@icloud.com"
                className="mt-2 block whitespace-nowrap text-base text-[#d8cfc0] transition hover:text-[#f4efe4] hover:underline"
              >
                titanium_bullet@icloud.com
              </a>
            </Reveal>
            <Reveal variant="bloom" i={1} className="border-t border-[#d8b36e]/30 pt-4">
              <p className="text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email2Cap}
              </p>
              <a
                href="mailto:ruihuachen@icloud.com"
                className="mt-2 block whitespace-nowrap text-base text-[#d8cfc0] transition hover:text-[#f4efe4] hover:underline"
              >
                ruihuachen@icloud.com
              </a>
            </Reveal>
          </div>
        </div>

        <p className="mt-16 text-xs tracking-[0.3em] text-[#695d51]">
          {t.about.foot}
        </p>
      </div>
    </section>
  );
}
