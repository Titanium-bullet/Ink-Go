/**
 * 墨阁专属山河背景——致敬 demo 甲案「云海山河」：
 * 晨光天色 + 日轮 + 三层山峦 + 流云雾带（静态为主，仅云雾缓漂）。
 */
export function ShopBackdrop() {
  return (
    <div className="shop-backdrop" aria-hidden="true">
      <div className="shop-sky" />

      <div className="shop-clouds">
        <span />
        <span />
        <span />
      </div>

      <svg className="shop-mountains" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <path
          d="M-100 640 C180 500 340 560 560 470 C780 380 900 540 1120 430 C1300 340 1440 480 1710 380 L1710 940 L-100 940 Z"
          fill="#2a2018"
          opacity="0.9"
        />
        <path
          d="M-100 720 C160 610 300 650 520 560 C740 470 860 620 1080 520 C1280 430 1420 560 1710 470 L1710 940 L-100 940 Z"
          fill="#1d1611"
          opacity="0.96"
        />
        <path
          d="M-100 810 C240 730 420 760 660 690 C900 620 1060 740 1300 660 C1480 600 1600 680 1710 630 L1710 940 L-100 940 Z"
          fill="#120d0a"
        />
      </svg>

      <div className="shop-mist" />
      {/* 可读性暗化层：上深下浅，保住前景文字与卡片对比 */}
      <div className="shop-scrim" />
    </div>
  );
}
