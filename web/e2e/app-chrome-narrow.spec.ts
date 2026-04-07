import { expect, test } from "@playwright/test";
import { gotoHostedEditor } from "./helpers/hosted-document-mock";

/**
 * Eigene Datei: `playwright.config.ts` nutzt `devices["Desktop Chrome"]` (~1280px).
 * Nur explizites `viewport` + Mobile-Flags — kein `devices["iPhone 13"]`, denn das Preset
 * setzt `defaultBrowserType: "webkit"` und würde WebKit starten (in CI oft nicht installiert).
 */
test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
});

test.describe("App-Chrome — schmale Viewports (#16)", () => {
  test("Beides ausgeblendet; Standard nur Markdown; Wechsel zu Vorschau", async ({ page }) => {
    /* Zusätzlich zu test.use: Viewport vor Navigation setzen (robust gegen Options-Merge). */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.removeItem("dsabrew-hosted-view");
    });
    await gotoHostedEditor(page);

    await page.waitForFunction(
      () => window.matchMedia("(max-width: 960px)").matches,
      undefined,
      { timeout: 15_000 }
    );

    await expect(page.locator("#hosted-view-layout")).toBeHidden();
    await expect(page.locator("main.layout")).toHaveClass(/layout--hosted-narrow/);
    await expect(page.locator("#hosted-view-md")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#preview")).not.toBeVisible();

    await page.locator("#hosted-view-preview").click();
    await expect(page.locator("#hosted-view-preview")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#markdown-input")).not.toBeVisible();
    await expect(page.locator("#preview")).toBeVisible();
  });
});
