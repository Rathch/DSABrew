import { inferFontTraits, sanitizePdfText } from "./pdf-accessibility-tree";
import { rectToPdfMm, pxToPt } from "./pdf-rect";
import { isAllowedLinkHref } from "./pdf-lib-writer";

export interface ExportPdfOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

export function inferFontStyle(el: HTMLElement): "normal" | "bold" | "italic" | "bolditalic" {
  const { bold, italic } = inferFontTraits(el);
  if (bold && italic) {
    return "bolditalic";
  }
  if (bold) {
    return "bold";
  }
  if (italic) {
    return "italic";
  }
  return "normal";
}

export function slugifyForFilename(title: string): string {
  const slug = title
    .trim()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug;
}

export function defaultPdfFilename(title?: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const date = `${y}-${m}-${day}`;
  const slug = title?.trim() ? slugifyForFilename(title) : "";
  if (slug) {
    return `dsabrew-${slug}-${date}.pdf`;
  }
  return `dsabrew-${date}.pdf`;
}

export function buildAnchorToPageMap(pages: NodeListOf<HTMLElement>): Map<string, number> {
  const map = new Map<string, number>();
  pages.forEach((page, idx) => {
    const n = idx + 1;
    page.querySelectorAll<HTMLElement>("[id]").forEach((node) => {
      const id = node.getAttribute("id");
      if (id) {
        map.set(id, n);
      }
    });
  });
  return map;
}

export { isAllowedLinkHref, pxToPt, rectToPdfMm, sanitizePdfText };