import type { Page } from "@playwright/test";

/** Stabile Test-Slugs (URL-sicher, ohne Sonderzeichen). */
export const E2E_EDIT = "e2eEditSlug0123456789ab";
export const E2E_VIEW = "e2eViewSlug0123456789ab";

export type HostedDocumentMockOptions = {
  /** GET `/api/documents/:E2E_EDIT` — initiales Markdown */
  editMarkdown?: string;
  /** GET `/api/documents/:E2E_VIEW` — nur wenn gesetzt (Lesemodus-Pfad) */
  viewMarkdown?: string;
};

/**
 * Mockt POST /api/documents, GET/PUT /api/documents/:token — kein echter Server nötig (P1/P2-Lücken).
 */
export async function mockHostedDocumentApi(
  page: Page,
  options?: HostedDocumentMockOptions
): Promise<void> {
  const editMarkdown = options?.editMarkdown ?? "# Hello E2E";
  const viewMarkdown = options?.viewMarkdown ?? "# Nur Lesen E2E";

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
          markdown: editMarkdown,
          mode: "edit",
          updatedAt: Date.now(),
          slugView: E2E_VIEW,
          slugEdit: E2E_EDIT
        })
      });
      return;
    }

    if (method === "GET" && path === `/api/documents/${E2E_VIEW}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          markdown: viewMarkdown,
          mode: "view",
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

/** POST /api/documents → 503 (Wartungsseite auf `/`). */
export async function mockPostDocuments503(page: Page): Promise<void> {
  await page.route("**/api/documents**", async (route) => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    if (method === "POST" && (path === "/api/documents" || path.endsWith("/api/documents"))) {
      await route.fulfill({ status: 503, body: "Service Unavailable" });
      return;
    }
    await route.continue();
  });
}

export async function gotoHostedEditor(page: Page, options?: HostedDocumentMockOptions): Promise<void> {
  await mockHostedDocumentApi(page, options);
  await page.goto("/");
  await page.waitForURL(`**/d/${E2E_EDIT}`);
}

/** Lesemodus: `/d/:slugView` mit `mode: "view"`. */
export async function gotoHostedViewOnly(page: Page, options?: HostedDocumentMockOptions): Promise<void> {
  await mockHostedDocumentApi(page, options);
  await page.goto(`/d/${E2E_VIEW}`);
  await page.waitForURL(`**/d/${E2E_VIEW}`);
}
