/** ECMAScript-Zeilenumbrüche inkl. U+2028 / U+2029 (z. B. aus Word/Google-Docs-Paste). */
const LINE_SPLIT = /\r\n|\r|\n|\u2028|\u2029/;

/** Zeilen zählen wie in der Zeilennummern-Gutter (leerer Editor = eine Zeile). */
export function countLines(text: string): number {
  if (!text) {
    return 1;
  }
  return text.split(LINE_SPLIT).length;
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

  function syncPadToTextarea(): void {
    /* Textarea scrollHeight enthält Zeilenumbrüche durch Soft-Wrap; die Gutter nur logische Zeilen.
     * Zusatz-Padding unten gleicht die Scroll-Höhen ab, damit Sync bis zum Dokumentende funktioniert. */
    inner.style.paddingBottom = "0px";
    const innerSh = inner.scrollHeight;
    const taSh = textarea.scrollHeight;
    const extra = Math.max(0, taSh - innerSh);
    inner.style.paddingBottom = `${extra}px`;
  }

  function update(): void {
    applyMetrics();
    const n = countLines(textarea.value);
    const digits = String(n).length;
    const wch = `${Math.max(2.25, digits + 1.25)}ch`;
    host.style.width = wch;
    host.style.minWidth = wch;
    inner.textContent = Array.from({ length: n }, (_, i) => String(i + 1)).join("\n");
    requestAnimationFrame(() => {
      syncPadToTextarea();
      syncScroll();
    });
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
