import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import { applyHeadingAnchorPlugin } from "../src/markdown-heading-anchor";

function slugForDemo(plain: string): string {
  return plain
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

describe("applyHeadingAnchorPlugin", () => {
  it("assigns ids to headings and deduplicates slugs", () => {
    const md = new MarkdownIt({ html: false });
    applyHeadingAnchorPlugin(md, slugForDemo);
    const html = md.render("# Hallo\n\n# Hallo\n\n## Unter\n");
    expect(html).toContain('id="hallo"');
    expect(html).toContain('id="hallo-2"');
    expect(html).toContain('id="unter"');
  });

  it("uses -3 when the same slug appears three times", () => {
    const md = new MarkdownIt({ html: false });
    applyHeadingAnchorPlugin(md, slugForDemo);
    const html = md.render("# Dup\n\n# Dup\n\n# Dup\n");
    expect(html).toContain('id="dup"');
    expect(html).toContain('id="dup-2"');
    expect(html).toContain('id="dup-3"');
  });
});
