import moquanCardBg from "../../assets/moquan-card-bg.jpg";

/**
 * 墨泉钱庄品牌资产：logo（方孔铜钱 + 泉字 + 泉纹涟漪）与终身无尽文钱卡。
 * 品牌释义：「泉」为古之钱称谓；墨泉取「泉涌不匮」之意，文钱如泉，通济山河。
 */

const COIN_ID = "mqCoinGrad";
const GOLD_ID = "mqGoldGrad";
const SHEEN_ID = "mqSheen";
const LACQ_ID = "mqLacq";

function CoinDefs() {
  return (
    <defs>
      <radialGradient id={COIN_ID} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f6dfa8" />
        <stop offset="55%" stopColor="#c39a55" />
        <stop offset="100%" stopColor="#8a6528" />
      </radialGradient>
      <linearGradient id={GOLD_ID} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6dfa8" />
        <stop offset="55%" stopColor="#c39a55" />
        <stop offset="100%" stopColor="#e8c887" />
      </linearGradient>
      <linearGradient id={SHEEN_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0dcaa" stopOpacity="0.12" />
        <stop offset="38%" stopColor="#f0dcaa" stopOpacity="0" />
        <stop offset="68%" stopColor="#f0dcaa" stopOpacity="0" />
        <stop offset="100%" stopColor="#f0dcaa" stopOpacity="0.07" />
      </linearGradient>
      <linearGradient id={LACQ_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#241a10" />
        <stop offset="52%" stopColor="#151009" />
        <stop offset="100%" stopColor="#0b0705" />
      </linearGradient>
    </defs>
  );
}

/** 墨泉 logo：外圈泉纹涟漪 + 方孔铜钱 + 孔中「泉」字墨印 */
export function MoquanLogo({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="墨泉钱庄">
      <CoinDefs />
      {/* 泉纹涟漪 */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="#d8b36e" strokeOpacity="0.32" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="57.5" fill="none" stroke="#d8b36e" strokeOpacity="0.14" strokeWidth="1" />
      {/* 铜钱 */}
      <circle cx="60" cy="60" r="43" fill={`url(#${COIN_ID})`} />
      <circle cx="60" cy="60" r="43" fill="none" stroke="#5f4517" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="37" fill="none" stroke="#8a6528" strokeOpacity="0.55" strokeWidth="1" />
      {/* 方孔 + 墨底泉字 */}
      <rect x="42" y="42" width="36" height="36" rx="4" fill="#120d0a" />
      <rect x="42" y="42" width="36" height="36" rx="4" fill="none" stroke="#8a6528" strokeOpacity="0.6" strokeWidth="1.2" />
      <text
        x="60" y="61"
        textAnchor="middle" dominantBaseline="central"
        fontFamily="'Noto Serif SC','Songti SC',serif"
        fontSize="21" fontWeight="600" fill="#f0d493"
      >
        泉
      </text>
    </svg>
  );
}

/** 终身无尽文钱卡（水墨山河真图卡面，文案固定中文，不随语言切换） */
export function WenCard() {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label="终身无尽文钱卡">
      <CoinDefs />
      <defs>
        <clipPath id="mqCardClip">
          <rect x="0" y="0" width="640" height="400" rx="24" />
        </clipPath>
        <linearGradient id="mqScrimTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f1a14" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1f1a14" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mqTextZone" cx="26%" cy="72%" r="62%">
          <stop offset="0%" stopColor="#fbf7ec" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbf7ec" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mqChip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d493" />
          <stop offset="55%" stopColor="#c39a55" />
          <stop offset="100%" stopColor="#a9822f" />
        </linearGradient>
      </defs>

      {/* 水墨山河卡面 */}
      <g clipPath="url(#mqCardClip)">
        <image
          href={moquanCardBg}
          x="0" y="0" width="640" height="400"
          preserveAspectRatio="xMidYMid slice"
        />
        {/* 顶部压暗（庄名可读） + 名片区柔光（卡名可读） */}
        <rect x="0" y="0" width="640" height="150" fill="url(#mqScrimTop)" />
        <ellipse cx="185" cy="285" rx="290" ry="105" fill="url(#mqTextZone)" />

        {/* 内框 */}
        <rect x="12" y="12" width="616" height="376" rx="18" fill="none" stroke="#8a6528" strokeOpacity="0.5" strokeWidth="1.5" />

        {/* 庄名 + logo（山峦之上） */}
        <g transform="translate(44 40)">
          <circle cx="16" cy="16" r="16" fill={`url(#${COIN_ID})`} />
          <circle cx="16" cy="16" r="16" fill="none" stroke="#5f4517" strokeWidth="1" />
          <rect x="9" y="9" width="14" height="14" rx="2" fill="#120d0a" />
          <text x="16" y="17" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="9.5" fontWeight="600" fill="#f0d493">
            泉
          </text>
          <text
            x="42" y="15"
            fontFamily="'Noto Serif SC','Songti SC',serif"
            fontSize="19" letterSpacing="5" fill="#f2ead8"
            paintOrder="stroke" stroke="rgba(31,26,20,0.5)" strokeWidth="3"
          >
            墨泉钱庄
          </text>
          <text
            x="42" y="32"
            fontFamily="Georgia, serif" fontSize="8.5" letterSpacing="3.5"
            fill="rgba(242,234,216,0.72)"
            paintOrder="stroke" stroke="rgba(31,26,20,0.4)" strokeWidth="2.5"
          >
            MOQUAN BANK
          </text>
        </g>

        {/* 芯片 */}
        <g transform="translate(44 158)">
          <rect width="60" height="44" rx="7" fill="url(#mqChip)" stroke="#6e4f1c" strokeWidth="1.4" />
          <g stroke="#6e4f1c" strokeWidth="1.6" opacity="0.75" fill="none">
            <line x1="0" y1="15" x2="60" y2="15" />
            <line x1="0" y1="29" x2="60" y2="29" />
            <rect x="20" y="8" width="20" height="28" rx="4" />
            <line x1="20" y1="22" x2="40" y2="22" />
          </g>
        </g>

        {/* 卡名（湖面烟波之上，墨字） */}
        <text
          x="44" y="286"
          fontFamily="'Noto Serif SC','Songti SC',serif"
          fontSize="38" fontWeight="600" letterSpacing="6"
          fill="#241708"
        >
          终身无尽文钱卡
        </text>

        {/* 英文卡名 */}
        <text x="45" y="350" fontFamily="Georgia, serif" fontSize="15" letterSpacing="4" fill="#5a4326">
          LIFETIME WEN
        </text>
        <text
          x="596" y="366" textAnchor="end"
          fontFamily="'Noto Serif SC','Songti SC',serif"
          fontSize="12" letterSpacing="5" fill="#f2ead8"
          paintOrder="stroke" stroke="rgba(31,26,20,0.5)" strokeWidth="2.5"
        >
          通济山河
        </text>

        {/* 无尽朱印（右上米色天空处） */}
        <g transform="translate(528 40) rotate(-4)">
          <rect width="64" height="64" rx="6" fill="#b23a28" />
          <rect x="5" y="5" width="54" height="54" rx="3.5" fill="none" stroke="#f2e6c2" strokeOpacity="0.85" strokeWidth="2.2" />
          <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC','Songti SC',serif" fontSize="21" fontWeight="600" fill="#f2e6c2">
            无尽
          </text>
        </g>
      </g>
    </svg>
  );
}
