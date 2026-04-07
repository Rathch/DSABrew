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

    /* Kein route.continue(): sonst trifft Vites Proxy 127.0.0.1:3001 — ECONNREFUSED ohne Server. */
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
      return;
    }

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

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "e2e: unmocked", method, path })
    });
  });
}

/** POST /api/documents → 503 (Wartungsseite auf `/`). */
export async function mockPostDocuments503(page: Page): Promise<void> {
  await page.route("**/api/documents**", async (route) => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
      return;
    }
    if (method === "POST" && (path === "/api/documents" || path.endsWith("/api/documents"))) {
      await route.fulfill({ status: 503, body: "Service Unavailable" });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "e2e: unmocked", method, path })
    });
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
