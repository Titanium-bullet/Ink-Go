import { useT } from "../../i18n/LanguageContext";

/** 关于作者：纯静态区块——无入场动画、无悬停发光、无任何渲染效果 */
export function AboutDeveloper() {
  const t = useT();
  return (
    <section
      id="about"
      className="bg-[#17120f] px-6 py-24 text-[#f4efe4] sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm tracking-[0.5em] text-[#d8b36e]">{t.about.kicker}</p>

        <div className="mt-10 flex flex-col items-start gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* 左：头像 + 署名 */}
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
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
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.about.author}
              </h2>
              <p className="about-name mt-2 text-2xl font-medium tracking-wide text-[#d8b36e] sm:text-3xl">
                {t.about.name}
              </p>
            </div>
          </div>

          {/* 右：邮箱 */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:w-auto lg:max-w-xl lg:gap-12">
            <div className="border-t border-[#d8b36e]/30 pt-4">
              <p className="whitespace-nowrap text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email1Cap}
              </p>
              <a
                href="mailto:titanium_bullet@icloud.com"
                className="mt-2 block whitespace-nowrap text-sm text-[#d8cfc0] hover:text-[#f4efe4] hover:underline sm:text-base"
              >
                titanium_bullet@icloud.com
              </a>
            </div>
            <div className="border-t border-[#d8b36e]/30 pt-4">
              <p className="whitespace-nowrap text-xs tracking-[0.24em] text-[#d8b36e]">
                {t.about.email2Cap}
              </p>
              <a
                href="mailto:ruihuachen@icloud.com"
                className="mt-2 block whitespace-nowrap text-sm text-[#d8cfc0] hover:text-[#f4efe4] hover:underline sm:text-base"
              >
                ruihuachen@icloud.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center">
          <p className="text-xs tracking-[0.4em] text-[#8a7a66]">
            {t.about.foot} · © Ruihua Chen 2026
          </p>
        </div>
      </div>
    </section>
  );
}
