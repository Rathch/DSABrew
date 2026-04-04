import * as shared from "../../shared/default-markdown-demo.js";

/** tsx/Node kann benannte oder Default-Exporte als verschachteltes Objekt liefern — bis zu einem String auflösen. */
function unwrapToString(x: unknown): string {
  if (typeof x === "string") {
    return x;
  }
  if (x && typeof x === "object") {
    if ("DEFAULT_MARKDOWN_DEMO" in x) {
      return unwrapToString((x as { DEFAULT_MARKDOWN_DEMO: unknown }).DEFAULT_MARKDOWN_DEMO);
    }
    if ("default" in x) {
      return unwrapToString((x as { default: unknown }).default);
    }
  }
  throw new Error(
    "shared/default-markdown-demo: kein String-Export ermittelbar (tsx/ESM-Interop)"
  );
}

/** Kanonischer Demo-Markdown (gleicher Inhalt wie im Web). */
export function getSharedDefaultMarkdown(): string {
  return unwrapToString(shared.DEFAULT_MARKDOWN_DEMO ?? shared.default);
}
