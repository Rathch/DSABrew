import { expect, test, type Page } from "@playwright/test";
import { gotoHostedEditor } from "./helpers/hosted-document-mock";

const preview = () => "#preview";

async function expectPreviewContains(
  page: Page,
  selector: string,
  options?: { timeout?: number }
): Promise<void> {
  await expect(page.locator(`${preview()} ${selector}`).first()).toBeVisible({
    timeout: options?.timeout ?? 15_000
  });
}

test.describe("Hosted Editor — Makros (nur getippt)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoHostedEditor(page);
  });

  test("{{pageNumber}} + Seitennummer in der Vorschau", async ({ page }) => {
    await page.locator("#markdown-input").fill("{{pageNumber 3}}\n# Titel\n");
    await expect(page.locator(`${preview()} .page-number`).first()).toContainText("03", {
      timeout: 15_000
    });
  });

  test("{{tocDepthH3}} erzeugt TOC-Links", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill("{{pageNumber 1}}\n# Alpha\n\n## Beta\n\n{{tocDepthH3}}\n");
    await expectPreviewContains(page, 'a[href="#p1-alpha"]');
    await expectPreviewContains(page, 'a[href="#p1-beta"]');
  });

  test("{{footnote}} — Referenz und Fußnote", async ({ page }) => {
    await page.locator("#markdown-input").fill("Text {{footnote FN1 | Fußnotentext}}\n");
    await expectPreviewContains(page, "sup.footnote-ref");
    await expect(page.locator(preview())).toContainText("Fußnotentext");
  });

  test("\\page und {{page}} — zwei Seiten", async ({ page }) => {
    await page.locator("#markdown-input").fill("# A\n\n{{page}}\n\n# B\n");
    await expect(page.locator(`${preview()} .a4-page`)).toHaveCount(2, { timeout: 15_000 });
  });

  test("{{pageSingle}} — zweite Seite einspaltig", async ({ page }) => {
    await page.locator("#markdown-input").fill("a\n{{pageSingle}}\nb\n");
    await expect(page.locator(`${preview()} .a4-page`).nth(1)).toHaveClass(/a4-page--single-column/, {
      timeout: 15_000
    });
  });

  test("{{readAloudNote}} — Vorlesen-Box", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill("{{readAloudNote Titel | **Inhalt**}}\n");
    await expectPreviewContains(page, ".dsa-note--read-aloud");
    await expect(page.locator(preview())).toContainText("Titel");
  });

  test("{{vorlesenNote}} — Alias", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill("{{vorlesenNote Alias | Text}}\n");
    await expectPreviewContains(page, ".dsa-note--read-aloud");
  });

  test("{{gmNote}} / {{meisterNote}}", async ({ page }) => {
    await page.locator("#markdown-input").fill("{{gmNote SL | Geheim}}\n");
    await expectPreviewContains(page, ".dsa-note--gm");
    await page.locator("#markdown-input").fill("{{meisterNote M | X}}\n");
    await expectPreviewContains(page, ".dsa-note--gm");
  });

  test("{{roulbox}}", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill("{{roulbox A | B |\n**x**\n}}\n");
    await expectPreviewContains(page, ".dsa-roulbox");
  });

  test("{{easier}} / {{harder}}", async ({ page }) => {
    await page.locator("#markdown-input").fill("{{easier |\n*e*\n}}\n");
    await expectPreviewContains(page, ".dsa-diff--easier");
    await page.locator("#markdown-input").fill("{{harder |\n*h*\n}}\n");
    await expectPreviewContains(page, ".dsa-diff--harder");
  });

  test("{{ chess | pawn }}", async ({ page }) => {
    await page.locator("#markdown-input").fill("x {{ chess | pawn }} y\n");
    await expectPreviewContains(page, ".dsa-chess__img");
  });

  test("{{ difficulty }}", async ({ page }) => {
    await page.locator("#markdown-input").fill("{{ difficulty | rot 2 }}\n");
    await expectPreviewContains(page, ".dsa-difficulty-rating--red");
  });

  test("{{abschnitt}} mit Ziel-Überschrift", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill(
        "{{pageNumber 1}}\n## 3 Kapitel\n\n{{abschnitt 3 | springen}}\n"
      );
    await expectPreviewContains(page, "a.dsa-abschnitt-ref");
  });

  test("{{npcBlock}} minimal", async ({ page }) => {
    await page.locator("#markdown-input").fill(
      `\\map{content-even}
# K
{{npcBlock
name=E2E
mu=10
{{/npcBlock}}`
    );
    await expectPreviewContains(page, ".dsa-npc-wrap");
    await expect(page.locator(preview())).toContainText("E2E");
  });

  test("\\map{cover}", async ({ page }) => {
    await page.locator("#markdown-input").fill("\\map{cover}\n# T\n");
    await expect(page.locator(`${preview()} .a4-page`).first()).toHaveClass(/page-bg-einband/, {
      timeout: 15_000
    });
  });

  test("\\rauten{default}", async ({ page }) => {
    await page.locator("#markdown-input").fill("\\rauten{default}\n# T\n");
    await expect(page.locator(`${preview()} .a4-page`).first()).toHaveClass(/page-rauten-default/, {
      timeout: 15_000
    });
  });

  test("{{impressumPage}}", async ({ page }) => {
    await page.locator("#markdown-input").fill("{{impressumPage}}");
    await expectPreviewContains(page, ".impressum-sheet");
    await expect(page.locator(preview())).toContainText("IMPRESSUM");
  });

  test("Markdown-Tabelle — dsa-md-table", async ({ page }) => {
    await page
      .locator("#markdown-input")
      .fill("| A | B |\n| --- | --- |\n| x | y |\n");
    await expectPreviewContains(page, "table.dsa-md-table");
  });

  test("Durchgestrichen / Code / Zitat — getippt", async ({ page }) => {
    await page.locator("#markdown-input").fill("~~del~~ und `code` und\n> Zitat\n");
    // markdown-it: GFM-Durchstreichung → meist <s>, nicht <del>
    await expect(page.locator(`${preview()} s, ${preview()} del`).first()).toBeVisible({
      timeout: 15_000
    });
    await expect(page.locator(`${preview()} code`)).toBeVisible();
    await expect(page.locator(`${preview()} blockquote`)).toBeVisible();
  });

  test("Listen und Code-Block — getippt", async ({ page }) => {
    await page.locator("#markdown-input").fill("- a\n\n1. b\n\n```\nfence\n```\n");
    await expect(page.locator(`${preview()} ul`)).toBeVisible();
    await expect(page.locator(`${preview()} ol`)).toBeVisible();
    await expect(page.locator(`${preview()} pre`)).toBeVisible();
  });
});

test.describe("Hosted Editor — Toolbar: Makros & Formatierung", () => {
  test.beforeEach(async ({ page }) => {
    await gotoHostedEditor(page);
  });

  test("Seitenumbruch (#md-tool-page)", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("# Erste");
    await page.locator("#md-tool-page").click();
    await input.pressSequentially("\n\n# Zweite");
    await expect(page.locator(`${preview()} .a4-page`)).toHaveCount(2, { timeout: 15_000 });
  });

  test("1 Spalte (#md-tool-pageSingle)", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("oben");
    await page.locator("#md-tool-pageSingle").click();
    await input.pressSequentially("\n\nunten");
    await expect(page.locator(`${preview()} .a4-page`).nth(1)).toHaveClass(/a4-page--single-column/, {
      timeout: 15_000
    });
  });

  test("Abschnitt (#md-tool-abschnitt) mit Prompts", async ({ page }) => {
    let promptCount = 0;
    page.on("dialog", async (dialog) => {
      promptCount += 1;
      if (dialog.type() === "prompt") {
        if (promptCount === 1) {
          await dialog.accept("3");
        } else {
          await dialog.accept("Linktext");
        }
      } else {
        await dialog.dismiss();
      }
    });
    await page
      .locator("#markdown-input")
      .fill("{{pageNumber 1}}\n## 3 Ziel\n\n");
    await page.locator("#md-tool-abschnitt").click();
    await expectPreviewContains(page, "a.dsa-abschnitt-ref");
    await expect(page.locator(preview())).toContainText("Linktext");
  });

  test("Vorlesen — Toolbar (#md-tool-readAloudNote)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-readAloudNote").click();
    await expectPreviewContains(page, ".dsa-note--read-aloud");
  });

  test("SL-Info — Toolbar (#md-tool-gmNote)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-gmNote").click();
    await expectPreviewContains(page, ".dsa-note--gm");
  });

  test("Regel — Toolbar (#md-tool-roulbox)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-roulbox").click();
    await expectPreviewContains(page, ".dsa-roulbox");
  });

  test("Leichter — Toolbar (#md-tool-easier)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-easier").click();
    await expectPreviewContains(page, ".dsa-diff--easier");
  });

  test("Schwerer — Toolbar (#md-tool-harder)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-harder").click();
    await expectPreviewContains(page, ".dsa-diff--harder");
  });

  test("Schachfigur — Toolbar (#md-tool-chess)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-chess").click();
    await expectPreviewContains(page, ".dsa-chess__img");
  });

  test("Rauten — Toolbar (#md-tool-difficulty)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-difficulty").click();
    await expectPreviewContains(page, ".dsa-difficulty-rating");
  });

  test("NSC — Toolbar (#md-tool-npcBlock)", async ({ page }) => {
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-npcBlock").click();
    await expectPreviewContains(page, ".dsa-npc-wrap");
    await expect(page.locator(preview())).toContainText("Lorem-Riese");
  });

  test("Tabelle / Trennlinie — Toolbar", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("");
    await page.locator("#md-tool-table").click();
    await expectPreviewContains(page, "table.dsa-md-table");

    await input.fill("");
    await page.locator("#md-tool-hr").click();
    await expectPreviewContains(page, "hr");
  });

  test("Bild — Toolbar (#md-tool-imageUrl) mit URL-Prompt", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      await dialog.accept("https://example.test/e2e-bild.png");
    });
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-imageUrl").click();
    await expectPreviewContains(page, 'img[src="https://example.test/e2e-bild.png"]');
  });

  test("Fett / Kursiv / H2 — Toolbar", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("");
    await page.locator("#md-tool-bold").click();
    await expectPreviewContains(page, "strong");

    await input.fill("");
    await page.locator("#md-tool-italic").click();
    await expectPreviewContains(page, "em");

    await input.fill("Zeile");
    await page.locator("#md-tool-h2").click();
    await expect(page.locator(`${preview()} h2`)).toContainText("Zeile");
  });

  test("Durchgestrichen / Code / Zitat — Toolbar", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("");
    await page.locator("#md-tool-strike").click();
    await expect(page.locator(`${preview()} del, ${preview()} s`).first()).toBeVisible({
      timeout: 15_000
    });

    await input.fill("");
    await page.locator("#md-tool-code").click();
    await expectPreviewContains(page, "code");

    await input.fill("Zitatzeile");
    await page.locator("#md-tool-quote").click();
    await expectPreviewContains(page, "blockquote");
  });

  test("Aufzählung / Nummerierung / Code-Block — Toolbar", async ({ page }) => {
    const input = page.locator("#markdown-input");
    await input.fill("Punkt");
    await page.locator("#md-tool-ul").click();
    await expectPreviewContains(page, "ul li");

    await input.fill("Schritt");
    await page.locator("#md-tool-ol").click();
    await expectPreviewContains(page, "ol li");

    await input.fill("");
    await page.locator("#md-tool-fence").click();
    await expectPreviewContains(page, "pre");
  });

  test("Link — Toolbar mit Prompts", async ({ page }) => {
    let n = 0;
    page.on("dialog", async (dialog) => {
      n += 1;
      if (n === 1) {
        await dialog.accept("https://example.test/e2e");
      } else {
        await dialog.accept("Linklabel");
      }
    });
    await page.locator("#markdown-input").fill("");
    await page.locator("#md-tool-link").click();
    await expect(page.locator(`${preview()} a[href="https://example.test/e2e"]`)).toContainText(
      "Linklabel",
      { timeout: 15_000 }
    );
  });
});
