/**
 * Kopplung Editor ↔ Vorschau: proportionales Scrollen + Minimap-Streifen für den in der Vorschau sichtbaren Bereich.
 */

const LS_SCROLL_LINK = "dsabrew-scroll-link";

function scrollRatio(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) {
    return 0;
  }
  return el.scrollTop / max;
}

function setScrollRatio(el: HTMLElement, r: number): void {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) {
    return;
  }
  el.scrollTop = Math.max(0, Math.min(max, r * max));
}

export function setupEditorPreviewScrollSync(options: {
  layout: HTMLElement;
  preview: HTMLElement;
  textarea: HTMLTextAreaElement;
  toggle: HTMLInputElement;
  syncBar: HTMLElement;
  gutter: HTMLElement;
  gutterInner: HTMLElement;
  gutterTrack: HTMLElement;
  gutterRange: HTMLElement;
  isSplitLayout: () => boolean;
}): void {
  const {
    layout,
    preview,
    textarea,
    toggle,
    syncBar,
    gutter,
    gutterInner,
    gutterTrack,
    gutterRange,
    isSplitLayout
  } = options;

  let ignore = false;

  const saved = localStorage.getItem(LS_SCROLL_LINK);
  if (saved === "0") {
    toggle.checked = false;
  }

  toggle.addEventListener("change", () => {
    localStorage.setItem(LS_SCROLL_LINK, toggle.checked ? "1" : "0");
  });

  function updateMinimap(): void {
    const split = isSplitLayout();
    syncBar.hidden = !split;
    gutter.hidden = !split;
    if (!split) {
      return;
    }

    const sh = preview.scrollHeight;
    const ch = preview.clientHeight;
    const st = preview.scrollTop;
    const th = textarea.scrollHeight;
    const tch = textarea.clientHeight;
    const tst = textarea.scrollTop;

    gutterInner.style.transform = `translateY(${-tst}px)`;
    gutterTrack.style.height = `${th}px`;

    if (sh <= 0) {
      gutterRange.style.display = "none";
      return;
    }
    gutterRange.style.display = "block";

    const topPx = (st / sh) * th;
    const hPx = Math.max((ch / sh) * th, 3);
    gutterRange.style.top = `${topPx}px`;
    gutterRange.style.height = `${hPx}px`;
  }

  function onPreviewScroll(): void {
    updateMinimap();
    if (!isSplitLayout() || !toggle.checked || ignore) {
      return;
    }
    ignore = true;
    setScrollRatio(textarea, scrollRatio(preview));
    ignore = false;
    updateMinimap();
  }

  function onTextareaScroll(): void {
    updateMinimap();
    if (!isSplitLayout() || !toggle.checked || ignore) {
      return;
    }
    ignore = true;
    setScrollRatio(preview, scrollRatio(textarea));
    ignore = false;
    updateMinimap();
  }

  preview.addEventListener("scroll", onPreviewScroll, { passive: true });
  textarea.addEventListener("scroll", onTextareaScroll, { passive: true });
  textarea.addEventListener("input", () => requestAnimationFrame(() => updateMinimap()));

  const ro = new ResizeObserver(() => updateMinimap());
  ro.observe(preview);
  ro.observe(textarea);
  ro.observe(gutter);

  const mo = new MutationObserver(() => requestAnimationFrame(() => updateMinimap()));
  mo.observe(preview, { childList: true, subtree: true });

  layout.addEventListener("dsabrew-layout-changed", () => updateMinimap());

  updateMinimap();
}
