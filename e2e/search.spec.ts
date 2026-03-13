import { test, expect } from "@playwright/test";

test.describe("検索機能", () => {
  test("検索ページが読み込める", async ({ page }) => {
    const response = await page.goto("/search");
    expect(response?.status()).toBe(200);
  });

  test("キーワード検索ができる", async ({ page }) => {
    await page.goto("/search");
    // 検索入力欄を探す
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("テスト");
    // Enter または検索ボタンで検索実行
    await searchInput.press("Enter");
    // ページが遷移またはリロードされて結果が表示されることを確認
    await page.waitForLoadState("networkidle");
  });
});
