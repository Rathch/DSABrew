import { describe, expect, it } from "vitest";
import { renderDocument } from "../src/renderer";

describe("renderer security", () => {
  it("does not render raw script tags as executable HTML", () => {
    const result = renderDocument("<script>alert(1)</script>");
    const html = result.pages[0].renderedHtml;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("does not render raw event-handler HTML as HTML", () => {
    const result = renderDocument("<img src=x onerror=alert(1)>");
    const html = result.pages[0].renderedHtml;
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("blocks javascript links", () => {
    const result = renderDocument("[x](javascript:alert(1))");
    const html = result.pages[0].renderedHtml;
    expect(html).not.toContain('href="javascript:alert(1)"');
  });

  it("warns on unknown and malformed background macros", () => {
    const unknown = renderDocument("\\map{does-not-exist}");
    expect(unknown.pages[0].warnings.some((w) => w.includes("Unknown map key"))).toBe(true);

    const malformed = renderDocument("\\map{broken");
    expect(malformed.pages[0].warnings.some((w) => w.includes("Malformed macro"))).toBe(true);
  });
});
