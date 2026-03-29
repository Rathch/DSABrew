/**
 * Seiten-Streifen im Editor und in der Minimap: Zeile für Zeile im Rohtext zählen,
 * bis zu einer eigenen Zeile mit \\page / \\pageSingle (oder {{page}} / {{pageSingle}}).
 * Zeilenhöhe = berechnete line-height der Textarea (fix pro Zeile), dann auf scrollHeight skaliert.
 */

const PAGE_OR_SINGLE_BREAK = /(?:^|\n)\s*\\page(Single)?\s*\n/g;
const PAGE_ALIAS = /\{\{page\}\}/g;
const PAGE_SINGLE_ALIAS = /\{\{\s*pageSingle\s*\}\}/gi;

const RE_PAGE_CMD = /^\s*\\page(?:Single)?\s*$/;
const RE_PAGE_MACRO = /^\s*\{\{page\}\}\s*$/;
const RE_PAGE_SINGLE_MACRO = /^\s*\{\{\s*pageSingle\s*\}\}\s*$/i;

function normalizePageMacros(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(PAGE_ALIAS, "\n\\page\n")
    .replace(PAGE_SINGLE_ALIAS, "\n\\pageSingle\n");
}

/** Rohtext je „Seite“ (Renderer / Kompatibilität). */
export function splitMarkdownPageChunks(raw: string): string[] {
  const normalized = normalizePageMacros(raw);
  const chunks: string[] = [];
  PAGE_OR_SINGLE_BREAK.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = PAGE_OR_SINGLE_BREAK.exec(normalized)) !== null) {
    chunks.push(normalized.slice(last, m.index));
    last = PAGE_OR_SINGLE_BREAK.lastIndex;
  }
  chunks.push(normalized.slice(last));
  PAGE_OR_SINGLE_BREAK.lastIndex = 0;
  return chunks;
}

/** Eine Zeile im Editor, die einen Seitenwechsel markiert (ohne weiteren Text). */
export function isPageBreakLine(line: string): boolean {
  return RE_PAGE_CMD.test(line) || RE_PAGE_MACRO.test(line) || RE_PAGE_SINGLE_MACRO.test(line);
}

/**
 * Seiten als zusammenhängende Zeilenbereiche (0-basierter Index, inkl. Endindex),
 * getrennt durch Seitenumbruch-Zeilen — diese Zeilen gehören zu keinem Segment.
 */
export function pageSegmentsZeroBased(raw: string): { start: number; end: number }[] {
  const lines = raw.split(/\r\n|\r|\n/);
  if (lines.length === 0) {
    return [];
  }
  const segments: { start: number; end: number }[] = [];
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (isPageBreakLine(lines[i]!)) {
      if (i > start) {
        segments.push({ start, end: i - 1 });
      }
      start = i + 1;
    }
  }
  if (start <= lines.length - 1) {
    segments.push({ start, end: lines.length - 1 });
  }
  if (segments.length === 0) {
    segments.push({ start: 0, end: lines.length - 1 });
  }
  return segments;
}

export function textareaLineMetrics(textarea: HTMLTextAreaElement): { lh: number; pt: number; pb: number } {
  const cs = getComputedStyle(textarea);
  let lh = parseFloat(cs.lineHeight);
  if (Number.isNaN(lh) || lh <= 0) {
    const fs = parseFloat(cs.fontSize);
    lh = (Number.isFinite(fs) ? fs : 14) * 1.4;
  }
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  return { lh, pt, pb };
}

/**
 * Pixel-Top und -Höhe je Segment: (Zeilen × lh) skaliert auf textarea.scrollHeight.
 */
export function minimapSegmentLayout(
  textarea: HTMLTextAreaElement,
  segments: { start: number; end: number }[]
): { top: number; height: number }[] {
  const raw = textarea.value;
  const lines = raw.split(/\r\n|\r|\n/);
  const nLines = Math.max(1, lines.length);
  const { lh, pt, pb } = textareaLineMetrics(textarea);
  const sh = Math.max(0, textarea.scrollHeight);
  const logicalH = pt + nLines * lh + pb;
  const scale = logicalH > 0 ? sh / logicalH : 1;

  const out = segments.map(({ start, end }) => {
    const lineCount = Math.max(0, end - start + 1);
    const top = (pt + start * lh) * scale;
    const height = lineCount * lh * scale;
    return { top, height };
  });

  if (out.length > 0 && sh > 0) {
    const last = out[out.length - 1]!;
    last.height = Math.max(1, sh - last.top);
  }
  return out;
}

function stripeColorsEditorBg(): { a: string; b: string } {
  const dark = document.documentElement.classList.contains("dark");
  if (dark) {
    return {
      a: "rgb(30 58 138 / 0.35)",
      b: "rgb(20 83 45 / 0.32)"
    };
  }
  return {
    a: "rgb(239 246 255)",
    b: "rgb(240 253 244)"
  };
}

/**
 * Hintergrundstreifen nur bei mehreren Seiten; feste Zeilenlogik wie die Minimap.
 */
export function updateEditorPageStripeBackground(textarea: HTMLTextAreaElement): void {
  const segments = pageSegmentsZeroBased(textarea.value);
  if (segments.length <= 1) {
    textarea.classList.remove("editor-textarea--page-stripes");
    textarea.style.removeProperty("background-image");
    return;
  }

  textarea.classList.add("editor-textarea--page-stripes");

  const sh = textarea.scrollHeight;
  const { a: c0, b: c1 } = stripeColorsEditorBg();
  const layout = minimapSegmentLayout(textarea, segments);

  const stops: string[] = [];
  for (let i = 0; i < layout.length; i++) {
    const seg = layout[i]!;
    const c = i % 2 === 0 ? c0 : c1;
    stops.push(`${c} ${seg.top}px`, `${c} ${seg.top + seg.height}px`);
  }
  const last = layout[layout.length - 1]!;
  const bottom = last.top + last.height;
  const lastC = (layout.length - 1) % 2 === 0 ? c0 : c1;
  stops.push(`${lastC} ${bottom}px`, `${lastC} ${sh + 80}px`);

  textarea.style.backgroundImage = `linear-gradient(to bottom, ${stops.join(", ")})`;
}

