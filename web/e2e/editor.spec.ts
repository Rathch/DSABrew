import { expect, test } from "@playwright/test";
import { E2E_EDIT, gotoHostedEditor } from "./helpers/hosted-document-mock";

test.describe("Editor + Vorschau (P1 — mit gemockter API)", () => {
  test("Neues Dokument → Editor: Textarea, Vorschau aktualisiert sich", async ({
    page
  }) => {
    await gotoHostedEditor(page);

    const input = page.locator("#markdown-input");
    await expect(input).toBeVisible();
    await input.fill("## E2E Überschrift\n");

    await expect(page.locator("#preview")).toContainText("E2E Überschrift", {
      timeout: 15_000
    });
  });
});
