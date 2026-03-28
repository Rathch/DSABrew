import { describe, expect, it } from "vitest";
import { DEFAULT_MARKDOWN_DEMO } from "../src/default-markdown-demo";
import { buildPageChromeClasses, renderDocument } from "../src/renderer";

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

  it("includes footnote label and content on the same page", () => {
    const r = renderDocument("{{footnote PART 2 | BORING STUFF}}");
    const html = r.pages[0].renderedHtml;
    expect(html).toContain("PART 2");
    expect(html).toContain("BORING STUFF");
  });

  it("TOC entries use fragment links matching heading ids", () => {
    const md = "{{pageNumber 1}}\n# Kapitel Alpha\n\n{{tocDepthH3}}\n";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain('href="#p1-kapitel-alpha"');
    expect(html).toContain('id="p1-kapitel-alpha"');
  });

  it("TOC links target anchors on later pages", () => {
    const md = "{{pageNumber 1}}\n{{tocDepthH3}}\n\\page\n# Auf Seite Zwei\n";
    const r = renderDocument(md);
    expect(r.pages[0].renderedHtml).toContain('href="#p2-auf-seite-zwei"');
    expect(r.pages[1].renderedHtml).toContain('id="p2-auf-seite-zwei"');
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



  it("resolves cover alias to einband chrome", () => {

    const r = renderDocument("\\map{cover}");

    expect(r.pages[0].mapKey).toBe("einband");

    expect(r.pages[0].pageChromeClasses).toContain("page-bg-einband");

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

});

