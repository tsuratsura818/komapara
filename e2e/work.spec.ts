import { test, expect } from "@playwright/test";

test.describe("作品ページ", () => {
  test("存在しないIDで404になる", async ({ page }) => {
    const response = await page.goto("/work/nonexistent-id-that-does-not-exist");
    // Next.js は not-found の場合でも200を返すことがあるため、ページ内容で判定
    const notFound = page.locator("text=見つかりませんでした");
    const is404Status = response?.status() === 404;
    const hasNotFoundText = await notFound.isVisible().catch(() => false);
    expect(is404Status || hasNotFoundText).toBeTruthy();
  });
});
