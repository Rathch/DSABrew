/**
 * Page boundaries for the minimap: count raw text line by line up to \\page / \\pageSingle
 * (or {{page}} / {{pageSingle}}). Line metrics → `minimapSegmentLayout` in scroll-sync.
 * Textarea background stripes are disabled — only the viewport gutter shows pages.
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

export function isPageBreakLine(line: string): boolean {
  return RE_PAGE_CMD.test(line) || RE_PAGE_MACRO.test(line) || RE_PAGE_SINGLE_MACRO.test(line);
}

/**
 * Pages as contiguous line ranges (0-based indices, inclusive end),
 * separated by page-break lines — those lines belong to no segment.
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
 * Pixel top and height per segment: (lines × lh) scaled to textarea.scrollHeight.
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

/** Clears any legacy page-stripe styling on the textarea (pages only in the minimap). */
export function updateEditorPageStripeBackground(textarea: HTMLTextAreaElement): void {
  textarea.classList.remove("editor-textarea--page-stripes");
  textarea.style.removeProperty("background-image");
}

