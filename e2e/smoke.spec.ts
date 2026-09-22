import { expect, test, type Page } from "@playwright/test";

// 预置关闭两条首访提示（语言切换建议 / 今日文钱），避免遮挡导航。
// 文钱提示的键是「当天日期」，须在页面脚本运行前动态写入。
test.beforeEach(({ page }) => {
  page.addInitScript(() => {
    localStorage.setItem("inkgo-lang-hint-dismissed", "1");
    localStorage.setItem("inkgo-daily-hint-day", new Date().toISOString().slice(0, 10));
  });
});

/** 滚到锚点（html 是 smooth 滚动，等一等） */
async function gotoHash(page: Page, hash: string) {
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
  await page.waitForTimeout(900);
}

test.describe("落地页冒烟", () => {
  test("中文首页：标题与精简导航", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/墨境/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("墨境");
    const nav = page.locator("section#top nav");
    await expect(nav.getByRole("link", { name: "连珠" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "对弈" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "商城" })).toBeVisible();
    // 精简后不应再有 规则/特效/天象 链接
    await expect(nav.getByRole("link", { name: "规则" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "特效" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "天象" })).toHaveCount(0);
  });

  test("规则古纸卷：打开七条、合卷关闭", async ({ page }) => {
    await page.goto("/");
    await gotoHash(page, "#rules");
    await page.getByRole("button", { name: "阅读围棋规则" }).click();
    await expect(page.getByRole("dialog")).toContainText("墨境弈例");
    await expect(page.locator(".rules-scroll-list li")).toHaveCount(7);
    await page.getByRole("button", { name: "合卷" }).click();
    await expect(page.locator(".rules-scroll-paper")).toHaveCount(0);
  });

  test("特效试炼场：六个彩蛋场景可切换", async ({ page }) => {
    await page.goto("/");
    await gotoHash(page, "#effects");
    const names = ["灵泉 · 星位", "玄龟 · 厚势", "游鱼 · 气紧", "龙脉裂隙", "印章结算", "墨涌 · 屠龙"];
    for (const name of names) {
      await page.getByRole("button", { name: new RegExp(name) }).click();
      await expect(page.locator("svg.goban")).toBeVisible();
    }
  });

  test("作者页：底部无发光模块", async ({ page }) => {
    await page.goto("/");
    await gotoHash(page, "#about");
    await expect(page.locator("#about .ink-bloom-sweep")).toHaveCount(0);
    await expect(page.locator("#about")).toContainText("icloud.com");
  });
});

test.describe("对局路径", () => {
  test("择局 → 国手 → 落子出现金圈", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "开始对弈" }).click();
    await expect(page.getByRole("button", { name: /国手/ })).toBeVisible();
    await page.getByRole("button", { name: /国手/ }).click();
    await page.getByRole("button", { name: "入 局" }).click();

    const board = page.locator("svg.goban");
    await expect(board).toBeVisible();

    // 点棋盘中心（19 路天元）落子
    const box = await board.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.locator(".last-ring")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("商店与语言", () => {
  test("商店可进出", async ({ page }) => {
    await page.goto("/");
    await page.locator("section#top nav").getByRole("button", { name: "商城" }).click();
    await expect(page.getByText(/文钱/).first()).toBeVisible();
    await page.getByRole("button", { name: /返回墨境/ }).click();
    await expect(page.getByRole("button", { name: "开始对弈" })).toBeVisible();
  });

  test("英文版：古纸卷罗马序号草书", async ({ page }) => {
    await page.goto("/");
    await page.locator("section#top nav").getByRole("switch").click();
    await expect(page.getByRole("button", { name: "Begin Play" })).toBeVisible();
    await gotoHash(page, "#rules");
    await page.getByRole("button", { name: "Read the Rules of Go" }).click();
    await expect(page.getByRole("dialog")).toContainText("Rules of the Ink Board");
    // 罗马数字序号由 CSS ::before 生成（不在 textContent 中），断言正文即可
    await expect(page.locator(".rules-scroll-list li").first()).toContainText("Two players");
    await expect(page.locator(".rules-scroll-list li")).toHaveCount(7);
  });
});
