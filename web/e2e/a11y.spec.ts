import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { gotoHostedEditor, gotoHostedViewOnly } from "./helpers/hosted-document-mock";

/**
 * Automatisierte Barrierefreiheits-Checks (axe-core) — ergänzen manuelle Tests
 * (Tastatur, Screenreader, Inhalt). Siehe https://github.com/dequelabs/axe-core
 */
test.describe("Barrierefreiheit (axe)", () => {
  test("Gehostetes Dokument — Bearbeiten (/d/…, mode edit): axe", async ({
    page
  }) => {
    // Mock: POST /api/documents → Redirect auf `/d/e2eEditSlug0123456789ab` (siehe hosted-document-mock).
    await gotoHostedEditor(page);
    await page.locator("#app").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Gehostetes Dokument — Nur Lesen (/d/…, mode view): axe", async ({
    page
  }) => {
    await gotoHostedViewOnly(page);
    await page.locator("#app").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Betrieb (/ops): axe", async ({ page }) => {
    await page.goto("/ops");
    await page.locator("#app").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Impressum: axe", async ({ page }) => {
    await page.goto("/impressum");
    await page.locator("#app").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Datenschutz: axe", async ({ page }) => {
    await page.goto("/datenschutz");
    await page.locator("#app").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

type AxeViolation = {
  id: string;
  impact?: string | null;
  help: string;
  nodes: unknown[];
  helpUrl: string;
};

function formatViolations(violations: AxeViolation[]): string {
  if (violations.length === 0) return "";
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} Element(e); ${v.helpUrl}`
    )
    .join("\n");
}
