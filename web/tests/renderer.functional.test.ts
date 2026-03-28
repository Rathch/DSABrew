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

  it("splits pages for {{page}} alias", () => {
    const result = renderDocument("# A\n\n{{page}}\n\n# B");
    expect(result.pages.length).toBe(2);
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

  it("renders easier macro with dsa-diff and bundled icon", () => {
    const md = "{{easier |\n*Hinweis:* Text.\n}}";
    const html = renderDocument(md).pages[0].renderedHtml;
    expect(html).toContain("dsa-diff--easier");
    expect(html).toContain("dsa-diff__icon");
    expect(html).not.toContain("{{easier");
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

