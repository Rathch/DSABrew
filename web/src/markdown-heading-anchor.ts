import type MarkdownIt from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";

/**
 * Sets `id` on `heading_open` tokens (after the inline pass), similar to markdown-it-anchor.
 * Duplicate slugs on the same page: `-2`, `-3`, …
 */
export function applyHeadingAnchorPlugin(
  md: MarkdownIt,
  slugForHeading: (plainText: string) => string
): void {
  md.core.ruler.after("inline", "dsabrew_heading_anchor", (state: StateCore) => {
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
