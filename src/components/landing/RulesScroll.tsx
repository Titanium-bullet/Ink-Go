import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../i18n/LanguageContext";

/**
 * 「阅读围棋规则」按钮 + 发黄古纸弹层：本作围棋规则七条，
 * 中英文皆以草书（行楷 / 手写体）书写在陈年宣纸上。
 * - Esc / 点击遮罩 / 合卷按钮均可关闭
 * - 纸张纯 CSS 渐变做旧（陈旧晕、角落霉斑、毛边阴影），无重滤镜
 * - 弹层经 portal 挂到 body：本组件嵌在 sticky + reveal 动画容器内，
 *   那些祖先自带层叠上下文，会把 fixed 弹层的 z-index 圈在里面被右栏卡片盖住
 */
export function RulesScroll() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="rules-scroll-btn"
        onClick={() => setOpen(true)}
      >
        {t.rules.scrollBtn}
      </button>

      {open &&
        createPortal(
          <div
            className="rules-scroll-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={t.rules.scrollTitle}
            onClick={() => setOpen(false)}
          >
            <div
              className="rules-scroll-paper"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="rules-scroll-close brush-hand"
                onClick={() => setOpen(false)}
              >
                {t.rules.scrollClose}
              </button>

              <h3 className="rules-scroll-title brush-hand">{t.rules.scrollTitle}</h3>

              <ol className="rules-scroll-list brush-hand">
                {t.rules.scrollItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>

              <div className="rules-scroll-foot">
                <span className="brush-hand rules-scroll-footText">{t.rules.scrollFoot}</span>
                <span className="seal rules-scroll-seal brush-hand">弈</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
