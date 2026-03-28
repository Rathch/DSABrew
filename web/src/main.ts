import "./style.css";
import listBulletUrl from "@media/image1.png?url";
import { attachMarkdownToolbar } from "./markdown-toolbar";
import { exportPreviewToPdf } from "./pdf-export";
import { renderDocument } from "./renderer";
import { setupEditorPreviewScrollSync } from "./scroll-sync";
import { DATENSCHUTZ_BODY_HTML } from "./datenschutz-content";
import { fanProductNoticeHtml } from "./fan-product-notice";

document.documentElement.style.setProperty(
  "--dsa-list-bullet-url",
  `url(${JSON.stringify(listBulletUrl)})`
);

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_PUBLIC_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
  if (base) {
    return `${base}${path}`;
  }
  return path;
}

function absoluteDocUrl(slug: string): string {
  return new URL(`/d/${encodeURIComponent(slug)}`, window.location.origin).href;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

const BODY_SCROLLABLE_CLASS = "dsabrew-body--scrollable";
const STRIP_VISIBLE_CLASS = "dsabrew-privacy-strip-visible";
const LS_PRIVACY_STRIP_DISMISSED = "dsabrew-privacy-strip-dismissed";

/** Start-/Rechtsseiten & Fehler: body scrollt; Editor-Ansicht: overflow hidden wie bisher */
function setPublicPageScroll(enable: boolean): void {
  document.body.classList.toggle(BODY_SCROLLABLE_CLASS, enable);
}

function initPrivacyStrip(): void {
  const strip = document.getElementById("dsabrew-privacy-strip");
  const btn = document.getElementById("privacy-strip-dismiss");
  if (!strip || !btn) {
    return;
  }
  if (localStorage.getItem(LS_PRIVACY_STRIP_DISMISSED) === "1") {
    return;
  }
  strip.removeAttribute("hidden");
  document.body.classList.add(STRIP_VISIBLE_CLASS);
  btn.addEventListener("click", () => {
    localStorage.setItem(LS_PRIVACY_STRIP_DISMISSED, "1");
    strip.setAttribute("hidden", "");
    document.body.classList.remove(STRIP_VISIBLE_CLASS);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function scrollPreviewToElementById(
  preview: HTMLElement,
  id: string,
  behavior: ScrollBehavior
): void {
  const el = document.getElementById(id);
  if (!el || !preview.contains(el)) {
    return;
  }
  el.scrollIntoView({ behavior, block: "start" });
}

const LINK_SCRIPTORIUM = "https://www.ulisses-ebooks.de/cc/7/scriptoriumaventuris";
const LINK_ELF = "https://elf.ulisses-spiele.de/";
const LINK_GPL = "https://www.gnu.org/licenses/gpl-3.0.html";
const LINK_GITHUB = "https://github.com/Rathch/DSABrew";

function landingFooterNav(extraClass: string): string {
  return `
    <nav class="landing-footer${extraClass}" aria-label="Rechtliches und externe Links">
      <ul class="landing-footer__list">
        <li><a href="/impressum">Impressum</a></li>
        <li><a href="/datenschutz">Datenschutz</a></li>
        <li><a href="${LINK_SCRIPTORIUM}" rel="noopener noreferrer">Scriptorium Aventuris</a></li>
        <li><a href="${LINK_ELF}" rel="noopener noreferrer">ELF (Ulisses)</a></li>
        <li><a href="${LINK_GPL}" rel="noopener noreferrer">GNU GPLv3</a></li>
        <li><a href="${LINK_GITHUB}" rel="noopener noreferrer">GitHub</a></li>
      </ul>
    </nav>`;
}

/** Fußzeile: Nav-Links + Markenhinweis / Fan-Produkt (siehe `fan-product-notice.ts`). */
function siteChromeFooter(navExtraClass: string): string {
  return `${landingFooterNav(navExtraClass)}${fanProductNoticeHtml()}`;
}

function buildLegalPageLayout(kind: "impressum" | "datenschutz"): string {
  const title = kind === "impressum" ? "Impressum" : "Datenschutz";
  const body =
    kind === "impressum"
      ? `<div class="landing-legal-body">
      <address class="landing-impressum">
        <p class="landing-impressum__name">Christian Rath-Ulrich</p>
        <p class="landing-impressum__addr">Ernst-Mühlendyckstr 2<br />51143 Köln</p>
        <p class="landing-impressum__contact">
          <a href="mailto:kontakt@rath-ulrich.de">kontakt@rath-ulrich.de</a>
        </p>
      </address>
    </div>`
      : DATENSCHUTZ_BODY_HTML;
  return `
  <div class="landing landing--legal">
    <header class="landing__header">
      <h1 class="landing__title">${title}</h1>
    </header>
    ${body}
    <p class="landing-back"><a href="/">← Neues Dokument</a></p>
    ${siteChromeFooter(" landing-footer--inline")}
  </div>
`;
}

/** Symbol „Nur Ansicht“ (Auge) */
const ICON_VIEW = `<svg class="hosted-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

const ICON_EDIT = `<svg class="hosted-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

function buildDocumentLayout(options: { mode: "view" | "edit" }): string {
  const editorClasses =
    options.mode === "view" ? "editor editor--readonly" : "editor";
  const shareEditBtn =
    options.mode === "edit"
      ? `<button type="button" id="share-edit-btn" class="hosted-toolbar__btn">${ICON_EDIT}<span>Teilen: Bearbeiten</span></button>`
      : "";
  const segLayout = `class="hosted-view-controls__seg" aria-pressed="false"`;
  const segMd =
    options.mode === "edit"
      ? `class="hosted-view-controls__seg hosted-view-controls__seg--active" aria-pressed="true"`
      : `class="hosted-view-controls__seg" aria-pressed="false"`;
  const segPv =
    options.mode === "view"
      ? `class="hosted-view-controls__seg hosted-view-controls__seg--active" aria-pressed="true"`
      : `class="hosted-view-controls__seg" aria-pressed="false"`;
  const hostedSingleInit =
    options.mode === "edit"
      ? "layout--view-single layout--focus-editor"
      : "layout--view-single layout--focus-preview";
  return `
  <main class="layout layout--hosted ${hostedSingleInit}">
    <div class="hosted-banner">
      <div class="hosted-banner__row">
        <strong>DSABrew</strong>
        <span class="hosted-banner__mode">${options.mode === "view" ? "Nur Lesen" : "Bearbeiten — Autosave"}</span>
      </div>
      <div class="hosted-toolbar" role="toolbar" aria-label="Dokumentaktionen">
        <button type="button" id="hosted-new-btn" class="hosted-toolbar__btn hosted-toolbar__btn--primary">
          <span class="hosted-toolbar__plus" aria-hidden="true">+</span> Neues Dokument
        </button>
        <button type="button" id="share-view-btn" class="hosted-toolbar__btn">${ICON_VIEW}<span>Teilen: Nur Ansicht</span></button>
        ${shareEditBtn}
        <button type="button" id="pdf-btn-banner" class="hosted-toolbar__btn print-btn hosted-toolbar__btn--narrow-only" aria-label="PDF speichern">PDF speichern</button>
      </div>
      <div class="hosted-view-controls" role="region" aria-label="Darstellung bei schmalem Fenster">
        <div class="hosted-view-controls__row">
          <span class="hosted-view-controls__label" id="hosted-view-label">Darstellung</span>
          <div class="hosted-view-controls__segment" role="radiogroup" aria-labelledby="hosted-view-label">
            <button type="button" ${segLayout} id="hosted-view-layout">Layout</button>
            <button type="button" ${segMd} id="hosted-view-md">Markdown</button>
            <button type="button" ${segPv} id="hosted-view-preview">Vorschau</button>
          </div>
        </div>
      </div>
    </div>
    <section class="${editorClasses}" aria-label="${options.mode === "view" ? "Nur Lesen — Quelltext nicht bearbeitbar" : "Markdown-Editor"}">
      <h2 class="editor__visually-hidden">Markdown</h2>
      <p id="save-status" class="editor__flash" aria-live="polite"></p>
      <div id="md-toolbar" class="md-toolbar-wrap"></div>
      <div class="editor__sync-bar" id="editor-sync-bar" hidden>
        <label class="editor__sync-label">
          <input type="checkbox" id="scroll-link-toggle" checked />
          Scroll koppeln
        </label>
      </div>
      <div class="editor__input-row">
        <div class="editor__viewport-gutter" id="editor-viewport-gutter" hidden aria-hidden="true">
          <div class="editor__viewport-gutter-inner" id="editor-viewport-gutter-inner">
            <div class="editor__viewport-gutter-track" id="editor-viewport-gutter-track">
              <div class="editor__viewport-gutter-range" id="editor-viewport-gutter-range"></div>
            </div>
          </div>
        </div>
        <textarea id="markdown-input" spellcheck="false"></textarea>
      </div>
      <button id="pdf-btn" class="print-btn" type="button">PDF speichern</button>
    </section>
    <section class="preview" id="preview"></section>
    <footer class="hosted-doc-footer" role="contentinfo">
      ${siteChromeFooter("")}
    </footer>
  </main>
`;
}

function wireNewDocumentButton(btn: HTMLButtonElement | null): void {
  btn?.addEventListener("click", () => {
    const url = new URL("/new", window.location.origin).href;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

function wireShareButtons(
  slugView: string,
  slugEdit: string | undefined,
  feedbackEl: HTMLElement | null
): void {
  const shareView = document.querySelector<HTMLButtonElement>("#share-view-btn");
  const shareEdit = document.querySelector<HTMLButtonElement>("#share-edit-btn");

  shareView?.addEventListener("click", async () => {
    const url = absoluteDocUrl(slugView);
    const ok = await copyTextToClipboard(url);
    if (feedbackEl) {
      feedbackEl.textContent = ok ? "Nur-Ansicht-Link kopiert" : url;
    }
  });

  shareEdit?.addEventListener("click", async () => {
    if (!slugEdit) {
      return;
    }
    const url = absoluteDocUrl(slugEdit);
    const ok = await copyTextToClipboard(url);
    if (feedbackEl) {
      feedbackEl.textContent = ok ? "Bearbeiten-Link kopiert" : url;
    }
  });
}

const LS_HOSTED_VIEW = "dsabrew-hosted-view";
/** @deprecated nur Migration von älteren Keys */
const LS_HOSTED_PANE = "dsabrew-hosted-pane";
/** @deprecated nur Migration von älteren Keys */
const LS_HOSTED_FOCUS = "dsabrew-hosted-focus";
const HOSTED_NARROW_MQ = "(max-width: 960px)";

type HostedViewPref = "layout" | "markdown" | "preview";

function defaultHostedView(docMode: "view" | "edit"): HostedViewPref {
  return docMode === "edit" ? "markdown" : "preview";
}

function migrateOldHostedPrefs(): HostedViewPref | null {
  const pane = localStorage.getItem(LS_HOSTED_PANE);
  const focus = localStorage.getItem(LS_HOSTED_FOCUS);
  if (pane === "layout") {
    return "layout";
  }
  if (pane === "single") {
    if (focus === "editor") {
      return "markdown";
    }
    if (focus === "preview") {
      return "preview";
    }
  }
  return null;
}

function readHostedViewPref(): HostedViewPref | null {
  const v = localStorage.getItem(LS_HOSTED_VIEW);
  if (v === "layout" || v === "markdown" || v === "preview") {
    return v;
  }
  const migrated = migrateOldHostedPrefs();
  if (migrated) {
    localStorage.setItem(LS_HOSTED_VIEW, migrated);
    localStorage.removeItem(LS_HOSTED_PANE);
    localStorage.removeItem(LS_HOSTED_FOCUS);
  }
  return migrated;
}

function wireHostedViewControls(layout: HTMLElement, docMode: "view" | "edit"): void {
  const mq = window.matchMedia(HOSTED_NARROW_MQ);
  const btnLayout = document.querySelector<HTMLButtonElement>("#hosted-view-layout");
  const btnMd = document.querySelector<HTMLButtonElement>("#hosted-view-md");
  const btnPv = document.querySelector<HTMLButtonElement>("#hosted-view-preview");

  if (!btnLayout || !btnMd || !btnPv) {
    return;
  }

  const segBtns = [btnLayout, btnMd, btnPv] as const;

  function setSegActive(activeIndex: number): void {
    segBtns.forEach((b, i) => {
      const on = i === activeIndex;
      b.classList.toggle("hosted-view-controls__seg--active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function viewToIndex(v: HostedViewPref): number {
    if (v === "layout") {
      return 0;
    }
    if (v === "markdown") {
      return 1;
    }
    return 2;
  }

  function notifyLayoutChanged(): void {
    layout.dispatchEvent(new CustomEvent("dsabrew-layout-changed"));
  }

  function applyViewPref(v: HostedViewPref): void {
    if (v === "layout") {
      layout.classList.remove("layout--view-single", "layout--focus-editor", "layout--focus-preview");
    } else if (v === "markdown") {
      layout.classList.add("layout--view-single");
      layout.classList.remove("layout--focus-preview");
      layout.classList.add("layout--focus-editor");
    } else {
      layout.classList.add("layout--view-single");
      layout.classList.remove("layout--focus-editor");
      layout.classList.add("layout--focus-preview");
    }
    setSegActive(viewToIndex(v));
  }

  function applyNarrowState(): void {
    const v = readHostedViewPref() ?? defaultHostedView(docMode);
    if (!mq.matches) {
      layout.classList.remove("layout--view-single", "layout--focus-editor", "layout--focus-preview");
      setSegActive(viewToIndex(v));
      notifyLayoutChanged();
      return;
    }
    applyViewPref(v);
    notifyLayoutChanged();
  }

  function persistAndApply(v: HostedViewPref): void {
    localStorage.setItem(LS_HOSTED_VIEW, v);
    if (!mq.matches) {
      notifyLayoutChanged();
      return;
    }
    applyViewPref(v);
    notifyLayoutChanged();
  }

  btnLayout.addEventListener("click", () => persistAndApply("layout"));
  btnMd.addEventListener("click", () => persistAndApply("markdown"));
  btnPv.addEventListener("click", () => persistAndApply("preview"));

  mq.addEventListener("change", applyNarrowState);
  applyNarrowState();
}

function initEditorAndPreview(
  initialMarkdown: string,
  options: {
    mode: "view" | "edit";
    token: string;
    slugView: string;
    slugEdit?: string;
  }
): void {
  setPublicPageScroll(false);
  app.innerHTML = buildDocumentLayout({ mode: options.mode });

  const input = document.querySelector<HTMLTextAreaElement>("#markdown-input");
  const preview = document.querySelector<HTMLElement>("#preview");
  const pdfButton = document.querySelector<HTMLButtonElement>("#pdf-btn");
  const toolbarRoot = document.querySelector<HTMLElement>("#md-toolbar");
  const saveStatus = document.querySelector<HTMLElement>("#save-status");

  if (!input || !preview || !pdfButton || !toolbarRoot) {
    throw new Error("Failed to initialize app UI");
  }

  input.value = initialMarkdown;
  if (options.mode === "view") {
    input.readOnly = true;
    input.setAttribute("aria-readonly", "true");
    toolbarRoot.innerHTML =
      '<p class="md-toolbar-disabled-hint">Toolbar im Nur-Lese-Modus ausgeblendet.</p>';
  } else {
    attachMarkdownToolbar(toolbarRoot, input);
  }

  wireNewDocumentButton(document.querySelector<HTMLButtonElement>("#hosted-new-btn"));
  wireShareButtons(options.slugView, options.slugEdit, saveStatus);

  const layoutHost = document.querySelector<HTMLElement>("main.layout.layout--hosted");
  if (layoutHost) {
    wireHostedViewControls(layoutHost, options.mode);
  }

  const syncBar = document.querySelector<HTMLElement>("#editor-sync-bar");
  const scrollToggle = document.querySelector<HTMLInputElement>("#scroll-link-toggle");
  const gutter = document.querySelector<HTMLElement>("#editor-viewport-gutter");
  const gutterInner = document.querySelector<HTMLElement>("#editor-viewport-gutter-inner");
  const gutterTrack = document.querySelector<HTMLElement>("#editor-viewport-gutter-track");
  const gutterRange = document.querySelector<HTMLElement>("#editor-viewport-gutter-range");
  if (
    layoutHost &&
    syncBar &&
    scrollToggle &&
    gutter &&
    gutterInner &&
    gutterTrack &&
    gutterRange
  ) {
    setupEditorPreviewScrollSync({
      layout: layoutHost,
      preview,
      textarea: input,
      toggle: scrollToggle,
      syncBar,
      gutter,
      gutterInner,
      gutterTrack,
      gutterRange,
      isSplitLayout: () => !layoutHost.classList.contains("layout--view-single")
    });
  }

  let firstPreviewDone = false;

  function updatePreview(markdown: string): void {
    try {
      const result = renderDocument(markdown);
      preview.innerHTML = result.pages
        .map((page) => {
          const chrome = page.pageChromeClasses ? ` ${page.pageChromeClasses}` : "";
          const singleCol = page.singleColumn ? " a4-page--single-column" : "";
          const footerClass = page.bookFooter ? " a4-page--with-book-footer" : "";
          const footerParity =
            page.bookFooter != null
              ? page.displayPageNumber % 2 === 0
                ? "book-footer-strip--even"
                : "book-footer-strip--odd"
              : "";
          const hidePageNumber = page.mapKey === "final";
          const footerHtml = page.bookFooter
            ? `<footer class="book-footer-strip ${footerParity}" aria-label="Fußzeile">
  <div class="book-footer-cluster book-footer-cluster--start book-footer-cluster--num-slot">
    <span class="book-footer-num">${String(page.bookFooter.pageNumber).padStart(2, "0")}</span>
  </div>
  <span class="book-footer-title">${escapeHtml(page.bookFooter.title)}</span>
  <div class="book-footer-cluster book-footer-cluster--end" aria-hidden="true"></div>
</footer>`
            : hidePageNumber
              ? ""
              : `<div class="page-number page-number--${page.displayPageNumber % 2 === 0 ? "even" : "odd"}">${String(page.displayPageNumber).padStart(2, "0")}</div>`;
          return `
      <article class="a4-page${chrome}${singleCol}${footerClass}">
        <div class="page-body">${page.renderedHtml}</div>
        ${footerHtml}
      </article>
    `;
        })
        .join("");
      if (!firstPreviewDone) {
        firstPreviewDone = true;
        const hash = window.location.hash;
        if (hash.length > 1) {
          const id = decodeURIComponent(hash.slice(1));
          requestAnimationFrame(() => scrollPreviewToElementById(preview, id, "auto"));
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      preview.innerHTML = `<aside class="preview-error" role="alert"><strong>Vorschau fehlgeschlagen</strong><pre>${escapeHtml(msg)}</pre></aside>`;
    }
  }

  preview.addEventListener("click", (e: MouseEvent) => {
    if (e.button !== 0) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    const target = e.target as Element | null;
    const link = target?.closest("a");
    if (!link || !preview.contains(link) || !link.classList.contains("toc-line")) {
      return;
    }
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#") || href.length < 2) {
      return;
    }
    const id = decodeURIComponent(href.slice(1));
    if (!id) {
      return;
    }
    const el = document.getElementById(id);
    if (!el || !preview.contains(el)) {
      return;
    }
    e.preventDefault();
    scrollPreviewToElementById(preview, id, "smooth");
    const path = `${window.location.pathname}${window.location.search}`;
    try {
      window.history.replaceState(null, "", `${path}${href}`);
    } catch {
      /* ignore */
    }
  });

  window.addEventListener("hashchange", () => {
    const h = window.location.hash;
    if (h.length > 1) {
      scrollPreviewToElementById(preview, decodeURIComponent(h.slice(1)), "smooth");
    }
  });

  const DEBOUNCE_MS = 400;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function persistMarkdown(markdown: string): Promise<void> {
    if (options.mode !== "edit") {
      return;
    }
    const url = apiUrl(`/api/documents/${encodeURIComponent(options.token)}`);
    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown })
    });
    if (!r.ok) {
      throw new Error(`Speichern fehlgeschlagen (${r.status})`);
    }
    if (saveStatus) {
      saveStatus.textContent = "Gespeichert";
    }
  }

  function scheduleHostedSave(): void {
    if (options.mode !== "edit") {
      return;
    }
    if (saveStatus) {
      saveStatus.textContent = "Speichert…";
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      void persistMarkdown(input.value).catch(() => {
        if (saveStatus) {
          saveStatus.textContent = "Speichern fehlgeschlagen";
        }
      });
    }, DEBOUNCE_MS);
  }

  function flushHostedSave(): void {
    if (options.mode !== "edit") {
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const url = apiUrl(`/api/documents/${encodeURIComponent(options.token)}`);
    const body = JSON.stringify({ markdown: input.value });
    void fetch(url, {
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body
    }).catch(() => {});
  }

  input.addEventListener("input", () => {
    updatePreview(input.value);
    scheduleHostedSave();
  });

  window.addEventListener("pagehide", flushHostedSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushHostedSave();
    }
  });

  const pdfBanner = document.querySelector<HTMLButtonElement>("#pdf-btn-banner");

  async function runPdfExport(): Promise<void> {
    const prevMain = pdfButton.textContent;
    const prevBanner = pdfBanner?.textContent;
    pdfButton.disabled = true;
    pdfButton.textContent = "PDF wird erstellt…";
    if (pdfBanner) {
      pdfBanner.disabled = true;
      pdfBanner.textContent = "PDF wird erstellt…";
    }
    try {
      await exportPreviewToPdf(preview, {
        onProgress: (cur, tot) => {
          const t = `PDF… Seite ${cur}/${tot}`;
          pdfButton.textContent = t;
          if (pdfBanner) {
            pdfBanner.textContent = t;
          }
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      window.alert(`PDF-Export fehlgeschlagen:\n${msg}`);
    } finally {
      pdfButton.disabled = false;
      pdfButton.textContent = prevMain ?? "PDF speichern";
      if (pdfBanner) {
        pdfBanner.disabled = false;
        pdfBanner.textContent = prevBanner ?? "PDF speichern";
      }
    }
  }

  pdfButton.addEventListener("click", () => void runPdfExport());
  pdfBanner?.addEventListener("click", () => void runPdfExport());

  updatePreview(input.value);
}

function renderLegalPage(kind: "impressum" | "datenschutz"): void {
  document.title = kind === "impressum" ? "Impressum — DSABrew" : "Datenschutz — DSABrew";
  setPublicPageScroll(true);
  app.innerHTML = buildLegalPageLayout(kind);
}

let pathNorm = window.location.pathname;
if (pathNorm.length > 1 && pathNorm.endsWith("/")) {
  pathNorm = pathNorm.slice(0, -1);
}
const path = pathNorm || "/";

if (path === "/impressum") {
  renderLegalPage("impressum");
} else if (path === "/datenschutz") {
  renderLegalPage("datenschutz");
} else if (path === "/" || path === "/new") {
  void (async () => {
    try {
      const r = await fetch(apiUrl("/api/documents"), { method: "POST" });
      if (!r.ok) {
        setPublicPageScroll(true);
        document.title = "DSABrew";
        app.innerHTML = `<aside class="preview-error" role="alert"><strong>Neues Dokument fehlgeschlagen</strong><p>HTTP ${r.status}</p><p><a href="/">Erneut versuchen</a></p></aside>`;
        return;
      }
      const j = (await r.json()) as { slugEdit: string };
      window.location.replace(`/d/${encodeURIComponent(j.slugEdit)}`);
    } catch {
      setPublicPageScroll(true);
      document.title = "DSABrew";
      app.innerHTML = `<aside class="preview-error" role="alert"><strong>API nicht erreichbar</strong><p><a href="/">Erneut versuchen</a></p></aside>`;
    }
  })();
} else {
  const hostedMatch = /^\/d\/([^/]+)$/.exec(pathNorm);
  if (hostedMatch) {
    const token = hostedMatch[1];
    void (async () => {
      let res: Response;
      try {
        res = await fetch(apiUrl(`/api/documents/${encodeURIComponent(token)}`));
      } catch {
        setPublicPageScroll(true);
        app.innerHTML = `<aside class="preview-error" role="alert"><strong>Netzwerkfehler</strong><p>API nicht erreichbar.</p><p><a href="/">Neues Dokument</a></p></aside>`;
        return;
      }
      if (!res.ok) {
        setPublicPageScroll(true);
        app.innerHTML = `<aside class="preview-error" role="alert"><strong>Dokument nicht verfügbar</strong><p>(${res.status})</p><p><a href="/">Neues Dokument</a></p></aside>`;
        return;
      }
      const data = (await res.json()) as {
        markdown: string;
        mode: "view" | "edit";
        slugView: string;
        slugEdit?: string;
      };
      initEditorAndPreview(data.markdown, {
        mode: data.mode,
        token,
        slugView: data.slugView,
        slugEdit: data.slugEdit
      });
    })();
  } else {
    document.title = "Seite nicht gefunden — DSABrew";
    setPublicPageScroll(true);
    app.innerHTML = `<aside class="preview-error" role="alert"><strong>Seite nicht gefunden</strong><p><a href="/">Neues Dokument anlegen</a></p></aside>`;
  }
}

initPrivacyStrip();
