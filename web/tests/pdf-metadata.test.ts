/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";

import { renderImpressumHtml, mergeImpressum } from "../src/impressum-config";
import { buildPdfKeywords, extractDocumentTitle, extractPdfMetadata } from "../src/pdf-metadata";

function pageWithHtml(html: string): NodeListOf<HTMLElement> {
  const article = document.createElement("article");
  article.className = "a4-page";
  article.innerHTML = `<div class="page-body">${html}</div>`;
  document.body.appendChild(article);
  const list = document.querySelectorAll<HTMLElement>(".a4-page");
  return list;
}

describe("extractDocumentTitle", () => {
  it("bevorzugt Projekttitel vor IMPRESSUM-Überschrift", () => {
    const pages = pageWithHtml(`
      <h1 class="impressum-main-title">IMPRESSUM</h1>
      <p class="impressum-project-title">Mein Abenteuer</p>
    `);
    expect(extractDocumentTitle(pages)).toBe("Mein Abenteuer");
    pages[0].remove();
  });

  it("nutzt erstes Inhalts-H1 ohne Impressum", () => {
    const pages = pageWithHtml(`<h1>Kapitel Eins</h1><p>Text</p>`);
    expect(extractDocumentTitle(pages)).toBe("Kapitel Eins");
    pages[0].remove();
  });
});

describe("extractPdfMetadata", () => {
  it("mappt Impressum-Felder auf Author, Subject und Keywords", () => {
    const data = mergeImpressum({
      projectTitle: "Schatten über Aventuria",
      authorValue: "Max Mustermann",
      versionNumber: "1.0",
      versionDate: "01.01.2026",
      versionEdition: "1. Auflage"
    });
    const html = renderImpressumHtml(data, (s) => s);
    const pages = pageWithHtml(html);

    const meta = extractPdfMetadata(pages);
    expect(meta.title).toBe("Schatten über Aventuria");
    expect(meta.author).toBe("Max Mustermann");
    expect(meta.subject).toContain("1.0");
    expect(meta.keywords).toContain("Autor: Max Mustermann");
    expect(meta.impressum.Projekttitel).toBe("Schatten über Aventuria");
    pages[0].remove();
  });
});

describe("buildPdfKeywords", () => {
  it("verkettet Felder mit Semikolon", () => {
    const kw = buildPdfKeywords({ Autor: "A", Kontakt: "B" });
    expect(kw).toBe("Autor: A; Kontakt: B");
  });
});
