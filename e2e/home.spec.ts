import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
  test("ページが読み込める", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("ヘッダーにロゴがある", async ({ page }) => {
    await page.goto("/");
    const logo = page.locator('a[aria-label="コマパラ ホーム"]');
    await expect(logo).toBeVisible();
  });

  test("フィードが表示される", async ({ page }) => {
    await page.goto("/");
    // メインコンテンツエリアが存在することを確認
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
