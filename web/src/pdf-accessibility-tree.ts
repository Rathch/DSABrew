import type { PdfStructRole } from "./pdf-role-map";
import { headingRoleFromTag, isDecorativeElement } from "./pdf-role-map";
import type { RectMm } from "./pdf-rect";
import { rectToPdfMm } from "./pdf-rect";
import { extractDocumentTitle, extractPdfMetadata, type PdfExportMetadata } from "./pdf-metadata";

export { extractDocumentTitle };
export type { PdfExportMetadata };

export function sanitizePdfText(s: string): string {
  return s.replace(/\0/g, "").replace(/\r/g, "").trim();
}

export interface PdfStructNode {
  role: PdfStructRole;
  text?: string;
  alt?: string;
  href?: string;
  rect?: RectMm;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  children: PdfStructNode[];
}

export interface PageAccessibilityTree {
  pageIndex: number;
  nodes: PdfStructNode[];
}

export interface DocumentAccessibilityModel {
  title: string;
  metadata: PdfExportMetadata;
  pages: PageAccessibilityTree[];
}

export function inferFontTraits(el: HTMLElement): { bold: boolean; italic: boolean } {
  const cs = getComputedStyle(el);
  const w = cs.fontWeight;
  const bold = w === "bold" || Number.parseInt(w, 10) >= 600;
  const italic = cs.fontStyle === "italic";
  return { bold, italic };
}

function fontSizePtFor(el: HTMLElement): number {
  const px = parseFloat(getComputedStyle(el).fontSize) || 10;
  return (px * 72) / 96;
}

function measureRect(el: HTMLElement, pageEl: HTMLElement, box: RectMm): RectMm | undefined {
  const pageRect = pageEl.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  if (er.width < 1 || er.height < 1) {
    return undefined;
  }
  const r = rectToPdfMm(er, pageRect, box);
  if (r.w < 0.2 || r.h < 0.2) {
    return undefined;
  }
  return r;
}

function textNode(
  role: PdfStructRole,
  el: HTMLElement,
  pageEl: HTMLElement,
  box: RectMm,
  text?: string
): PdfStructNode | null {
  const t = sanitizePdfText(text ?? el.textContent ?? "");
  if (!t) {
    return null;
  }
  const rect = measureRect(el, pageEl, box);
  if (!rect) {
    return null;
  }
  const style = inferFontTraits(el);
  return {
    role,
    text: t,
    rect,
    fontSizePt: fontSizePtFor(el),
    bold: style.bold,
    italic: style.italic,
    children: []
  };
}

function linkNode(a: HTMLAnchorElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const href = a.getAttribute("href");
  if (!href) {
    return null;
  }
  const t = sanitizePdfText(a.textContent ?? "");
  if (!t) {
    return null;
  }
  const rect = measureRect(a, pageEl, box);
  if (!rect) {
    return null;
  }
  const style = inferFontTraits(a);
  return {
    role: "Link",
    text: t,
    href,
    rect,
    fontSizePt: fontSizePtFor(a),
    bold: style.bold,
    italic: style.italic,
    children: []
  };
}

function buildList(
  listEl: HTMLOListElement | HTMLUListElement,
  pageEl: HTMLElement,
  box: RectMm
): PdfStructNode | null {
  const items: PdfStructNode[] = [];
  listEl.querySelectorAll(":scope > li").forEach((li) => {
    const link = li.querySelector<HTMLAnchorElement>(":scope > a[href], :scope > .toc-line");
    if (link) {
      const ln = linkNode(link, pageEl, box);
      if (ln) {
        items.push({ role: "LI", children: [ln] });
        return;
      }
    }
    const nestedP = li.querySelector(":scope > p");
    const bodyEl = (nestedP ?? li) as HTMLElement;
    const p = textNode("P", bodyEl, pageEl, box);
    if (p) {
      items.push({ role: "LI", children: [p] });
    }
  });
  if (items.length === 0) {
    return null;
  }
  return { role: "L", children: items };
}

function buildTable(table: HTMLTableElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const rows: PdfStructNode[] = [];
  table.querySelectorAll("tr").forEach((tr) => {
    const cells: PdfStructNode[] = [];
    tr.querySelectorAll<HTMLTableCellElement>("th, td").forEach((cell) => {
      const role: PdfStructRole = cell.tagName === "TH" ? "TH" : "TD";
      const n = textNode(role, cell, pageEl, box);
      if (n) {
        cells.push(n);
      }
    });
    if (cells.length > 0) {
      rows.push({ role: "TR", children: cells });
    }
  });
  if (rows.length === 0) {
    return null;
  }
  return { role: "Table", children: rows };
}

function buildToc(nav: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const children: PdfStructNode[] = [];
  const heading = nav.querySelector<HTMLElement>(".toc-heading");
  if (heading) {
    const h = textNode("H2", heading, pageEl, box);
    if (h) {
      children.push(h);
    }
  }
  const empty = nav.querySelector<HTMLElement>(".toc-empty");
  if (empty) {
    const p = textNode("P", empty, pageEl, box);
    if (p) {
      children.push(p);
    }
  }
  nav.querySelectorAll<HTMLOListElement | HTMLUListElement>("ol.toc-list").forEach((list) => {
    const l = buildList(list, pageEl, box);
    if (l) {
      children.push(l);
    }
  });
  if (children.length === 0) {
    return null;
  }
  return { role: "TOC", children };
}

function buildNoteBlock(aside: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const label =
    aside.getAttribute("aria-label") ??
    aside.querySelector<HTMLElement>(".dsa-note__title, .dsa-roulbox__title, .dsa-npc__name")?.textContent ??
    "Hinweis";
  const children: PdfStructNode[] = [];
  const titleEl = aside.querySelector<HTMLElement>(
    ".dsa-note__title, .dsa-roulbox__title, .dsa-npc__name, .impressum-disclaimer-heading"
  );
  if (titleEl) {
    const role = headingRoleFromTag(titleEl.tagName) ?? "H3";
    const h = textNode(role, titleEl, pageEl, box);
    if (h) {
      children.push(h);
    }
  }
  aside
    .querySelectorAll<HTMLElement>(
      ".dsa-note__body p, .dsa-roulbox__body p, .dsa-diff__body p, .dsa-npc__line, .dsa-npc__meta, .impressum-disclaimer-text, .impressum-field-value"
    )
    .forEach((p) => {
      const n = textNode("P", p, pageEl, box);
      if (n) {
        children.push(n);
      }
    });
  if (children.length === 0) {
    const fallback = textNode("P", aside, pageEl, box, sanitizePdfText(label));
    if (fallback) {
      children.push(fallback);
    }
  }
  if (children.length === 0) {
    return null;
  }
  return { role: "Note", alt: sanitizePdfText(label), children };
}

function buildNpcBlock(section: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const name = section.getAttribute("aria-label")?.replace(/^NSC \/ Monster\s*/i, "") ?? "";
  const children: PdfStructNode[] = [];
  const nameEl = section.querySelector<HTMLElement>(".dsa-npc__name");
  if (nameEl) {
    const h = textNode("H3", nameEl, pageEl, box);
    if (h) {
      children.push(h);
    }
  }
  const portrait = section.querySelector<HTMLImageElement>(".dsa-npc__portrait-img:not(.dsa-npc__portrait-img--dummy)");
  if (portrait) {
    const alt = sanitizePdfText(portrait.getAttribute("alt") ?? name);
    const rect = measureRect(portrait, pageEl, box);
    if (rect && alt) {
      children.push({ role: "Figure", alt, rect, children: [] });
    }
  }
  section
    .querySelectorAll<HTMLElement>(
      ".dsa-npc__meta, .dsa-npc__line, .dsa-npc__stat-cell:not(.dsa-npc__stat-cell--empty)"
    )
    .forEach((el) => {
      const n = textNode("P", el, pageEl, box);
      if (n) {
        children.push(n);
      }
    });
  if (children.length === 0) {
    return null;
  }
  return { role: "Sect", alt: name || undefined, children };
}

function buildFigure(el: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  const alt = el.getAttribute("aria-label") ?? el.querySelector("img")?.getAttribute("alt") ?? "";
  const label = sanitizePdfText(alt);
  if (!label) {
    return null;
  }
  const rect = measureRect(el, pageEl, box);
  if (!rect) {
    return null;
  }
  return { role: "Figure", alt: label, rect, children: [] };
}

function buildImpressum(root: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode[] {
  const nodes: PdfStructNode[] = [];
  root.querySelectorAll<HTMLElement>(".impressum-main-title, .impressum-project-title").forEach((el) => {
    const role = el.classList.contains("impressum-main-title") ? "H1" : "P";
    const n = textNode(role, el, pageEl, box);
    if (n) {
      nodes.push(n);
    }
  });
  root.querySelectorAll<HTMLElement>(".impressum-field").forEach((field) => {
    const label = field.querySelector(".impressum-field-label");
    const value = field.querySelector(".impressum-field-value");
    if (label && value) {
      const lbl = textNode("Lbl", label as HTMLElement, pageEl, box);
      const val = textNode("P", value as HTMLElement, pageEl, box);
      if (lbl && val) {
        nodes.push({ role: "Sect", children: [lbl, val] });
      }
    }
  });
  const disclaimer = root.querySelector<HTMLElement>(".impressum-disclaimer");
  if (disclaimer) {
    const note = buildNoteBlock(disclaimer, pageEl, box);
    if (note) {
      nodes.push(note);
    }
  }
  return nodes;
}

const BLOCK_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "nav.toc",
  "table.dsa-md-table",
  "aside.warnings",
  "footer.footnotes",
  "aside.dsa-note",
  "aside.dsa-roulbox",
  "aside.dsa-diff",
  "div.dsa-npc-wrap",
  "section.dsa-npc",
  "div.impressum-sheet",
  ".dsa-chess",
  ".dsa-difficulty-rating",
  ".book-footer-strip",
  ".page-number",
  "ol",
  "ul"
].join(", ");

function isInsideHandledBlock(el: Element, pageBody: HTMLElement): boolean {
  const handled = el.closest(
    "nav.toc, table.dsa-md-table, aside.warnings, footer.footnotes, aside.dsa-note, aside.dsa-roulbox, aside.dsa-diff, section.dsa-npc, div.impressum-sheet, .dsa-chess, .dsa-difficulty-rating, .book-footer-strip"
  );
  return handled != null && handled !== el && pageBody.contains(handled);
}

/** Sort blocks for two-column CSS layout: left column top-to-bottom, then right column. */
export function sortByColumnFlow(elements: HTMLElement[], columnRoot: HTMLElement): HTMLElement[] {
  if (elements.length < 2) {
    return elements;
  }
  const pageRect = columnRoot.getBoundingClientRect();
  const midX = pageRect.left + pageRect.width / 2;
  const left: HTMLElement[] = [];
  const right: HTMLElement[] = [];
  for (const el of elements) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    if (cx < midX) {
      left.push(el);
    } else {
      right.push(el);
    }
  }
  const byTop = (a: HTMLElement, b: HTMLElement) =>
    a.getBoundingClientRect().top - b.getBoundingClientRect().top;
  left.sort(byTop);
  right.sort(byTop);
  return [...left, ...right];
}

function buildBlockNode(el: HTMLElement, pageEl: HTMLElement, box: RectMm): PdfStructNode | null {
  if (isDecorativeElement(el)) {
    return null;
  }
  if (el.matches("nav.toc")) {
    return buildToc(el, pageEl, box);
  }
  if (el.matches("table.dsa-md-table")) {
    return buildTable(el as HTMLTableElement, pageEl, box);
  }
  if (el.matches("aside.warnings, footer.footnotes")) {
    const children: PdfStructNode[] = [];
    el.querySelectorAll<HTMLElement>("p").forEach((p) => {
      const n = textNode(el.matches("footer.footnotes") ? "Note" : "P", p, pageEl, box);
      if (n) {
        if (el.matches("footer.footnotes")) {
          children.push({ role: "Note", children: [n] });
        } else {
          children.push(n);
        }
      }
    });
    return children.length > 0 ? { role: "Sect", children } : null;
  }
  if (el.matches("aside.dsa-note, aside.dsa-roulbox, aside.dsa-diff, div.dsa-gm-frame")) {
    return buildNoteBlock(el, pageEl, box);
  }
  if (el.matches("section.dsa-npc, div.dsa-npc-wrap")) {
    const section = el.matches("section.dsa-npc") ? el : el.querySelector<HTMLElement>("section.dsa-npc");
    return section ? buildNpcBlock(section, pageEl, box) : null;
  }
  if (el.matches("div.impressum-sheet")) {
    const kids = buildImpressum(el, pageEl, box);
    return kids.length > 0 ? { role: "Sect", children: kids } : null;
  }
  if (el.matches(".dsa-chess, .dsa-difficulty-rating")) {
    return buildFigure(el, pageEl, box);
  }
  if (el.matches(".book-footer-strip")) {
    const title = el.querySelector<HTMLElement>(".book-footer-title");
    const num = el.querySelector<HTMLElement>(".book-footer-num");
    const children: PdfStructNode[] = [];
    if (num) {
      const n = textNode("P", num, pageEl, box);
      if (n) {
        children.push(n);
      }
    }
    if (title) {
      const n = textNode("P", title, pageEl, box);
      if (n) {
        children.push(n);
      }
    }
    return children.length > 0 ? { role: "Sect", children } : null;
  }
  if (el.matches(".page-number")) {
    return textNode("P", el, pageEl, box);
  }
  const heading = headingRoleFromTag(el.tagName);
  if (heading) {
    return textNode(heading, el, pageEl, box);
  }
  if (el.matches("p")) {
    if (el.closest("aside, footer.footnotes, .dsa-note__body, .dsa-roulbox__body, .impressum-disclaimer")) {
      return null;
    }
    return textNode("P", el, pageEl, box);
  }
  if (el.matches("ol, ul")) {
    if (el.closest("nav.toc")) {
      return null;
    }
    return buildList(el as HTMLOListElement, pageEl, box);
  }
  return null;
}

export function buildPageAccessibilityTree(
  pageEl: HTMLElement,
  pageIndex: number,
  box: RectMm
): PageAccessibilityTree {
  const pageBody = pageEl.querySelector<HTMLElement>(".page-body") ?? pageEl;
  const blocks = Array.from(pageBody.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter(
    (el) => !isDecorativeElement(el) && !isInsideHandledBlock(el, pageBody)
  );
  const ordered = sortByColumnFlow(blocks, pageBody);
  const nodes: PdfStructNode[] = [];
  for (const el of ordered) {
    const n = buildBlockNode(el, pageEl, box);
    if (n) {
      nodes.push(n);
    }
  }
  return { pageIndex, nodes };
}

export function buildDocumentAccessibilityModel(
  pages: NodeListOf<HTMLElement>,
  pageTrees: PageAccessibilityTree[]
): DocumentAccessibilityModel {
  const metadata = extractPdfMetadata(pages);
  return {
    title: metadata.title,
    metadata,
    pages: pageTrees
  };
}

/** Flatten nodes that carry text or figures with MCID targets (depth-first per page). */
export function collectMcidTargets(nodes: PdfStructNode[]): PdfStructNode[] {
  const out: PdfStructNode[] = [];
  const walk = (list: PdfStructNode[]): void => {
    for (const n of list) {
      if (n.rect && (n.text || n.role === "Figure")) {
        out.push(n);
      }
      if (n.children.length > 0) {
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return out;
}
