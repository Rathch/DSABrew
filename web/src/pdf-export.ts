/**
 * Export the preview as a downloadable PDF (one A4 page per `.a4-page`).
 *
 * - **Visible:** raster from html2canvas (same as the preview).
 * - **Invisible on top:** real PDF text (`renderingMode: "invisible"`) → selectable/searchable.
 * - **Links:** PDF link annotations (`#…` → internal page, `http(s):` → URL).
 *
 * Not a full PDF/UA tagged structure tree (would need pdf-lib + marked content);
 * language is set via `setLanguage("de")`.
 */

import type { jsPDF } from "jspdf";

export interface ExportPdfOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

export function defaultPdfFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `dsabrew-${y}-${m}-${day}.pdf`;
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

interface ImgBoxMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** DOM rect relative to the page → mm in the image frame (letterbox). */
export function rectToPdfMm(
  elRect: DOMRect,
  pageRect: DOMRect,
  box: ImgBoxMm
): { x: number; y: number; w: number; h: number } {
  const relL = elRect.left - pageRect.left;
  const relT = elRect.top - pageRect.top;
  const pw = pageRect.width;
  const ph = pageRect.height;
  if (pw <= 0 || ph <= 0) {
    return { x: box.x, y: box.y, w: 0, h: 0 };
  }
  return {
    x: box.x + (relL / pw) * box.w,
    y: box.y + (relT / ph) * box.h,
    w: (elRect.width / pw) * box.w,
    h: (elRect.height / ph) * box.h
  };
}

export function sanitizePdfText(s: string): string {
  return s.replace(/\0/g, "").replace(/\r/g, "").trim();
}

export function isAllowedLinkHref(href: string): boolean {
  const t = href.trim().toLowerCase();
  if (t.startsWith("javascript:") || t.startsWith("data:")) {
    return false;
  }
  return true;
}

export function pxToPt(px: number): number {
  return (px * 72) / 96;
}

function drawInvisibleTextInRect(
  pdf: jsPDF,
  rawText: string,
  r: { x: number; y: number; w: number; h: number },
  fontPt: number,
  fontStyle: "normal" | "bold" | "italic" | "bolditalic"
): void {
  const text = sanitizePdfText(rawText);
  if (!text || r.w < 0.5 || r.h < 0.5) {
    return;
  }

  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(Math.min(Math.max(fontPt, 5), 28));

  const lineH = pdf.getLineHeight() / pdf.internal.scaleFactor;
  const lines = pdf.splitTextToSize(text, Math.max(r.w - 0.5, 1)).filter((ln: string) => ln.trim().length > 0);
  let y = r.y + 0.5;
  const bottom = r.y + r.h;
  for (const line of lines) {
    // Do not require the full jsPDF line height to fit the measured box:
    // For headings, getBoundingClientRect().height is often tighter than activeFontSize×1.15
    // (subpixels, font metrics) — otherwise no text is drawn and nothing is selectable.
    if (y >= bottom - 0.15) {
      break;
    }
    pdf.text(line, r.x + 0.25, y, {
      baseline: "top",
      renderingMode: "invisible"
    });
    y += lineH * 1.08;
  }
}

export function inferFontStyle(el: HTMLElement): "normal" | "bold" | "italic" | "bolditalic" {
  const cs = getComputedStyle(el);
  const w = cs.fontWeight;
  const bold = w === "bold" || Number.parseInt(w, 10) >= 600;
  const italic = cs.fontStyle === "italic";
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

const TEXT_BLOCK_SELECTOR = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "td",
  "th",
  "li",
  ".toc-heading",
  ".warnings p",
  ".footnotes p",
  ".dsa-note__title",
  ".dsa-roulbox__title",
  ".dsa-roulbox__subtitle",
  ".dsa-npc__name",
  ".impressum-main-title",
  ".impressum-disclaimer-heading",
  ".book-footer-title",
  ".page-number"
].join(", ");

function overlayLinksAndInvisibleText(
  pdf: jsPDF,
  pageEl: HTMLElement,
  pageRect: DOMRect,
  box: ImgBoxMm,
  anchorToPage: Map<string, number>
): void {
  pageEl.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || !isAllowedLinkHref(href)) {
      return;
    }
    const ar = a.getBoundingClientRect();
    if (ar.width < 1 || ar.height < 1) {
      return;
    }
    const r = rectToPdfMm(ar, pageRect, box);
    if (r.w < 0.2 || r.h < 0.2) {
      return;
    }

    const trimmed = href.trim();
    if (trimmed.startsWith("#")) {
      const id = decodeURIComponent(trimmed.slice(1));
      const target = anchorToPage.get(id);
      if (target != null) {
        pdf.link(r.x, r.y, r.w, r.h, { pageNumber: target });
      }
    } else if (/^https?:\/\//i.test(trimmed)) {
      pdf.link(r.x, r.y, r.w, r.h, { url: trimmed });
    }

    const fs = pxToPt(parseFloat(getComputedStyle(a).fontSize) || 10);
    drawInvisibleTextInRect(pdf, a.textContent || "", r, fs, inferFontStyle(a));
  });

  pageEl.querySelectorAll<HTMLElement>(TEXT_BLOCK_SELECTOR).forEach((el) => {
    if (el.closest("a")) {
      return;
    }
    if (el.tagName === "LI" && el.querySelector("p")) {
      return;
    }
    const t = sanitizePdfText(el.textContent || "");
    if (!t) {
      return;
    }
    const er = el.getBoundingClientRect();
    if (er.width < 1 || er.height < 1) {
      return;
    }
    const r = rectToPdfMm(er, pageRect, box);
    if (r.w < 0.5 || r.h < 0.5) {
      return;
    }
    const fs = pxToPt(parseFloat(getComputedStyle(el).fontSize) || 10);
    drawInvisibleTextInRect(pdf, t, r, fs, inferFontStyle(el));
  });
}

/**
 * @throws Error if there are no `.a4-page` elements
 */
export async function exportPreviewToPdf(
  previewRoot: HTMLElement,
  options?: ExportPdfOptions
): Promise<void> {
  const pages = previewRoot.querySelectorAll<HTMLElement>(".a4-page");
  if (pages.length === 0) {
    throw new Error("Keine Seiten in der Vorschau — nichts zu exportieren.");
  }

  await document.fonts.ready;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf")
  ]);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  try {
    pdf.setLanguage("de");
  } catch {
    /* older jsPDF builds */
  }
  pdf.setProperties({
    title: "DSABrew Export",
    creator: "DSABrew",
    subject: "Markdown → DSA-Layout"
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const scale = 2;
  const anchorToPage = buildAnchorToPageMap(pages);

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    options?.onProgress?.(i + 1, pages.length);

    el.scrollIntoView({ block: "nearest", behavior: "auto" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const pageRect = el.getBoundingClientRect();

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000
    });

    const imgData = canvas.toDataURL("image/png");
    if (i > 0) {
      pdf.addPage();
    }

    const ratio = canvas.width / canvas.height;
    const pageRatio = pageW / pageH;
    let imgW = pageW;
    let imgH = pageH;
    if (ratio > pageRatio) {
      imgH = pageW / ratio;
    } else {
      imgW = pageH * ratio;
    }
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgW, imgH, undefined, "FAST");

    overlayLinksAndInvisibleText(pdf, el, pageRect, { x, y, w: imgW, h: imgH }, anchorToPage);
  }

  let name = options?.filename?.trim() || defaultPdfFilename();
  if (!name.toLowerCase().endsWith(".pdf")) {
    name += ".pdf";
  }
  pdf.save(name);
}
