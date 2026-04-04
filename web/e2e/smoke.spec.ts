import { expect, test } from "@playwright/test";

test.describe("Smoke (P0 — contracts/e2e-playwright.md)", () => {
  test("Impressum: Shell, Überschrift, Theme-Steuerung", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.locator("#app")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
    await expect(page.locator("[data-theme-btn]")).toHaveCount(2);
  });

  test("Datenschutz: Shell lädt", async ({ page }) => {
    await page.goto("/datenschutz");
    await expect(page.locator("#app")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Datenschutz" })).toBeVisible();
  });
});
