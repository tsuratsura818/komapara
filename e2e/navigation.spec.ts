import { test, expect } from "@playwright/test";

test.describe("ナビゲーション", () => {
  test("ランキングページに遷移できる", async ({ page }) => {
    const response = await page.goto("/ranking");
    expect(response?.status()).toBe(200);
  });

  test("ジャンルページに遷移できる", async ({ page }) => {
    const response = await page.goto("/genre/nichijou");
    expect(response?.status()).toBe(200);
  });

  test("検索ページに遷移できる", async ({ page }) => {
    const response = await page.goto("/search");
    expect(response?.status()).toBe(200);
  });

  test("利用規約ページに遷移できる", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBe(200);
  });

  test("プライバシーポリシーページに遷移できる", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
  });

  test("特商法ページに遷移できる", async ({ page }) => {
    const response = await page.goto("/tokusho");
    expect(response?.status()).toBe(200);
  });

  test("LPページに遷移できる", async ({ page }) => {
    const response = await page.goto("/lp");
    expect(response?.status()).toBe(200);
  });
});
