import { expect, test } from "@playwright/test";

/**
 * Echte POST/GET/PUT gegen Fastify — keine page.route-Mocks.
 * Voraussetzung: playwright.integration.config.ts + gebautes dist mit passender VITE_PUBLIC_API_BASE.
 */
test.describe("Integration (API-Server)", () => {
  test("Neues Dokument → Editor, Vorschau aktualisiert sich", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/d\/[^/]+$/);

    const input = page.locator("#markdown-input");
    await expect(input).toBeVisible();
    await input.fill("## Integration E2E\n");

    await expect(page.locator("#preview")).toContainText("Integration E2E", {
      timeout: 15_000
    });
  });
});
