import type { Page } from "@playwright/test";

/** Stabile Test-Slugs (URL-sicher, ohne Sonderzeichen). */
export const E2E_EDIT = "e2eEditSlug0123456789ab";
export const E2E_VIEW = "e2eViewSlug0123456789ab";

/**
 * Mockt POST /api/documents, GET/PUT /api/documents/:token — kein echter Server nötig (P1/P2-Lücken).
 */
export async function mockHostedDocumentApi(page: Page): Promise<void> {
  await page.route("**/api/documents**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    const path = new URL(url).pathname;

    if (method === "POST" && (path === "/api/documents" || path.endsWith("/api/documents"))) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          slugEdit: E2E_EDIT,
          slugView: E2E_VIEW
        })
      });
      return;
    }

    if (method === "GET" && path === `/api/documents/${E2E_EDIT}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          markdown: "# Hello E2E",
          mode: "edit",
          updatedAt: Date.now(),
          slugView: E2E_VIEW,
          slugEdit: E2E_EDIT
        })
      });
      return;
    }

    if (method === "PUT" && path === `/api/documents/${E2E_EDIT}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, updatedAt: Date.now() })
      });
      return;
    }

    await route.continue();
  });
}

export async function gotoHostedEditor(page: Page): Promise<void> {
  await mockHostedDocumentApi(page);
  await page.goto("/");
  await page.waitForURL(`**/d/${E2E_EDIT}`);
}
