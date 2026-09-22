import { useRef, useState } from "react";
import { useHeroParallax } from "../../hooks/useHeroParallax";
import { usePauseOffscreen } from "../../hooks/useScrollParallax";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { StyleBoard } from "../demo/StyleBoard";
import { BankCardDemo } from "../demo/BankCardDemo";

/**
 * Hero 方案对比 demo（hash 路由 #hero-demo）。
 * 两案均按「优先流畅」实现：只用 transform/opacity、一次性 stroke、
 * 无逐帧滤镜；无限动画都挂在独立 HTML/SVG 整体元素上（合成器友好）。
 * 重播按钮通过 remount 重新触发一次性动画。
 */
export function HeroDemo() {
  const [replayA, setReplayA] = useState(0);
  const [replayB, setReplayB] = useState(0);
  const sbRef = useRef<HTMLDivElement>(null);
  const bkRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);

  const goto = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="hd-page">
      <header className="hd-nav">
        <p className="hd-nav-brand">Hero 方案对比</p>
        <div className="hd-nav-actions">
          <button type="button" onClick={() => goto(sbRef.current)}>棋盘质感 · 三选一</button>
          <button type="button" onClick={() => goto(bkRef.current)}>钱卡形制 · 三选一</button>
          <button type="button" onClick={() => goto(aRef.current)}>甲案 · 云海山河</button>
          <button type="button" onClick={() => goto(bRef.current)}>乙案 · 水墨动势</button>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}>返回落地页</a>
        </div>
      </header>

      <div ref={sbRef}>
        <section className="sb-demos">
          <div className="sb-demos-head">
            <p className="sb-kicker">GOBAN MATERIAL · 棋盘质感</p>
            <h2 className="sb-title">棋盘质感 · 三选一</h2>
            <p className="sb-lede">
              同一局面、同一几何，仅材质不同。选定后全站棋盘——首页预览、五子棋 DLC 预览、
              游戏内对弈盘——统一换用该质感，赢线也随之换新画法。
            </p>
          </div>
          <div className="sb-list">
            <div className="sb-card">
              <StyleBoard variant="wood" idPrefix="sbA" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案甲</strong>写实木纹</p>
                <p className="sb-card-desc">
                  暖榧木盘面 + 直纹木理 + 厚盘侧沿与倒角，深色背景里的天然视觉焦点，
                  与金色点缀同一色温。
                </p>
              </div>
            </div>
            <div className="sb-card">
              <StyleBoard variant="paper" idPrefix="sbB" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案乙</strong>宣纸水墨</p>
                <p className="sb-card-desc">
                  精修宣纸 + 纤维纹理 + 墨晕边缘，缀一枚朱印；文人素雅，
                  与游戏内棋盘底座同一血统。
                </p>
              </div>
            </div>
            <div className="sb-card">
              <StyleBoard variant="lacquer" idPrefix="sbC" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案丙</strong>玄漆鎏金</p>
                <p className="sb-card-desc">
                  黑漆盘面 + 鎏金网格与包边，黑子描金边保证可读；
                  戏剧感最强，与暗色段落融为一体。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div ref={bkRef}>
        <section className="sb-demos">
          <div className="sb-demos-head">
            <p className="sb-kicker">BANK CARD · 钱卡形制</p>
            <h2 className="sb-title">钱卡形制 · 三选一</h2>
            <p className="sb-lede">
              古代钱庄没有塑料卡。同一张「终身无尽文钱卡」，四种形制——
              银票、匾牌、玉牌，以及你定的山河卡。选定后替换墨阁钱庄专区里的那张。
            </p>
          </div>
          <div className="sb-list">
            <div className="sb-card">
              <BankCardDemo variant="note" idPrefix="bcA" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案甲</strong>墨泉银票</p>
                <p className="sb-card-desc">
                  横幅宝钞：宣纸墨印、朱红「无尽」骑缝宝印、凭票即付——
                  最像「钱」本尊的形制，纸纹与岁月泛黄都在。
                </p>
              </div>
            </div>
            <div className="sb-card">
              <BankCardDemo variant="tablet" idPrefix="bcB" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案乙</strong>无尽匾牌</p>
                <p className="sb-card-desc">
                  悬于钱庄正堂的木匾：铜字錾刻「终身无尽文钱」，
                  红穗与铆钉都是旧的。
                </p>
              </div>
            </div>
            <div className="sb-card">
              <BankCardDemo variant="jade" idPrefix="bcC" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案丙</strong>无尽玉牌</p>
                <p className="sb-card-desc">
                  青玉错金、两端缚红缯——传家之器；
                  玉色最亮，深色界面里对比最好。
                </p>
              </div>
            </div>
            <div className="sb-card">
              <BankCardDemo variant="landscape" idPrefix="bcD" />
              <div className="sb-card-cap">
                <p className="sb-card-name"><strong>方案丁</strong>山河卡</p>
                <p className="sb-card-desc">
                  你选的水墨山河实拍做卡面：船、松、远山都在，
                  墨字卡名 + 鎏金芯片 + 墨泉 logo 浮于其上。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div ref={aRef}>
        <SchemeA key={replayA} onReplay={() => setReplayA((k) => k + 1)} />
      </div>
      <div ref={bRef}>
        <SchemeB key={replayB} onReplay={() => setReplayB((k) => k + 1)} />
      </div>
    </main>
  );
}

/* ---------------- 甲案 · 云海山河 ---------------- */

function SchemeA({ onReplay }: { onReplay: () => void }) {
  const pauseRef = usePauseOffscreen<HTMLElement>();
  const { back, mid, front } = useHeroParallax();
  const reduced = usePrefersReducedMotion();

  return (
    <section
      ref={(node) => {
        pauseRef.current = node;
      }}
      className="hd-stage hd-a"
    >
      <div className="hd-sky" />
      {!reduced && <div className="hd-rays" />}
      <div className="hd-sun" />
      <div className="hd-moon" />

      <div ref={back} className="hd-layer">
        <svg className="hd-layer-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
          <path d="M-100 640 C180 500 340 560 560 470 C780 380 900 540 1120 430 C1300 340 1440 480 1710 380 L1710 940 L-100 940 Z" fill="#1b2436" opacity="0.9" />
        </svg>
      </div>

      <div className="hd-clouds hd-clouds-high">
        <span style={{ animationDuration: "34s" }} />
        <span style={{ animationDuration: "46s", animationDelay: "-12s" }} />
        <span style={{ animationDuration: "40s", animationDelay: "-22s" }} />
      </div>

      <div ref={mid} className="hd-layer">
        <svg className="hd-layer-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
          <path d="M-100 720 C160 610 300 650 520 560 C740 470 860 620 1080 520 C1280 430 1420 560 1710 470 L1710 940 L-100 940 Z" fill="#131a29" opacity="0.94" />
        </svg>
      </div>

      <div className="hd-clouds hd-clouds-mid">
        <span style={{ animationDuration: "28s", animationDelay: "-6s" }} />
        <span style={{ animationDuration: "38s", animationDelay: "-18s" }} />
      </div>

      <div ref={front} className="hd-layer">
        <svg className="hd-layer-svg hd-cranes-demo" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
          <path d="M-100 810 C240 730 420 760 660 690 C900 620 1060 740 1300 660 C1480 600 1600 680 1710 630 L1710 940 L-100 940 Z" fill="#0b0f1a" />
          <g className="hd-crane-flock" fill="none" stroke="#f4efe4" strokeLinecap="round" strokeWidth="4" opacity="0.7">
            <path d="M300 260 C318 246 336 246 354 260 M354 260 C370 248 388 247 404 258" />
            <path d="M980 380 C998 366 1016 366 1034 380 M1034 380 C1050 368 1068 367 1084 378" />
          </g>
        </svg>
      </div>

      <div className="hd-mist-band" />

      <div className="hd-caption">
        <p className="hd-kicker">甲案 · PLAN A</p>
        <h2 className="hd-title">云海山河</h2>
        <p className="hd-sub">晨光穿云 · 层峦叠嶂 · 鹤影掠过（鼠标/滚动有视差）</p>
        <button type="button" className="hd-replay" onClick={onReplay}>重播入场</button>
      </div>
    </section>
  );
}

/* ---------------- 乙案 · 水墨动势 ---------------- */

const INK_BLOWS = [
  { left: "16%", top: "24%", size: 260, delay: "0.15s", dur: "1.6s" },
  { left: "68%", top: "58%", size: 320, delay: "0.45s", dur: "1.9s" },
  { left: "44%", top: "12%", size: 150, delay: "0.7s", dur: "1.3s" },
  { left: "80%", top: "20%", size: 120, delay: "0.95s", dur: "1.2s" },
];

function SchemeB({ onReplay }: { onReplay: () => void }) {
  const pauseRef = usePauseOffscreen<HTMLElement>();
  const reduced = usePrefersReducedMotion();

  return (
    <section
      ref={(node) => {
        pauseRef.current = node;
      }}
      className="hd-stage hd-b"
    >
      <div className="hd-paper" />

      {/* 墨滴晕染入纸（一次性） */}
      {INK_BLOWS.map((b, i) => (
        <span
          key={i}
          className="hd-blot"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        />
      ))}

      {/* 浮动墨绦（整只 SVG 缓漂） */}
      {!reduced && (
        <svg className="hd-wisps" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
          <path d="M120 200 C320 140 520 260 760 190 C980 126 1180 220 1420 160" fill="none" stroke="#201916" strokeWidth="10" strokeLinecap="round" opacity="0.05" />
          <path d="M180 700 C420 640 560 760 860 690 C1080 640 1260 720 1500 670" fill="none" stroke="#201916" strokeWidth="7" strokeLinecap="round" opacity="0.06" />
          <path d="M700 420 C900 380 1080 460 1300 400" fill="none" stroke="#896b41" strokeWidth="5" strokeLinecap="round" opacity="0.1" />
        </svg>
      )}

      {/* 飞白墨点（一次性洒落） */}
      <span className="hd-flick" style={{ left: "22%", top: "62%", animationDelay: "1.1s" }} />
      <span className="hd-flick" style={{ left: "58%", top: "30%", animationDelay: "1.25s" }} />
      <span className="hd-flick" style={{ left: "74%", top: "70%", animationDelay: "1.4s" }} />

      <div className="hd-caption hd-caption-ink">
        <p className="hd-kicker hd-kicker-ink">乙案 · PLAN B</p>
        <h2 className="hd-title-ink">
          <span style={{ animationDelay: "0.1s" }}>墨</span>
          <span style={{ animationDelay: "0.28s" }}>境</span>
          <span className="hd-title-gap" />
          <span style={{ animationDelay: "0.46s" }}>山</span>
          <span style={{ animationDelay: "0.64s" }}>河</span>
          <span style={{ animationDelay: "0.82s" }}>弈</span>
        </h2>
        <svg className="hd-brush-line" viewBox="0 0 520 26" preserveAspectRatio="none">
          <path d="M6 16 C120 6 240 20 360 12 C430 7 480 14 514 10" fill="none" stroke="#201916" strokeWidth="7" strokeLinecap="round" />
        </svg>
        <p className="hd-sub hd-sub-ink">笔落成字 · 墨滴晕纸 · 飞白洒落（逐字入纸）</p>
        <button type="button" className="hd-replay hd-replay-ink" onClick={onReplay}>重播入场</button>
      </div>
    </section>
  );
}
