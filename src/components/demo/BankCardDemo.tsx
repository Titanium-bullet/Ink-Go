import { memo } from "react";
import moquanCardBg from "../../assets/moquan-card-bg.jpg";

/**
 * 钱卡形制 demo（#hero-demo 三选一）：同一张「终身无尽文钱卡」的
 * 三种横向古代形制——甲 银票（纸）/ 乙 匾牌（木）/ 丙 玉牌（玉）。
 * 品牌内容（墨泉钱庄 / 终身无尽文钱 / 泉字第 ∞ 号）三形制同源，方便对比。
 */

export type BankCardVariant = "note" | "tablet" | "jade" | "landscape";

/* ---------------- 方案甲 · 墨泉银票（横幅宝钞，宣纸墨印） ---------------- */

const NoteCard = memo(function NoteCard({ p }: { p: string }) {
  return (
    <svg className="bank-card-demo" viewBox="0 0 640 380" role="img" aria-label="墨泉银票">
      <defs>
        <linearGradient id={`${p}paper`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2e6c2" />
          <stop offset="55%" stopColor="#e6d2a2" />
          <stop offset="100%" stopColor="#d8c088" />
        </linearGradient>
        <radialGradient id={`${p}aged`} cx="50%" cy="46%" r="72%">
          <stop offset="62%" stopColor="#8a6a3a" stopOpacity="0" />
          <stop offset="100%" stopColor="#8a6a3a" stopOpacity="0.26" />
        </radialGradient>
        <filter id={`${p}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="9" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.42  0 0 0 0 0.31  0 0 0 0 0.15  0.3 0 0 0 0"
          />
        </filter>
        <filter id={`${p}drop`} x="-12%" y="-12%" width="124%" height="130%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter={`url(#${p}drop)`}>
        <rect x="0" y="0" width="640" height="380" rx="8" fill={`url(#${p}paper)`} />
      </g>
      <rect x="0" y="0" width="640" height="380" rx="8" filter={`url(#${p}grain)`} opacity="0.42" style={{ mixBlendMode: "multiply" }} />
      <rect x="0" y="0" width="640" height="380" rx="8" fill={`url(#${p}aged)`} />

      {/* 双重框：粗墨线 + 细朱线 + 角印 */}
      <rect x="18" y="18" width="604" height="344" fill="none" stroke="#33240f" strokeWidth="5" />
      <rect x="32" y="32" width="576" height="316" fill="none" stroke="#7a1f1a" strokeWidth="1.6" />
      {[[32, 32], [592, 32], [32, 340], [592, 340]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 5} y={cy - 5} width="10" height="10" fill="#33240f" />
      ))}

      {/* 庄名 */}
      <text x="320" y="78" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="30" letterSpacing="12" fill="#2a1c10">
        墨泉钱庄
      </text>

      {/* 大字面额 */}
      <text x="320" y="196" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="58" fontWeight="600" letterSpacing="14" fill="#241708">
        终身无尽文钱
      </text>

      {/* 骑缝朱印（压在面额上） */}
      <g transform="translate(278 154) rotate(-5)" opacity="0.85">
        <rect width="84" height="84" rx="5" fill="#b23a28" />
        <rect x="6" y="6" width="72" height="72" rx="3" fill="none" stroke="#f2e6c2" strokeOpacity="0.85" strokeWidth="2.6" />
        <text x="42" y="44" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="28" fontWeight="600" fill="#f2e6c2">
          无尽
        </text>
      </g>

      {/* 左侧纵排防伪小字 */}
      <VerticalSmall x={62} y={150} chars="假票如律究治" fill="#5a4326" />

      {/* 凭票即付 + 票号 */}
      <rect x="120" y="252" width="400" height="1.4" fill="#33240f" opacity="0.55" />
      <text x="320" y="290" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="19" letterSpacing="6" fill="#3a2a14">
        凭票即付 · 泉字第 <tspan fill="#b23a28" fontSize="24">∞</tspan> 号
      </text>

      {/* 底部山河淡影 + 落款 */}
      <path d="M40 346 C160 328 260 340 380 326 C480 314 560 332 600 324 L600 348 L40 348 Z" fill="#5a4326" opacity="0.14" />
      <text x="320" y="340" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="13" letterSpacing="8" fill="#5a4326" opacity="0.6">
        墨泉钱庄 · 通济山河
      </text>
    </svg>
  );
});

/** 纵排小字（防伪语等） */
function VerticalSmall({
  x,
  y,
  chars,
  fill,
  size = 13,
}: {
  x: number;
  y: number;
  chars: string;
  fill: string;
  size?: number;
}) {
  return (
    <>
      {[...chars].map((ch, i) => (
        <text
          key={`${x}-${i}`}
          x={x}
          y={y + i * (size + 8)}
          textAnchor="middle"
          fontFamily="'Noto Serif SC','Songti SC',serif"
          fontSize={size}
          fill={fill}
        >
          {ch}
        </text>
      ))}
    </>
  );
}

/* ---------------- 方案乙 · 无尽匾牌（横木匾，铜字红穗） ---------------- */

const TabletCard = memo(function TabletCard({ p }: { p: string }) {
  return (
    <svg className="bank-card-demo" viewBox="0 0 640 380" role="img" aria-label="无尽匾牌">
      <defs>
        <linearGradient id={`${p}wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3420" />
          <stop offset="48%" stopColor="#3a2818" />
          <stop offset="100%" stopColor="#2a1c10" />
        </linearGradient>
        <linearGradient id={`${p}rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0c084" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#e0c084" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#e0c084" stopOpacity="0.3" />
        </linearGradient>
        <filter id={`${p}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.1" numOctaves="4" seed="6" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.02  0.4 0 0 0 0"
          />
        </filter>
        <filter id={`${p}drop`} x="-12%" y="-14%" width="124%" height="136%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* 挂绳：两角向上汇于顶结 */}
      <g stroke="#a03428" strokeWidth="3.5" fill="none">
        <line x1="104" y1="66" x2="320" y2="8" />
        <line x1="536" y1="66" x2="320" y2="8" />
      </g>
      <circle cx="320" cy="10" r="7" fill="#a03428" />

      {/* 木匾 */}
      <g filter={`url(#${p}drop)`}>
        <rect x="40" y="60" width="560" height="262" rx="14" fill={`url(#${p}wood)`} />
      </g>
      <rect x="40" y="60" width="560" height="262" rx="14" filter={`url(#${p}grain)`} opacity="0.55" style={{ mixBlendMode: "multiply" }} />
      <rect x="40" y="60" width="560" height="262" rx="14" fill="none" stroke="#1c1208" strokeWidth="3" />
      <rect x="54" y="74" width="532" height="234" rx="9" fill="none" stroke={`url(#${p}rim)`} strokeWidth="2" />

      {/* 铆钉 */}
      {[[68, 90], [572, 90], [68, 292], [572, 292]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5" fill="#e0c084" opacity="0.7" />
      ))}

      {/* 庄名 */}
      <text x="320" y="122" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="20" letterSpacing="9" fill="#e0c084">
        墨泉钱庄
      </text>

      {/* 主文（铜字錾刻） */}
      <text
        x="322" y="216"
        textAnchor="middle"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="64" fontWeight="600" letterSpacing="20"
        fill="rgba(0,0,0,0.55)"
      >
        终身无尽文钱
      </text>
      <text
        x="320" y="214"
        textAnchor="middle"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="64" fontWeight="600" letterSpacing="20"
        fill="#e0c084"
      >
        终身无尽文钱
      </text>

      {/* 票号 + 右下泉印 */}
      <text x="308" y="278" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="15" letterSpacing="4" fill="#e0c084" opacity="0.8">
        泉字第 <tspan fontSize="21">∞</tspan> 号
      </text>
      <g transform="translate(524 244) rotate(-4)">
        <rect width="42" height="42" rx="3.5" fill="#b23a28" />
        <rect x="4" y="4" width="34" height="34" rx="2" fill="none" stroke="#f2e6c2" strokeOpacity="0.85" strokeWidth="1.8" />
        <text x="21" y="22" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="16" fontWeight="600" fill="#f2e6c2">
          泉
        </text>
      </g>

      {/* 左下流苏 */}
      <g stroke="#a03428" strokeWidth="2.8" strokeLinecap="round">
        <line x1="88" y1="322" x2="76" y2="368" />
        <line x1="88" y1="322" x2="92" y2="372" />
        <line x1="88" y1="322" x2="106" y2="364" />
      </g>
      <circle cx="88" cy="320" r="5" fill="#a03428" />
    </svg>
  );
});

/* ---------------- 方案丙 · 无尽玉牌（横青玉，错金红缯） ---------------- */

const JadeCard = memo(function JadeCard({ p }: { p: string }) {
  return (
    <svg className="bank-card-demo" viewBox="0 0 640 380" role="img" aria-label="无尽玉牌">
      <defs>
        <linearGradient id={`${p}jade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6ecda" />
          <stop offset="45%" stopColor="#c4d4b8" />
          <stop offset="100%" stopColor="#9db596" />
        </linearGradient>
        <radialGradient id={`${p}jadeLight`} cx="30%" cy="20%" r="85%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${p}mottle`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="4" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.55  0 0 0 0 0.42  0.18 0 0 0 0"
          />
        </filter>
        <filter id={`${p}drop`} x="-12%" y="-14%" width="124%" height="136%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 玉牌 */}
      <g filter={`url(#${p}drop)`}>
        <rect x="30" y="88" width="580" height="204" rx="30" fill={`url(#${p}jade)`} />
      </g>
      <rect x="30" y="88" width="580" height="204" rx="30" fill={`url(#${p}jadeLight)`} />
      <rect x="30" y="88" width="580" height="204" rx="30" filter={`url(#${p}mottle)`} opacity="0.5" style={{ mixBlendMode: "multiply" }} />
      <rect x="30" y="88" width="580" height="204" rx="30" fill="none" stroke="#7d977a" strokeWidth="1.6" opacity="0.7" />
      <rect x="46" y="102" width="548" height="176" rx="22" fill="none" stroke="#7d977a" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* 两端云纹琢饰 */}
      <g fill="none" stroke="#f4f8ec" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round">
        <path d="M84 244 C84 220 112 220 112 238" />
        <path d="M556 136 C556 160 528 160 528 142" />
      </g>

      {/* 庄名 */}
      <text x="320" y="140" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="19" letterSpacing="9" fill="#8a6a28">
        墨泉钱庄
      </text>

      {/* 主文（错金） */}
      <text
        x="322" y="226"
        textAnchor="middle"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="60" fontWeight="600" letterSpacing="18"
        fill="#f4f8ec" opacity="0.55"
      >
        终身无尽文钱
      </text>
      <text
        x="320" y="224"
        textAnchor="middle"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="60" fontWeight="600" letterSpacing="18"
        fill="#a9822f"
      >
        终身无尽文钱
      </text>

      {/* 票号 */}
      <text x="320" y="270" textAnchor="middle" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="15" letterSpacing="4" fill="#6e8767">
        泉字第 <tspan fontSize="20" fill="#a9822f">∞</tspan> 号
      </text>

      {/* 无尽朱印（右端） */}
      <g transform="translate(540 156) rotate(-4)">
        <rect width="58" height="58" rx="5" fill="#b23a28" />
        <rect x="5" y="5" width="48" height="48" rx="3" fill="none" stroke="#f2e6c2" strokeOpacity="0.85" strokeWidth="2.2" />
        <text x="29" y="30" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="21" fontWeight="600" fill="#f2e6c2">
          无尽
        </text>
      </g>

      {/* 两端红缯缚带 */}
      <g fill="#a03428">
        <rect x="52" y="82" width="22" height="216" rx="6" />
        <rect x="566" y="82" width="22" height="216" rx="6" />
      </g>
      <g stroke="#7a1f1a" strokeWidth="2" opacity="0.7">
        <line x1="52" y1="130" x2="74" y2="130" />
        <line x1="52" y1="196" x2="74" y2="196" />
        <line x1="566" y1="130" x2="588" y2="130" />
        <line x1="566" y1="196" x2="588" y2="196" />
      </g>
    </svg>
  );
});

/* ---------------- 方案丁 · 山河卡（用户选定水墨山河实拍为卡面） ---------------- */

const LandscapeCard = memo(function LandscapeCard({ p }: { p: string }) {
  return (
    <svg className="bank-card-demo" viewBox="0 0 640 380" role="img" aria-label="山河卡">
      <defs>
        <linearGradient id={`${p}chip`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6dfa8" />
          <stop offset="55%" stopColor="#c39a55" />
          <stop offset="100%" stopColor="#9a7132" />
        </linearGradient>
        <linearGradient id={`${p}scrim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4efe4" stopOpacity="0.22" />
          <stop offset="40%" stopColor="#f4efe4" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0807" stopOpacity="0.34" />
        </linearGradient>
        <filter id={`${p}drop`} x="-12%" y="-12%" width="124%" height="130%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 卡面：水墨山河实拍 */}
      <g filter={`url(#${p}drop)`}>
        <rect x="0" y="0" width="640" height="380" rx="10" fill="#e9e2d0" />
        <image
          href={moquanCardBg}
          x="0" y="0" width="640" height="380"
          preserveAspectRatio="xMidYMid slice"
        />
        <rect x="0" y="0" width="640" height="380" rx="10" fill={`url(#${p}scrim)`} />
      </g>
      {/* 细墨内框 */}
      <rect x="10" y="10" width="620" height="360" rx="7" fill="none" stroke="#33240f" strokeOpacity="0.5" strokeWidth="1.4" />

      {/* 庄名 logo（左上） */}
      <g transform="translate(34 26)">
        <circle cx="20" cy="20" r="19" fill="#f0dcb2" fillOpacity="0.92" />
        <circle cx="20" cy="20" r="19" fill="none" stroke="#8a6528" strokeWidth="1.6" />
        <rect x="11.5" y="11.5" width="17" height="17" rx="2.5" fill="#2a1c10" />
        <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="12" fontWeight="600" fill="#f0d493">
          泉
        </text>
        <text x="50" y="18" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="21" letterSpacing="5" fill="#241708">
          墨泉钱庄
        </text>
        <text x="50" y="35" fontFamily="Georgia, serif" fontSize="8.5" letterSpacing="3.2" fill="#241708" opacity="0.55">
          MOQUAN BANK
        </text>
      </g>

      {/* 无尽朱印（右上） */}
      <g transform="translate(534 30) rotate(-4)">
        <rect width="70" height="70" rx="5" fill="#b23a28" opacity="0.92" />
        <rect x="5.5" y="5.5" width="59" height="59" rx="3" fill="none" stroke="#f2e6c2" strokeOpacity="0.85" strokeWidth="2.4" />
        <text x="35" y="36" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="23" fontWeight="600" fill="#f2e6c2">
          无尽
        </text>
      </g>

      <text
        x="46" y="214"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="52" fontWeight="600" letterSpacing="9"
        fill="#241708"
        stroke="#f4efe4" strokeWidth="7" strokeOpacity="0.55"
        paintOrder="stroke"
      >
        终身无尽文钱卡
      </text>

      {/* 芯片（左下） */}
      <g transform="translate(46 268)">
        <rect width="62" height="46" rx="8" fill={`url(#${p}chip)`} stroke="#8a6528" strokeWidth="1.5" />
        <g stroke="#8a6528" strokeWidth="1.1" opacity="0.75">
          <line x1="0" y1="15.3" x2="62" y2="15.3" />
          <line x1="0" y1="30.6" x2="62" y2="30.6" />
          <line x1="20.6" y1="0" x2="20.6" y2="46" />
          <line x1="41.3" y1="0" x2="41.3" y2="46" />
        </g>
        <rect x="24.8" y="17" width="12.4" height="12" rx="2.5" fill="none" stroke="#8a6528" strokeWidth="1.2" opacity="0.85" />
      </g>

      {/* 英文卡名（芯片下方） */}
      <text
        x="46" y="360"
        fontFamily="Georgia, serif"
        fontSize="14" letterSpacing="3"
        fill="#241708"
        stroke="#f4efe4" strokeWidth="4" strokeOpacity="0.5"
        paintOrder="stroke"
      >
        LIFETIME WEN
      </text>

      {/* 右下落款（松影上用浅字） */}
      <text x="606" y="348" textAnchor="end" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="12" letterSpacing="5" fill="#f4efe4" opacity="0.8">
        通济山河
      </text>
    </svg>
  );
});

export const BankCardDemo = memo(function BankCardDemo({
  variant,
  idPrefix,
}: {
  variant: BankCardVariant;
  idPrefix: string;
}) {
  return (
    <span className="bank-card-demo-svg">
      {variant === "note" && <NoteCard p={idPrefix} />}
      {variant === "tablet" && <TabletCard p={idPrefix} />}
      {variant === "jade" && <JadeCard p={idPrefix} />}
      {variant === "landscape" && <LandscapeCard p={idPrefix} />}
    </span>
  );
});
