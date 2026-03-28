import { describe, expect, it } from "vitest";
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
});

