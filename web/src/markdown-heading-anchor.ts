import type MarkdownIt from "markdown-it";

/**
 * Setzt `id` auf `heading_open`-Tokens (nach dem Inline-Pass), analog zu markdown-it-anchor.
 * Doppelte Slugs auf derselben Seite: `-2`, `-3`, …
 */
export function applyHeadingAnchorPlugin(
  md: MarkdownIt,
  slugForHeading: (plainText: string) => string
): void {
  md.core.ruler.after("inline", "dsabrew_heading_anchor", (state) => {
    const used = new Set<string>();
    for (let i = 0; i < state.tokens.length; i++) {
      const t = state.tokens[i];
      if (t.type !== "heading_open") {
        continue;
      }
      const inline = state.tokens[i + 1];
      const text = inline?.type === "inline" ? inline.content : "";
      let base = slugForHeading(text);
      let id = base;
      if (used.has(id)) {
        let n = 2;
        while (used.has(`${base}-${n}`)) {
          n += 1;
        }
        id = `${base}-${n}`;
      }
      used.add(id);
      t.attrSet("id", id);
    }
  });
}
