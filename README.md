# 墨境 · 山河弈 / Ink Realm · Mountain & River Go

> 在水墨山河中重写每一口气。一款严格遵循传统围棋规则、却让天象、墨气与棋形流动改变对弈体验的策略游戏。
>
> A strategy game built on strict classical Go rules, where the heavens, ink-qi, and flowing shapes transform the way a game is played.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-2a1c0c.svg)](LICENSE)

---

## 中文

一款以**水墨国风**为视觉语言的网页围棋 / 五子棋作品。围棋规则严格遵循传统(气、提子、打劫、征子、终局数子),在此之上叠加了一套"把规则翻译成水墨意象"的可视化层——**不改变胜负,只放大感知**。

### 特性

- **传统围棋骨架** — 气、提子、打劫、自杀手禁则、终局面子规则数子,一应俱全。
- **GnuGo AI 对弈** — 内嵌 [GNU Go](https://www.gnu.org/software/gnugo/) 的 WebAssembly 编译产物,完全离线,无需服务端。
- **墨兽可视化** — 厚势凝为「玄龟」,气紧化作「游鱼」,棋形被翻译成活的水墨意象。
- **四时天象** — 晨、午、暮、夜,光影与气息随天象流转,改变对弈的呼吸节奏。
- **电影级结算** — 提子爆墨、劫争裂隙、印章盖印、墨线成字。
- **官方五子棋 DLC** — 同一片山河下的自由连珠,五子连成一笔书法。
- **中英双语** — 完整 i18n,文化语境下推荐中文。
- **单文件部署** — Vite singlefile 构建,一个 `index.html` 即可部署到任意静态托管(如 GitHub Pages)。

### 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 本地开发 (http://localhost:5173)
npm run build        # 生产构建 → dist/index.html
npm run preview      # 预览生产构建
npm test             # 引擎自测 (围棋规则 + SGF 序列化 + WASM 原型)
npm run typecheck    # TypeScript 严格类型检查
```

> 环境要求:Node.js 18+,npm 9+。

### 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript 5.9 (strict) |
| 构建 | Vite 7 + vite-plugin-singlefile |
| 样式 | Tailwind CSS 4 + 手写 CSS (SVG/SMIL 动画) |
| AI | GNU Go(WASM,base64 内联)|
| 渲染 | 纯 SVG 棋盘 / 棋子 / 墨兽,无 Canvas |

### 项目结构

```
src/
├── go/          围棋引擎(纯函数,可独立测试)
├── gomoku/      五子棋引擎
├── ai/          GnuGo WASM 适配层 + Web Worker 封装
├── hooks/       自定义 hooks(useGoGame / useSound / ...)
├── components/  game/ · gomoku/ · landing/ 组件
├── i18n/        zh.ts / en.ts 双语字典
└── App.tsx      视图路由
scripts/         引擎自测 + GnuGo WASM 生成脚本
```

### 部署到 GitHub Pages

```bash
npm run build
# 把 dist/index.html 推到 gh-pages 分支,或用 GitHub Actions 自动部署
```

由于采用 singlefile 构建,只需托管单个 `index.html` 即可。

### 致谢

- **[GNU Go](https://www.gnu.org/software/gnugo/)** — 自由软件基金会的围棋 AI,本项目使用其 WASM 编译产物(GPL-3.0)。
- **STKaiti / 楷书字体** — 印章与标题书法呈现。

### License

[GPL-3.0](LICENSE)(因链接 GNU Go,整体采用 GPL)

---

## English

A web-based Go / Gomoku game whose visual language is **Chinese ink-wash painting**. The Go ruleset follows classical tradition faithfully (liberties, captures, ko, ladders, area scoring); layered on top is a visualization system that *translates the rules into ink imagery* — **never altering the outcome, only amplifying perception**.

### Features

- **Classical Go, intact** — liberties, captures, ko, suicide prohibition, area scoring — all here.
- **GnuGo AI** — ships an inline [GNU Go](https://www.gnu.org/software/gnugo/) WebAssembly build; fully offline, no server required.
- **Ink beasts** — great influence gathers into a "Mystic Tortoise"; a liberty shortage becomes a "Darting Fish"; every shape becomes living ink.
- **Four phases of sky** — dawn, noon, dusk, night shift light and breath across the board.
- **Cinematic verdicts** — capture bursts, ko rifts, vermilion seal stamps, ink-brush win lines.
- **Official Gomoku DLC** — freestyle five-in-a-row on the same painted landscape.
- **Bilingual (zh / en)** — full i18n; Chinese recommended for the cultural context.
- **Single-file deploy** — Vite singlefile build; one `index.html` deploys to any static host (e.g. GitHub Pages).

### Quick Start

```bash
npm install          # install deps
npm run dev          # dev server (http://localhost:5173)
npm run build        # production build → dist/index.html
npm run preview      # preview the build
npm test             # engine selftest (Go rules + SGF + WASM smoke)
npm run typecheck    # strict TypeScript check
```

> Requires Node.js 18+, npm 9+.

### Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 + TypeScript 5.9 (strict) |
| Build | Vite 7 + vite-plugin-singlefile |
| Styling | Tailwind CSS 4 + hand-written CSS (SVG/SMIL animation) |
| AI | GNU Go (WASM, base64-inlined) |
| Rendering | Pure SVG board / stones / ink beasts, no Canvas |

### Project Structure

```
src/
├── go/          Go engine (pure functions, independently testable)
├── gomoku/      Gomoku engine
├── ai/          GnuGo WASM adapter + Web Worker wrapper
├── hooks/       custom hooks
├── components/  game/ · gomoku/ · landing/
├── i18n/        zh.ts / en.ts dictionaries
└── App.tsx      view routing
scripts/         engine selftest + GnuGo WASM generation
```

### Deploy to GitHub Pages

```bash
npm run build
# push dist/index.html to a gh-pages branch, or automate via GitHub Actions
```

Thanks to singlefile bundling, you host a single `index.html`.

### Credits

- **[GNU Go](https://www.gnu.org/software/gnugo/)** — the Free Software Foundation's Go AI; this project uses its WASM build (GPL-3.0).
- **STKaiti** — calligraphy typeface for seals and titles.

### License

[GPL-3.0](LICENSE) (inherited from GNU Go linkage)
