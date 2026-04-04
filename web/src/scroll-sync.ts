/**
 * Scroll sync editor ↔ preview + narrow page strip:
 * Always derive scale and stripes from the textarea (scrollHeight, \\page segments, lines like the gutter),
 * so the minimap stays aligned with the markdown even when the preview is visible.
 */

import { minimapSegmentLayout, pageSegmentsZeroBased } from "./editor-page-stripes";

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

function previewIsVisible(preview: HTMLElement): boolean {
  return getComputedStyle(preview).display !== "none";
}

/** One-off load listeners for preview images (scrollHeight changes; #preview box often does not → no ResizeObserver). */
function bindPreviewImageLoads(preview: HTMLElement, onLayout: () => void): void {
  preview.querySelectorAll("img").forEach((img) => {
    if (img.complete) {
      return;
    }
    img.addEventListener(
      "load",
      () => {
        requestAnimationFrame(onLayout);
      },
      { once: true }
    );
  });
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

  const pagesContainer = document.getElementById("editor-viewport-gutter-pages");

  let ignore = false;

  function syncMinimapScrollFromTextarea(): void {
    if (!pagesContainer || gutter.hidden) {
      return;
    }
    if (gutterRange.style.display === "none") {
      return;
    }
    const st = textarea.scrollTop;
    const ch = textarea.clientHeight;
    gutterInner.scrollTop = st;
    gutterRange.style.top = `${st}px`;
    gutterRange.style.height = `${Math.max(4, ch)}px`;
  }

  const saved = localStorage.getItem(LS_SCROLL_LINK);
  if (saved === "0") {
    toggle.checked = false;
  }

  toggle.addEventListener("change", () => {
    localStorage.setItem(LS_SCROLL_LINK, toggle.checked ? "1" : "0");
  });

  function updatePageStripeGutter(): void {
    const split = isSplitLayout();
    syncBar.hidden = !split;

    if (!pagesContainer) {
      return;
    }

    const segments = pageSegmentsZeroBased(textarea.value);
    const multiSource = segments.length > 1;

    const pageEls = preview.querySelectorAll<HTMLElement>(".a4-page");
    const domOk = previewIsVisible(preview) && pageEls.length > 0;

    /* Single page without preview: hide stripes (as before) */
    if (!multiSource && !domOk) {
      gutter.hidden = true;
      return;
    }

    gutter.hidden = false;

    const shRaw = textarea.scrollHeight;
    if (shRaw <= 0) {
      gutterInner.style.transform = "";
      gutterTrack.style.height = "0";
      pagesContainer.replaceChildren();
      gutterRange.style.display = "none";
      return;
    }

    const sh = shRaw;
    const gh = gutter.clientHeight;
    if (gh <= 0) {
      requestAnimationFrame(() => updatePageStripeGutter());
      return;
    }

    gutterTrack.style.height = `${sh}px`;
    pagesContainer.replaceChildren();

    const layouts = minimapSegmentLayout(textarea, segments);
    layouts.forEach((lay, i) => {
      const seg = document.createElement("div");
      seg.className = `editor__viewport-gutter-page editor__viewport-gutter-page--${i % 2 === 0 ? "a" : "b"}`;
      seg.style.top = `${lay.top}px`;
      seg.style.height = `${lay.height}px`;
      pagesContainer.appendChild(seg);
    });

    gutterRange.style.display = "block";
    syncMinimapScrollFromTextarea();
  }

  function schedulePageStripeGutter(): void {
    requestAnimationFrame(() => {
      updatePageStripeGutter();
      bindPreviewImageLoads(preview, schedulePageStripeGutter);
    });
  }

  function reobserveA4Pages(roPages: ResizeObserver): void {
    roPages.disconnect();
    preview.querySelectorAll(".a4-page").forEach((el) => {
      roPages.observe(el);
    });
  }

  function onPreviewScroll(): void {
    if (!isSplitLayout() || !toggle.checked || ignore) {
      return;
    }
    ignore = true;
    setScrollRatio(textarea, scrollRatio(preview));
    ignore = false;
    syncMinimapScrollFromTextarea();
  }

  function onTextareaScroll(): void {
    syncMinimapScrollFromTextarea();
    if (!isSplitLayout() || !toggle.checked || ignore) {
      return;
    }
    ignore = true;
    setScrollRatio(preview, scrollRatio(textarea));
    ignore = false;
  }

  preview.addEventListener("scroll", onPreviewScroll, { passive: true });
  textarea.addEventListener("scroll", onTextareaScroll, { passive: true });
  textarea.addEventListener("input", () => requestAnimationFrame(() => updatePageStripeGutter()));

  const ro = new ResizeObserver(() => updatePageStripeGutter());
  ro.observe(preview);
  ro.observe(textarea);
  ro.observe(gutter);

  const roPages = new ResizeObserver(() => updatePageStripeGutter());

  const mo = new MutationObserver(() => {
    reobserveA4Pages(roPages);
    schedulePageStripeGutter();
  });
  mo.observe(preview, { childList: true, subtree: true });

  let winResizeTimer: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener("resize", () => {
    if (winResizeTimer) {
      clearTimeout(winResizeTimer);
    }
    winResizeTimer = setTimeout(() => {
      winResizeTimer = null;
      updatePageStripeGutter();
    }, 100);
  });

  void document.fonts.ready.then(() => updatePageStripeGutter());

  layout.addEventListener("dsabrew-layout-changed", () => updatePageStripeGutter());

  reobserveA4Pages(roPages);
  bindPreviewImageLoads(preview, schedulePageStripeGutter);
  updatePageStripeGutter();
}
