import { describe, expect, it } from "vitest";
import { DEFAULT_MARKDOWN_DEMO } from "../src/default-markdown-demo";
import { renderDocument } from "../src/renderer";

function tocNavHtml(pageHtml: string): string {
  const start = pageHtml.indexOf('<nav class="toc');
  if (start < 0) {
    return "";
  }
  const end = pageHtml.indexOf("</nav>", start);
  return end < 0 ? "" : pageHtml.slice(start, end + "</nav>".length);
}

describe("renderer functional", () => {
  it("renders exactly one page for empty or whitespace-only input", () => {
    expect(renderDocument("").pages.length).toBe(1);
    expect(renderDocument("   \n\t  ").pages.length).toBe(1);
  });

  it("increments page numbers from {{pageNumber N}}", () => {
    const result = renderDocument("{{pageNumber 2}}\n\n# A\n\n\\page\n# B");
    expect(result.pages[0].displayPageNumber).toBe(2);
    expect(result.pages[1].displayPageNumber).toBe(3);
  });

  it("resolves cover alias to einband chrome", () => {
    const r = renderDocument("\\map{cover}");
    expect(r.pages[0].mapKey).toBe("einband");
    expect(r.pages[0].pageChromeClasses).toContain("page-bg-einband");
  });

  it("applies custom Einband color from hex in map macro", () => {
    const r = renderDocument("\\map{einband #2a3440}");
    const p = r.pages[0];
    expect(p.mapKey).toBe("einband");
    expect(p.einbandCustomHex).toBe("#2a3440");
    expect(p.pageChromeClasses).toContain("page-einband-custom");
  });

  it("normalizes three-digit hex for Einband map", () => {
    const r = renderDocument("\\map{einband #abc}");
    expect(r.pages[0].einbandCustomHex).toBe("#aabbcc");
  });

  it("includes footnote label and content on the same page", () => {
    const r = renderDocument("{{footnote PART 2 | BORING STUFF}}");
    const html = r.pages[0].renderedHtml;
    expect(html).toContain("PART 2");
    expect(html).toContain("BORING STUFF");
  });

  it("TOC entries use fragment links matching heading ids", () => {
    const md = "{{pageNumber 1}}\n# Kapitel Alpha\n\n## Beta\n\n{{tocDepthH3}}\n";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain('href="#p1-beta"');
    expect(html).toContain('id="p1-beta"');
    expect(html).toContain('id="p1-kapitel-alpha"');
    expect(html).not.toContain('href="#p1-kapitel-alpha"');
  });

  it("{{tocDepthH3}} lists H2–H3 only, not H1/H4", () => {
    const md =
      "{{pageNumber 1}}\n# Titel\n## Kapitel\n### Abschnitt\n#### Detail\n\n{{tocDepthH3}}\n";
    const toc = tocNavHtml(renderDocument(md).pages[0].renderedHtml);
    expect(toc).toContain("Kapitel");
    expect(toc).toContain("Abschnitt");
    expect(toc).not.toContain("Detail");
    expect(toc).not.toContain("Titel");
    expect(toc).not.toContain('href="#p1-titel"');
  });

  it("TOC links target anchors on later pages", () => {
    const md = "{{pageNumber 1}}\n{{tocDepthH3}}\n\\page\n## Auf Seite Zwei\n";
    const r = renderDocument(md);
    expect(tocNavHtml(r.pages[0].renderedHtml)).toContain('href="#p2-auf-seite-zwei"');
    expect(r.pages[1].renderedHtml).toContain('id="p2-auf-seite-zwei"');
  });

  it("TOC sheet uses 40-entry chunks: 1–40 left, 41–80 right on one sheet", () => {
    const headings = Array.from({ length: 42 }, (_, i) => `## ${i + 1}. Kapitel`).join("\n");
    const md = `{{pageNumber 1}}\n${headings}\n\\page\n{{tocDepthH2}}\n`;
    const tocPage = renderDocument(md).pages.find((p) => p.pageChromeClasses.includes("a4-page--toc-sheet"));
    expect(tocPage?.renderedHtml).toContain("toc-columns");
    const lists = [...(tocPage?.renderedHtml.matchAll(/<ol class="toc-list">([\s\S]*?)<\/ol>/g) ?? [])];
    expect(lists.length).toBe(2);
    const leftCount = (lists[0][1].match(/<li class="toc-item/g) ?? []).length;
    const rightCount = (lists[1][1].match(/<li class="toc-item/g) ?? []).length;
    expect(leftCount).toBe(40);
    expect(rightCount).toBe(2);
  });

  it("TOC-only page gets a4-page--toc-sheet chrome", () => {
    const md = "{{pageNumber 1}}\n# Titel\n## Kapitel\n\\page\n{{tocDepthH3}}\n";
    const tocPage = renderDocument(md).pages.find((p) => p.renderedHtml.includes("Inhaltsverzeichnis</h2>"));
    expect(tocPage?.pageChromeClasses).toContain("a4-page--toc-sheet");
  });

  it("TOC excludes pages with \\map{einband} and \\map{final}", () => {
    const md =
      "{{pageNumber 1}}\n\\map{einband}\n# Cover\n\\page\n## Kapitel Eins\n\\page\n\\map{final}\n# Rückseite\n\\page\n{{tocDepthH2}}\n";
    const html = renderDocument(md).pages.find((p) => p.renderedHtml.includes("Inhaltsverzeichnis"))!
      .renderedHtml;
    expect(html).toContain("Kapitel Eins");
    expect(html).not.toContain("Cover");
    expect(html).not.toContain("Rückseite");
    expect(html).not.toContain('href="#p1-cover"');
  });

  it("{{tocDepthH2}} lists only H2, not H1/H3", () => {
    const md = "{{pageNumber 1}}\n# Titel\n## Kapitel\n### Abschnitt\n\n{{tocDepthH2}}\n";
    const toc = tocNavHtml(renderDocument(md).pages[0].renderedHtml);
    expect(toc).toContain("Kapitel");
    expect(toc).toContain('href="#p1-kapitel"');
    expect(toc).not.toContain("Abschnitt");
    expect(toc).not.toContain("Titel");
    expect(toc).not.toContain('href="#p1-titel"');
  });

  it("{{tocDepthH4}} lists H2–H4 only, not H1", () => {
    const md =
      "{{pageNumber 1}}\n# Nur Titel\n## Kapitel\n### Abschnitt\n#### Unterabschnitt\n\n{{tocDepthH4}}\n";
    const toc = tocNavHtml(renderDocument(md).pages[0].renderedHtml);
    expect(toc).toContain("Kapitel");
    expect(toc).toContain("Abschnitt");
    expect(toc).toContain("Unterabschnitt");
    expect(toc).toContain('href="#p1-kapitel"');
    expect(toc).not.toContain("Nur Titel");
    expect(toc).not.toContain('href="#p1-nur-titel"');
  });

  it("long TOC: 40-entry chunks, two per sheet, continuation when needed", () => {
    const headings = Array.from({ length: 90 }, (_, i) => `## Kapitel ${i + 1}`).join("\n");
    const md = `{{pageNumber 1}}\n${headings}\n\\page\n{{tocDepthH3}}\n`;
    const r = renderDocument(md);
    const tocPage = r.pages.find((p) => p.renderedHtml.includes("Inhaltsverzeichnis</h2>"));
    expect(tocPage?.renderedHtml).toContain("toc-columns");
    const contPage = r.pages.find((p) => p.renderedHtml.includes("Inhaltsverzeichnis (Fortsetzung)"));
    expect(contPage).toBeDefined();
    expect(r.pages.length).toBeGreaterThan(2);
  });

  it("{{abschnitt N | …}} links to numbered H2 anchor (mit Punkt nach N)", () => {
    const md =
      "{{pageNumber 1}}\n## 14. Alpha\n\nWeiter: {{abschnitt 15 | **Abschnitt 15**}}\n\n## 15. Beta\n";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain('class="dsa-abschnitt-ref"');
    expect(html).toContain('href="#p1-15-beta"');
    expect(html).toContain("<strong>Abschnitt 15</strong>");
    expect(html).toContain('id="p1-15-beta"');
  });

  it("{{abschnitt N | …}} erkennt ## N Titel ohne Punkt nach der Nummer", () => {
    const md = "{{pageNumber 1}}\n## 14 x\n\n{{abschnitt 15 | weiter}}\n\n## 15 foo\n";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain('href="#p1-15-foo"');
    expect(html).toContain('id="p1-15-foo"');
  });

  it("{{abschnitt}} missing target renders placeholder and warning", () => {
    const md = "{{pageNumber 1}}\n{{abschnitt 99 | nirgends}}\n";
    const page = renderDocument(md).pages[0];
    expect(page.renderedHtml).toContain("dsa-abschnitt-ref--missing");
    expect(page.warnings.some((w) => w.includes("abschnitt 99"))).toBe(true);
  });

  it("wraps Markdown tables in dsa-md-table for Scriptorium styling", () => {
    const md = `| A | B |
| --- | --- |
| x | y |`;
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain('class="dsa-md-table"');
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain('scope="col"');
  });

  it("splits pages for {{page}} alias", () => {
    const result = renderDocument("# A\n\n{{page}}\n\n# B");
    expect(result.pages.length).toBe(2);
  });

  it("sets singleColumn on the page after pageSingle", () => {
    const r = renderDocument("Erste\n\\pageSingle\nZweite");
    expect(r.pages.length).toBe(2);
    expect(r.pages[0].singleColumn).toBe(false);
    expect(r.pages[1].singleColumn).toBe(true);
  });

  it("treats {{pageSingle}} like pageSingle break", () => {
    const r = renderDocument("a\n{{pageSingle}}\nb");
    expect(r.pages.length).toBe(2);
    expect(r.pages[1].singleColumn).toBe(true);
  });

  it("applies automatic even/odd content backgrounds when no map is set", () => {
    const r = renderDocument("{{pageNumber 1}}\n# S1\n\\page\n# S2\n\\page\n# S3");
    expect(r.pages[0].pageChromeClasses).toContain("page-bg-content-even");
    expect(r.pages[1].pageChromeClasses).toContain("page-bg-content-odd");
    expect(r.pages[2].pageChromeClasses).toContain("page-bg-content-even");
  });

  it("renders npcBlock as dsa-npc HTML, not raw macro text", () => {
    const md = `\\map{content-even}
# K
{{npcBlock
name=Test
mu=10
{{/npcBlock}}`;
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-npc-wrap");
    expect(html).not.toContain("{{npcBlock");
  });

  it("accepts npcBlock with space after opening braces", () => {
    const md = `\\map{content-even}
# K
{{ npcBlock
name=Test
mu=10
{{ /npcBlock }}`;
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-npc-wrap");
    expect(html).not.toContain("{{ npcBlock");
    expect(html).not.toContain("{{/npcBlock");
  });

  it("default demo: NSC-Seite rendiert npcBlock (kein Rohtext)", () => {
    const r = renderDocument(DEFAULT_MARKDOWN_DEMO);
    const joined = r.pages.map((p) => p.renderedHtml).join("\n");
    expect(joined).toContain("dsa-npc-wrap");
    expect(joined).not.toContain("{{npcBlock");
  });

  it("default demo: enthält einspaltige Seite (pageSingle)", () => {
    const r = renderDocument(DEFAULT_MARKDOWN_DEMO);
    expect(r.pages.some((p) => p.singleColumn === true)).toBe(true);
  });

  it("renders easier macro with dsa-diff and bundled icon", () => {
    const md = "{{easier |\n*Hinweis:* Text.\n}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-diff--easier");
    expect(html).toContain("dsa-diff__icon");
    expect(html).not.toContain("{{easier");
  });

  it("renders roulbox with header, body and no raw macro", () => {
    const md =
      "{{roulbox Regel A | Unter B |\n**Kapitel** und Text.\n\n- Eins\n}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-roulbox");
    expect(html).toContain("dsa-roulbox__header");
    expect(html).toContain("Regel A");
    expect(html).toContain("Unter B");
    expect(html).not.toContain("{{roulbox");
  });

  it("renders chess macro inline with dsa-chess", () => {
    const md = "Zug: {{ chess | pawn }} schlägt.";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-chess__img");
    expect(html).not.toContain("{{ chess");
  });

  it("renders difficulty rating with four diamond slots", () => {
    const md = "Stufe {{ difficulty | rot 2 }} und {{ difficulty | grün 3 }}.";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-difficulty-rating");
    expect(html).toContain("dsa-difficulty-rating__slot");
    expect(html).not.toContain("{{ difficulty");
  });

  it("parses adjacent difficulty macros without swallowing the next macro", () => {
    const md = "A {{ difficulty | rot 2 }} B {{ difficulty | grün 4 }} C.";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-difficulty-rating--red");
    expect(html).toContain("dsa-difficulty-rating--green");
    expect(html).not.toContain("{{ difficulty");
    expect(html).not.toContain("rot 2 }} {{");
  });

  it("renders difficulty label before diamonds", () => {
    const md = "Test {{ difficulty | Kampf: | grün 4 }} Ende.";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-difficulty-rating-line");
    expect(html).toContain("dsa-difficulty-rating__label");
    expect(html).toContain("Kampf:");
    expect(html).not.toContain("{{ difficulty");
  });

  it("renders readAloudNote (vorlesenNote alias) with title and body", () => {
    const md = "{{readAloudNote Titel | **Hinweis** im Text.}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-note--read-aloud");
    expect(html).toContain("Titel");
    expect(html).toContain("<strong>Hinweis</strong>");
    expect(html).not.toContain("{{readAloudNote");
  });

  it("renders gmNote (meisterNote alias)", () => {
    const md = "{{meisterNote GM | Nur für die SL.}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-note--gm");
    expect(html).toContain("Nur für die SL.");
    expect(html).not.toContain("{{meisterNote");
  });

  it("expands {{abschnitt}} inside roulbox (empty subtitle, nested }}", () => {
    const md =
      "{{pageNumber 1}}\n## 14. Alpha\n\n{{roulbox Regeneration || |\nRegeneration: -2\n{{abschnitt 15 | **Abschnitt 15**}}\n}}\n\n## 15. Beta\n";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-roulbox");
    expect(html).toContain("Regeneration");
    expect(html).toContain('class="dsa-abschnitt-ref"');
    expect(html).toContain('href="#');
    expect(html).toContain("<strong>Abschnitt 15</strong>");
    expect(html).not.toContain("{{abschnitt");
    expect(html).not.toContain("{{roulbox");
  });

  it("expands {{abschnitt}} inside gmNote body", () => {
    const md =
      "{{pageNumber 1}}\n## 15. Ziel\n\n{{gmNote Meisterinformation: |\nGeheim.\n{{abschnitt 15 | weiter}}\n}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-note--gm");
    expect(html).toContain('class="dsa-abschnitt-ref"');
    expect(html).toContain("weiter");
    expect(html).not.toContain("{{abschnitt");
  });

  it("expands {{abschnitt}} inside readAloudNote body", () => {
    const md =
      "{{pageNumber 1}}\n## 15. Ziel\n\n{{readAloudNote Vorlesen: |\n*Text*\n{{abschnitt 15 | Lies weiter}}\n}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-note--read-aloud");
    expect(html).toContain('class="dsa-abschnitt-ref"');
    expect(html).toContain("Lies weiter");
    expect(html).not.toContain("{{abschnitt");
  });

  it("renders all three box macros with nested {{abschnitt}} on one line each", () => {
    const md =
      "{{pageNumber 1}}\n## 15. Ziel\n\n{{roulbox Regeneration || Regeneration: -2 {{abschnitt 15 | Lies bei Abschnitt 15 weiter}} }}\n\n{{gmNote Meisterinformation: | Geheime Infos. {{abschnitt 15 | Lies bei Abschnitt 15 weiter}} }}\n\n{{readAloudNote Zum Vorlesen: | Hier *kursiver* Text. {{abschnitt 15 | Lies bei Abschnitt 15 weiter}} }}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-roulbox");
    expect(html).toContain("dsa-note--gm");
    expect(html).toContain("dsa-note--read-aloud");
    expect(html).toContain("dsa-abschnitt-ref");
    expect(html).not.toMatch(/\{\{(roulbox|gmNote|readAloudNote)/);
  });

  it("renders {{impressumPage}} as impressum sheet markup", () => {
    const r = renderDocument("{{impressumPage}}");
    const html = r.pages.map((p) => p.renderedHtml).join("\n");
    expect(html).toContain("impressum-sheet");
    expect(html).toContain("IMPRESSUM");
  });

});

