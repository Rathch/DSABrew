/**
 * Zeilennummern-Spalte: gleiche Typometrie wie die Textarea, Scroll per JS gekoppelt.
 */

function countLines(text: string): number {
  if (!text) {
    return 1;
  }
  return text.split(/\r\n|\r|\n/).length;
}

export function setupEditorLineNumbers(
  textarea: HTMLTextAreaElement,
  scrollEl: HTMLElement,
  inner: HTMLElement,
  host: HTMLElement
): void {
  function applyMetrics(): void {
    const cs = getComputedStyle(textarea);
    inner.style.fontFamily = cs.fontFamily;
    inner.style.fontSize = cs.fontSize;
    inner.style.fontWeight = cs.fontWeight;
    inner.style.lineHeight = cs.lineHeight;
    inner.style.letterSpacing = cs.letterSpacing;
    inner.style.paddingTop = cs.paddingTop;
    inner.style.paddingBottom = cs.paddingBottom;
  }

  function update(): void {
    applyMetrics();
    const n = countLines(textarea.value);
    const digits = String(n).length;
    const wch = `${Math.max(2.25, digits + 1.25)}ch`;
    host.style.width = wch;
    host.style.minWidth = wch;
    inner.textContent = Array.from({ length: n }, (_, i) => String(i + 1)).join("\n");
  }

  function syncScroll(): void {
    scrollEl.scrollTop = textarea.scrollTop;
  }

  textarea.addEventListener("input", update);
  textarea.addEventListener("scroll", syncScroll, { passive: true });
  const ro = new ResizeObserver(() => {
    applyMetrics();
    update();
  });
  ro.observe(textarea);

  void document.fonts.ready.then(() => {
    applyMetrics();
    update();
    syncScroll();
  });

  update();
  syncScroll();
}
