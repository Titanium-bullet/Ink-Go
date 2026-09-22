import { defineConfig } from "@playwright/test";

/**
 * UI 冒烟测试：webServer 自动起 Vite dev，跑完自动收掉。
 * 引擎级正确性由 scripts/selftest.ts 覆盖，这里只管"页面活着且关键路径可走通"。
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: "http://localhost:5179",
    // 应用默认语言为英文；冒烟用例以中文为基准（英文用例自行切换）
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:5179",
          localStorage: [{ name: "inkgo-lang", value: "zh" }],
        },
      ],
    },
    locale: "zh-CN",
    viewport: { width: 1280, height: 800 },
  },
  expect: { timeout: 5_000 },
  reporter: [["list"]],
  webServer: {
    command: "npx vite --port 5179 --strictPort",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
