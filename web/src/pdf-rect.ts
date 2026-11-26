/** A4 dimensions and coordinate helpers for PDF export (mm ↔ pt). */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MM_TO_PT = 72 / 25.4;

export interface ImgBoxMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RectMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RectPt {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

export function pxToPt(px: number): number {
  return (px * 72) / 96;
}

/** DOM rect relative to the page → mm in the image frame (letterbox). */
export function rectToPdfMm(
  elRect: DOMRect,
  pageRect: DOMRect,
  box: ImgBoxMm
): RectMm {
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

/**
 * PDF destination Y (pt, bottom-left origin) so an internal link opens with `topMm`
 * (distance from the top of the A4 page) at the top of the viewport.
 */
export function anchorDestTopPt(topMm: number): number {
  const clamped = Math.min(Math.max(topMm, 0), A4_HEIGHT_MM);
  return mmToPt(A4_HEIGHT_MM - clamped);
}

/** Top-down mm rect (jsPDF-style) → PDF pt rect (bottom-left origin). */
export function rectMmToPt(rect: RectMm): RectPt {
  const pageHPt = mmToPt(A4_HEIGHT_MM);
  return {
    x: mmToPt(rect.x),
    y: pageHPt - mmToPt(rect.y + rect.h),
    w: mmToPt(rect.w),
    h: mmToPt(rect.h)
  };
}

/** Letterbox raster image on A4 (returns mm box). */
export function letterboxImageMm(canvasW: number, canvasH: number): ImgBoxMm {
  const pageW = A4_WIDTH_MM;
  const pageH = A4_HEIGHT_MM;
  const ratio = canvasW / canvasH;
  const pageRatio = pageW / pageH;
  let imgW = pageW;
  let imgH = pageH;
  if (ratio > pageRatio) {
    imgH = pageW / ratio;
  } else {
    imgW = pageH * ratio;
  }
  return {
    x: (pageW - imgW) / 2,
    y: (pageH - imgH) / 2,
    w: imgW,
    h: imgH
  };
}
