/**
 * 站点图标方案库（SVG data-URI，保持 singlefile 零额外请求）。
 * DemoPanel 内的选择器点击即试用（直接改 <link rel=icon>），
 * 选定后把对应方案的 <link> 固化进 index.html 即为默认。
 */

export interface FaviconDef {
  id: string;
  /** i18n 键名后缀 */
  nameKey: "pair" | "tengen" | "seal" | "scape" | "drop";
  svg: string;
}

/** 64×64 视口，配色取站内 墨/纸/金/朱 token */
export const FAVICONS: FaviconDef[] = [
  {
    id: "pair",
    nameKey: "pair",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<radialGradient id="w" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#ffffff"/><stop offset="70%" stop-color="#e7dcc4"/><stop offset="100%" stop-color="#b8a784"/></radialGradient>
<radialGradient id="b" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#6a5a4c"/><stop offset="55%" stop-color="#1a130e"/><stop offset="100%" stop-color="#040302"/></radialGradient>
</defs>
<circle cx="26" cy="39" r="17" fill="url(#w)"/>
<circle cx="39" cy="25" r="17" fill="url(#b)"/>
</svg>`,
  },
  {
    id: "tengen",
    nameKey: "tengen",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="#e8dcc0"/>
<path d="M32 8V56M8 32H56" stroke="#3a230e" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
<circle cx="32" cy="32" r="10" fill="#17110d"/>
<circle cx="28.5" cy="28.5" r="3" fill="#4a3a2c" opacity="0.8"/>
</svg>`,
  },
  {
    id: "seal",
    nameKey: "seal",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect x="3" y="3" width="58" height="58" rx="10" fill="#b9382a"/>
<rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="#8f2318" stroke-width="3"/>
<text x="32" y="45" font-size="36" text-anchor="middle" fill="#f7e8d8" font-family="'STXingkai','Xingkai SC','KaiTi','Ma Shan Zheng',serif">弈</text>
</svg>`,
  },
  {
    id: "scape",
    nameKey: "scape",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2b2320"/><stop offset="100%" stop-color="#17120f"/></linearGradient></defs>
<rect width="64" height="64" rx="12" fill="url(#sky)"/>
<circle cx="45" cy="17" r="7" fill="#d8b36e"/>
<path d="M0 46 C13 33 24 44 36 35 C46 28 56 38 64 31 V64 H0 Z" fill="#3d352c"/>
<path d="M0 57 C15 47 30 55 44 48 C53 44 59 49 64 46 V64 H0 Z" fill="#0c0908"/>
</svg>`,
  },
  {
    id: "drop",
    nameKey: "drop",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="#efe5d3"/>
<path d="M32 12 C38 24 44 30 44 38 A12 12 0 0 1 20 38 C20 30 26 24 32 12 Z" fill="#17110d"/>
<path d="M27 34 A9 9 0 0 0 32 44" stroke="#f4efe4" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<circle cx="32" cy="38" r="17" fill="none" stroke="#3a230e" stroke-width="1.6" opacity="0.35"/>
</svg>`,
  },
];

export function faviconDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 把方案应用为当前页 favicon（DemoPanel 选择器即时试用） */
export function applyFavicon(svg: string): void {
  const href = faviconDataUri(svg);
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
}
