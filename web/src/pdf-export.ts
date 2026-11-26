/**
 * Export the preview as a downloadable PDF/UA tagged PDF (one A4 page per `.a4-page`).
 *
 * - **Visible:** raster from html2canvas (Artifact in structure tree).
 * - **Accessible:** StructTreeRoot + MCID-marked invisible text and link annotations.
 * - **Language:** de-DE; embedded Gentium Book Plus for tagged text.
 */

import {
  buildDocumentAccessibilityModel,
  buildPageAccessibilityTree
} from "./pdf-accessibility-tree";
import {
  buildTaggedPdfBytes,
  isAllowedLinkHref,
  type AnchorDest,
  type LinkInput,
  type PageRasterInput
} from "./pdf-lib-writer";
import { letterboxImageMm, type ImgBoxMm, type RectMm } from "./pdf-rect";

export type { ExportPdfOptions } from "./pdf-export-api";
export {
  buildAnchorToPageMap,
  defaultPdfFilename,
  inferFontStyle,
  isAllowedLinkHref,
  pxToPt,
  rectToPdfMm,
  sanitizePdfText,
  slugifyForFilename
} from "./pdf-export-api";

import type { ExportPdfOptions } from "./pdf-export-api";
import { defaultPdfFilename } from "./pdf-export-api";

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("PNG-Erzeugung aus der Seitenvorschau fehlgeschlagen.");
  }
  return new Uint8Array(await blob.arrayBuffer());
}

function resetPageZoomForCapture(pageEl: HTMLElement): () => void {
  const prevInline = pageEl.style.zoom;
  pageEl.style.zoom = "1";
  const preview = pageEl.closest<HTMLElement>(".preview");
  const prevPreviewZoom = preview?.style.zoom ?? "";
  if (preview) {
    preview.style.zoom = "1";
  }
  return () => {
    pageEl.style.zoom = prevInline;
    if (preview) {
      preview.style.zoom = prevPreviewZoom;
    }
  };
}

interface RelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PendingLink {
  href: string;
  rel: RelBox;
}

interface PendingAnchor {
  id: string;
  relTop: number;
}

/** Element box as a fraction of the page. Captured while preview zoom is 1. */
function relativeBox(elRect: DOMRect, pageRect: DOMRect): RelBox | null {
  const pw = pageRect.width;
  const ph = pageRect.height;
  if (pw <= 0 || ph <= 0 || elRect.width < 1 || elRect.height < 1) {
    return null;
  }
  return {
    x: (elRect.left - pageRect.left) / pw,
    y: (elRect.top - pageRect.top) / ph,
    w: elRect.width / pw,
    h: elRect.height / ph
  };
}

function relToMm(rel: RelBox, box: ImgBoxMm): RectMm {
  return {
    x: box.x + rel.x * box.w,
    y: box.y + rel.y * box.h,
    w: rel.w * box.w,
    h: rel.h * box.h
  };
}

function snapshotPageLinks(pageEl: HTMLElement, pageRect: DOMRect): PendingLink[] {
  const links: PendingLink[] = [];
  pageEl.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || !isAllowedLinkHref(href)) {
      return;
    }
    const rel = relativeBox(a.getBoundingClientRect(), pageRect);
    if (!rel) {
      return;
    }
    links.push({ href, rel });
  });
  return links;
}

function snapshotPageAnchors(pageEl: HTMLElement, pageRect: DOMRect): PendingAnchor[] {
  const anchors: PendingAnchor[] = [];
  if (pageRect.height <= 0) {
    return anchors;
  }
  pageEl.querySelectorAll<HTMLElement>("[id]").forEach((node) => {
    const id = node.getAttribute("id");
    if (!id) {
      return;
    }
    const er = node.getBoundingClientRect();
    anchors.push({ id, relTop: (er.top - pageRect.top) / pageRect.height });
  });
  return anchors;
}

function linksFromSnapshot(
  pending: PendingLink[],
  pageIndex: number,
  box: ImgBoxMm
): LinkInput[] {
  const links: LinkInput[] = [];
  for (const item of pending) {
    const r = relToMm(item.rel, box);
    if (r.w < 0.2 || r.h < 0.2) {
      continue;
    }
    links.push({ href: item.href, rectMm: r, pageIndex });
  }
  return links;
}

function triggerPdfDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
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

  const { default: html2canvas } = await import("html2canvas");

  const scale = pages.length > 80 ? 1.5 : 2;
  const anchorDests = new Map<string, AnchorDest>();
  const rasters: PageRasterInput[] = [];
  const pageTrees: ReturnType<typeof buildPageAccessibilityTree>[] = [];
  const allLinks: LinkInput[] = [];

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    options?.onProgress?.(i + 1, pages.length);

    el.scrollIntoView({ block: "nearest", behavior: "auto" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const restoreZoom = resetPageZoomForCapture(el);
    const pageRect = el.getBoundingClientRect();
    // Preview CSS zoom scales getBoundingClientRect. Measure while zoom is 1,
    // otherwise link hotspots and section destinations miss the painted text.
    const pendingLinks = snapshotPageLinks(el, pageRect);
    const pendingAnchors = snapshotPageAnchors(el, pageRect);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll<HTMLElement>(".a4-page").forEach((page) => {
            page.style.zoom = "1";
          });
          clonedDoc.querySelectorAll<HTMLElement>(".preview").forEach((preview) => {
            preview.style.zoom = "1";
          });
        }
      });
    } finally {
      restoreZoom();
    }

    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error(`Seite ${i + 1}: Raster leer (${canvas.width}×${canvas.height}).`);
    }

    const box = letterboxImageMm(canvas.width, canvas.height);
    for (const anchor of pendingAnchors) {
      anchorDests.set(anchor.id, { page: i + 1, topMm: box.y + anchor.relTop * box.h });
    }
    pageTrees.push(buildPageAccessibilityTree(el, i, box));
    allLinks.push(...linksFromSnapshot(pendingLinks, i, box));

    rasters.push({
      pngBytes: await canvasToPngBytes(canvas),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
  }

  const model = buildDocumentAccessibilityModel(pages, pageTrees);

  const pdfBytes = await buildTaggedPdfBytes(model, rasters, allLinks, anchorDests);

  let name = options?.filename?.trim() || defaultPdfFilename(model.metadata.title);
  if (!name.toLowerCase().endsWith(".pdf")) {
    name += ".pdf";
  }
  triggerPdfDownload(pdfBytes, name);
}
