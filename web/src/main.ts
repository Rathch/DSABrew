import "./style.css";
import listBulletUrl from "@media/image1.png?url";
import { attachMarkdownToolbar } from "./markdown-toolbar";
import { exportPreviewToPdf } from "./pdf-export";
import { renderDocument } from "./renderer";
import { setupEditorPreviewScrollSync } from "./scroll-sync";
import { updateEditorPageStripeBackground } from "./editor-page-stripes";
import { setupEditorLineNumbers } from "./editor-line-numbers";
import {
  A_ERR,
  ERR_ASIDE,
  absoluteDocUrl,
  apiUrl,
  buildAnleitungPageLayout,
  buildDocumentLayout,
  buildLegalPageLayout,
  buildMaintenancePageLayout,
  copyTextToClipboard,
  defaultHostedView,
  effectiveHostedViewPref,
  escapeHtml,
  matchHostedDocToken,
  migrateOldHostedPrefsFromValues,
  normalizeAppPathname,
  scrollPreviewToElementById,
  type HostedViewPref
} from "./main-helpers";
import { buildOpsStatusPageLayout, wireOpsStatusPage } from "./ops-status-page";
import {
  applyThemePreference,
  getThemePreference,
  initThemeMediaListener,
  setThemePreference,
  syncThemeToggleButtons
} from "./theme";

document.documentElement.style.setProperty(
  "--dsa-list-bullet-url",
  `url(${JSON.stringify(listBulletUrl)})`
);

const app =
  document.querySelector<HTMLDivElement>("#app") ??
  (() => {
    throw new Error("Missing #app root element");
  })();

initThemeMediaListener();
applyThemePreference(getThemePreference());

/* Capture phase: also runs when a child uses `stopPropagation` (e.g. toolbar). */
document.addEventListener(
  "click",
  (e: MouseEvent) => {
    const t = e.target;
    if (!(t instanceof Element)) {
      return;
    }
    const btn = t.closest<HTMLButtonElement>("[data-theme-btn]");
    if (!btn || !app.contains(btn)) {
      return;
    }
    const m = btn.dataset.themeBtn;
    if (m !== "light" && m !== "dark") {
      return;
    }
    const cur = getThemePreference();
    if (m === "light") {
      setThemePreference(cur === "light" ? "system" : "light");
    } else {
      setThemePreference(cur === "dark" ? "system" : "dark");
    }
  },
  true
);

const BODY_SCROLLABLE_CLASS = "dsabrew-body--scrollable";
const STRIP_VISIBLE_CLASS = "dsabrew-privacy-strip-visible";
const LS_PRIVACY_STRIP_DISMISSED = "dsabrew-privacy-strip-dismissed";

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

const APP_VERSION = String(import.meta.env.VITE_APP_VERSION ?? "0.0.0");
const PUBLIC_API_BASE = import.meta.env.VITE_PUBLIC_API_BASE as string | undefined;

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
    const url = absoluteDocUrl(slugView, window.location.origin);
    const ok = await copyTextToClipboard(url);
    if (feedbackEl) {
      feedbackEl.textContent = ok ? "Nur-Ansicht-Link kopiert" : url;
    }
  });

  shareEdit?.addEventListener("click", async () => {
    if (!slugEdit) {
      return;
    }
    const url = absoluteDocUrl(slugEdit, window.location.origin);
    const ok = await copyTextToClipboard(url);
    if (feedbackEl) {
      feedbackEl.textContent = ok ? "Bearbeiten-Link kopiert" : url;
    }
  });
}

const LS_HOSTED_VIEW = "dsabrew-hosted-view";
/** @deprecated migration from older keys only */
const LS_HOSTED_PANE = "dsabrew-hosted-pane";
/** @deprecated migration from older keys only */
const LS_HOSTED_FOCUS = "dsabrew-hosted-focus";
const HOSTED_NARROW_MQ = "(max-width: 960px)";

function migrateOldHostedPrefs(): HostedViewPref | null {
  return migrateOldHostedPrefsFromValues(
    localStorage.getItem(LS_HOSTED_PANE),
    localStorage.getItem(LS_HOSTED_FOCUS)
  );
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

  /* Explizite Bindings: TS schließt in verschachtelten Closures nicht, dass querySelector hier non-null ist. */
  const layoutBtn = btnLayout;
  const mdBtn = btnMd;
  const pvBtn = btnPv;

  const segBtns = [layoutBtn, mdBtn, pvBtn] as const;

  function setSegActive(activeIndex: number): void {
    segBtns.forEach((b, i) => {
      const on = i === activeIndex;
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

  function applyHostedViewState(): void {
    const raw =
      docMode === "view" ? "preview" : readHostedViewPref() ?? defaultHostedView(docMode);
    const v = effectiveHostedViewPref(raw, docMode, mq.matches);
    layout.classList.toggle("layout--hosted-narrow", mq.matches);
    layoutBtn.hidden = mq.matches;
    applyViewPref(v);
    notifyLayoutChanged();
  }

  function persistAndApply(v: HostedViewPref): void {
    const next = effectiveHostedViewPref(v, docMode, mq.matches);
    if (docMode !== "view") {
      localStorage.setItem(LS_HOSTED_VIEW, next);
    }
    applyViewPref(next);
    notifyLayoutChanged();
  }

  layoutBtn.addEventListener("click", () => persistAndApply("layout"));
  mdBtn.addEventListener("click", () => persistAndApply("markdown"));
  pvBtn.addEventListener("click", () => persistAndApply("preview"));

  mq.addEventListener("change", applyHostedViewState);
  applyHostedViewState();
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
  app.innerHTML = buildDocumentLayout({ mode: options.mode }, APP_VERSION);
  syncThemeToggleButtons();

  const input = document.querySelector<HTMLTextAreaElement>("#markdown-input");
  const preview = document.querySelector<HTMLElement>("#preview");
  const toolbarRoot = document.querySelector<HTMLElement>("#md-toolbar");
  const saveStatus = document.querySelector<HTMLElement>("#save-status");

  if (!input || !preview || !toolbarRoot) {
    throw new Error("Failed to initialize app UI");
  }

  input.value = initialMarkdown;

  const lineNumbersScroll = document.querySelector<HTMLElement>("#editor-line-numbers-scroll");
  const lineNumbersInner = document.querySelector<HTMLElement>("#editor-line-numbers-inner");
  const lineNumbersHost = document.querySelector<HTMLElement>("#editor-line-numbers-host");
  if (lineNumbersScroll && lineNumbersInner && lineNumbersHost) {
    setupEditorLineNumbers(input, lineNumbersScroll, lineNumbersInner, lineNumbersHost);
  }
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

  const updatePreview = (markdown: string): void => {
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
          const einbandStyle =
            page.einbandCustomHex != null && page.einbandCustomHex.length > 0
              ? ` style="--page-einband-bg: ${escapeHtml(page.einbandCustomHex)}"`
              : "";
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
      <article class="a4-page${chrome}${singleCol}${footerClass}"${einbandStyle}>
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
      preview.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>Vorschau fehlgeschlagen</strong><pre class="dsabrew-err-aside__pre">${escapeHtml(msg)}</pre></aside>`;
    }
  };

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

  const persistMarkdown = async (markdown: string): Promise<void> => {
    if (options.mode !== "edit") {
      return;
    }
    const url = apiUrl(`/api/documents/${encodeURIComponent(options.token)}`, PUBLIC_API_BASE);
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
  };

  const scheduleHostedSave = (): void => {
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
  };

  const flushHostedSave = (): void => {
    if (options.mode !== "edit") {
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const url = apiUrl(`/api/documents/${encodeURIComponent(options.token)}`, PUBLIC_API_BASE);
    const body = JSON.stringify({ markdown: input.value });
    void fetch(url, {
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body
    }).catch(() => {});
  };

  input.addEventListener("input", () => {
    updatePreview(input.value);
    scheduleHostedSave();
    updateEditorPageStripeBackground(input);
  });

  window.addEventListener("pagehide", flushHostedSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushHostedSave();
    }
  });

  const pdfBanner = document.querySelector<HTMLButtonElement>("#pdf-btn-banner");

  const runPdfExport = async (): Promise<void> => {
    const prevBanner = pdfBanner?.textContent;
    if (pdfBanner) {
      pdfBanner.disabled = true;
      pdfBanner.textContent = "PDF wird erstellt…";
    }
    try {
      await exportPreviewToPdf(preview, {
        onProgress: (cur, tot) => {
          const t = `PDF… Seite ${cur}/${tot}`;
          if (pdfBanner) {
            pdfBanner.textContent = t;
          }
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      window.alert(`PDF-Export fehlgeschlagen:\n${msg}`);
    } finally {
      if (pdfBanner) {
        pdfBanner.disabled = false;
        pdfBanner.textContent = prevBanner ?? "PDF speichern";
      }
    }
  };

  pdfBanner?.addEventListener("click", () => void runPdfExport());

  updatePreview(input.value);
  updateEditorPageStripeBackground(input);
  syncThemeToggleButtons();
}

function renderLegalPage(kind: "impressum" | "datenschutz"): void {
  document.title = kind === "impressum" ? "Impressum — DSABrew" : "Datenschutz — DSABrew";
  setPublicPageScroll(true);
  app.innerHTML = buildLegalPageLayout(kind);
  syncThemeToggleButtons();
}

const path = normalizeAppPathname(window.location.pathname);

if (path === "/impressum") {
  renderLegalPage("impressum");
} else if (path === "/datenschutz") {
  renderLegalPage("datenschutz");
} else if (path === "/anleitung") {
  document.title = "Anleitung — DSABrew";
  setPublicPageScroll(true);
  app.innerHTML = buildAnleitungPageLayout();
  syncThemeToggleButtons();
} else if (path === "/ops") {
  document.title = "Betrieb — DSABrew";
  setPublicPageScroll(true);
  app.innerHTML = buildOpsStatusPageLayout();
  wireOpsStatusPage(app, PUBLIC_API_BASE);
  syncThemeToggleButtons();
} else if (path === "/" || path === "/new") {
  void (async () => {
    try {
      const r = await fetch(apiUrl("/api/documents", PUBLIC_API_BASE), { method: "POST" });
      if (r.status === 503) {
        setPublicPageScroll(true);
        document.title = "Wartung — DSABrew";
        app.innerHTML = buildMaintenancePageLayout();
        syncThemeToggleButtons();
        return;
      }
      if (!r.ok) {
        setPublicPageScroll(true);
        document.title = "DSABrew";
        app.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>Neues Dokument fehlgeschlagen</strong><p>HTTP ${r.status}</p><p><a href="/" ${A_ERR}>Erneut versuchen</a></p></aside>`;
        return;
      }
      const j = (await r.json()) as { slugEdit: string };
      window.location.replace(`/d/${encodeURIComponent(j.slugEdit)}`);
    } catch {
      setPublicPageScroll(true);
      document.title = "DSABrew";
      app.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>API nicht erreichbar</strong><p><a href="/" ${A_ERR}>Erneut versuchen</a></p></aside>`;
    }
  })();
} else {
  const token = matchHostedDocToken(path);
  if (token) {
    void (async () => {
      let res: Response;
      try {
        res = await fetch(apiUrl(`/api/documents/${encodeURIComponent(token)}`, PUBLIC_API_BASE));
      } catch {
        setPublicPageScroll(true);
        app.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>Netzwerkfehler</strong><p>API nicht erreichbar.</p><p><a href="/" ${A_ERR}>Neues Dokument</a></p></aside>`;
        return;
      }
      if (!res.ok) {
        setPublicPageScroll(true);
        app.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>Dokument nicht verfügbar</strong><p>(${res.status})</p><p><a href="/" ${A_ERR}>Neues Dokument</a></p></aside>`;
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
    app.innerHTML = `<aside class="${ERR_ASIDE}" role="alert"><strong>Seite nicht gefunden</strong><p><a href="/" ${A_ERR}>Neues Dokument anlegen</a></p></aside>`;
  }
}

initPrivacyStrip();
