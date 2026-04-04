import { expect, test } from "@playwright/test";
import {
  E2E_EDIT,
  E2E_VIEW,
  gotoHostedEditor,
  gotoHostedViewOnly,
  mockHostedDocumentApi,
  mockPostDocuments503
} from "./helpers/hosted-document-mock";

test.describe("App-Chrome & Shell (P1 — Ergänzung zu contracts/e2e-playwright.md)", () => {
  test("Wartung: POST 503 zeigt Wartungsseite", async ({ page }) => {
    await mockPostDocuments503(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Wartung" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".maintenance-shell, .legal-shell")).toBeVisible();
  });

  test("Privacy-Strip: sichtbar, Verstanden blendet aus", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("dsabrew-privacy-strip-dismissed");
    });
    await gotoHostedEditor(page);
    const strip = page.locator("#dsabrew-privacy-strip");
    await expect(strip).toBeVisible();
    await page.locator("#privacy-strip-dismiss").click();
    await expect(strip).toBeHidden();
  });

  test("Neues Dokument öffnet /new in neuem Tab", async ({ page }) => {
    await gotoHostedEditor(page);
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.locator("#hosted-new-btn").click()
    ]);
    await expect(popup).toHaveURL(/\/new(\/)?(\?.*)?$/);
    await popup.close();
  });

  test("Teilen: Nur-Ansicht kopiert Link in die Zwischenablage", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoHostedEditor(page);
    await page.locator("#share-view-btn").click();
    await expect(page.locator("#save-status")).toHaveText("Nur-Ansicht-Link kopiert", { timeout: 5000 });
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain(E2E_VIEW);
    expect(clip).toMatch(/\/d\//);
  });

  test("Teilen: Bearbeiten kopiert Edit-Slug", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoHostedEditor(page);
    await page.locator("#share-edit-btn").click();
    await expect(page.locator("#save-status")).toHaveText("Bearbeiten-Link kopiert", { timeout: 5000 });
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain(E2E_EDIT);
  });

  test("PDF speichern: lädt .pdf herunter", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoHostedEditor(page);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 90_000 }),
      page.locator("#pdf-btn-banner").click()
    ]);
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/);
  });

  test("Ansicht Beides: Scroll-Kopplung, Gutter, localStorage", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("dsabrew-hosted-view");
      localStorage.removeItem("dsabrew-scroll-link");
    });
    await gotoHostedEditor(page);

    await expect(page.locator("#hosted-view-layout")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#editor-sync-bar")).toBeVisible();
    await expect(page.locator("#scroll-link-toggle")).toBeChecked();

    await page.locator("#scroll-link-toggle").uncheck();
    expect(await page.evaluate(() => localStorage.getItem("dsabrew-scroll-link"))).toBe("0");

    await expect(page.locator("#editor-viewport-gutter")).toBeVisible();
  });

  test("Nur-Lese-Modus: Toolbar-Hinweis, Textarea readonly, kein Bearbeiten-Teilen", async ({
    page
  }) => {
    await gotoHostedViewOnly(page);
    await expect(page.locator("#share-edit-btn")).toHaveCount(0);
    await expect(page.locator("#markdown-input")).toHaveAttribute("readonly");

    /* Standard ist „Nur Vorschau“ — Editor/Toolbar erst nach „Beides“ sichtbar */
    await page.locator("#hosted-view-layout").click();
    await expect(page.locator("#md-toolbar .md-toolbar-disabled-hint")).toBeVisible();
  });

  test("Hash in URL: Sprung zur Überschrift beim ersten Render", async ({ page }) => {
    await mockHostedDocumentApi(page, {
      editMarkdown: "{{pageNumber 1}}\n## Hash Test\n"
    });
    await page.goto(`/d/${E2E_EDIT}#p1-hash-test`);
    await page.waitForURL(`**/d/${E2E_EDIT}**`);
    const heading = page.locator("#preview h2#p1-hash-test");
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(heading).toBeInViewport();
  });
});
