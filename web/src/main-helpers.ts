/**
 * Reine Hilfen und HTML-Strings für den App-Shell-Einstieg (`main.ts`).
 * Ermöglicht Unit-Tests ohne vollständigen Browser-Bootstrap.
 */
import { ANLEITUNG_BODY_HTML } from "./anleitung-content";
import { DATENSCHUTZ_BODY_HTML } from "./datenschutz-content";
import { IMPRESSUM_BODY_HTML } from "./impressum-content";
import { fanProductNoticeHtml } from "./fan-product-notice";
import { themeControlClusterHtml } from "./theme";

export function apiUrl(path: string, vitePublicApiBase: string | undefined): string {
  const base = vitePublicApiBase?.replace(/\/$/, "") ?? "";
  if (base) {
    return `${base}${path}`;
  }
  return path;
}

export function absoluteDocUrl(slug: string, origin: string): string {
  return new URL(`/d/${encodeURIComponent(slug)}`, origin).href;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
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

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function scrollPreviewToElementById(
  preview: HTMLElement,
  id: string,
  behavior: ScrollBehavior,
  getElementById: (id: string) => HTMLElement | null = (i) => document.getElementById(i)
): void {
  const el = getElementById(id);
  if (!el || !preview.contains(el)) {
    return;
  }
  el.scrollIntoView({ behavior, block: "start" });
}

export const LINK_SCRIPTORIUM = "https://www.ulisses-ebooks.de/cc/7/scriptoriumaventuris";
export const LINK_ELF = "https://elf.ulisses-spiele.de/";
export const LINK_GPL = "https://www.gnu.org/licenses/gpl-3.0.html";
export const LINK_GITHUB = "https://github.com/Rathch/DSABrew";
export const LINK_ISSUES_NEW = "https://github.com/Rathch/DSABrew/issues/new";
export const LINK_BUYMEACOFFEE = "https://buymeacoffee.com/rathch";

export const A_CHROME = 'class="chrome-link"';
/** Footer-/Site-Nav-Links: neuer Tab (Impressum, Datenschutz, externe URLs). */
export const A_CHROME_BLANK = 'class="chrome-link" target="_blank" rel="noopener noreferrer"';
export const A_ERR = 'class="chrome-link chrome-link--danger"';
export const ERR_ASIDE = "dsabrew-err-aside";

const ICON_VIEW = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

const ICON_EDIT = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

const ICON_HELP = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm.1 15.25a1.15 1.15 0 110-2.3 1.15 1.15 0 010 2.3zM14.6 10.4l-.72.73c-.57.58-.93 1.04-.93 2.12h-2c0-1.38.36-2.27 1.22-3.14l.99-1c.3-.29.49-.7.49-1.16a1.7 1.7 0 10-3.4 0H8.25a3.7 3.7 0 117.4 0c0 .99-.4 1.88-1.05 2.55z"/></svg>`;

const ICON_PDF = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l4 4v16H6V2zm8 1.5V7h3.5L14 3.5zM9 12h2.2c1.1 0 1.8.6 1.8 1.6s-.7 1.6-1.8 1.6H10v1.8H9V12zm1 2.3h1.1c.45 0 .8-.2.8-.7s-.35-.7-.8-.7H10v1.4zm4.1-2.3h1.7c1.35 0 2.2.86 2.2 2.45 0 1.6-.85 2.55-2.2 2.55h-1.7V12zm1 4.1h.6c.9 0 1.3-.52 1.3-1.65 0-1.03-.4-1.55-1.3-1.55h-.6v3.2z"/></svg>`;

export function landingFooterNav(navClass: string): string {
  return `
    <nav class="${navClass}" aria-label="Rechtliches und externe Links">
      <ul>
        <li><a href="/impressum" ${A_CHROME_BLANK}>Impressum</a></li>
        <li><a href="/datenschutz" ${A_CHROME_BLANK}>Datenschutz</a></li>
        <li><a href="/anleitung" ${A_CHROME_BLANK}>Anleitung</a></li>
        <li><a href="${LINK_SCRIPTORIUM}" ${A_CHROME_BLANK}>Scriptorium Aventuris</a></li>
        <li><a href="${LINK_ELF}" ${A_CHROME_BLANK}>ELF (Ulisses)</a></li>
        <li><a href="${LINK_GPL}" ${A_CHROME_BLANK}>GNU GPLv3</a></li>
        <li><a href="${LINK_GITHUB}" ${A_CHROME_BLANK}>GitHub</a></li>
        <li><a href="${LINK_BUYMEACOFFEE}" ${A_CHROME_BLANK}>Buy Me a Coffee</a></li>
        <li><a href="${LINK_ISSUES_NEW}" ${A_CHROME_BLANK}>Fehler melden</a></li>
      </ul>
    </nav>`;
}

export function siteChromeFooter(footerNavClass: string): string {
  return `<div class="site-chrome-footer">${landingFooterNav(footerNavClass)}${fanProductNoticeHtml()}</div>`;
}

export function hostedChromeToolsHtml(options?: { includeHelp?: boolean }): string {
  const help =
    options?.includeHelp === false
      ? ""
      : `
      <a
        href="/anleitung"
        id="hosted-anleitung-link"
        class="hosted-anleitung-link ui-toolbar-btn ui-toolbar-btn--secondary"
        target="_blank"
        rel="noopener noreferrer"
        >${ICON_HELP}<span>Hilfe / Anleitung</span></a>`;
  return `
    <div class="hosted-chrome-tools">
      ${help}
      ${themeControlClusterHtml()}
    </div>`;
}

const STATIC_PAGE_NEW_DOC = `<a href="/" class="ui-toolbar-btn ui-toolbar-btn--cta hosted-doc-nav__new-btn"><span class="hosted-doc-nav__new-icon" aria-hidden="true">+</span><span>Neues Dokument</span></a>`;

/**
 * Statische Seiten (Impressum, Datenschutz, Anleitung, Wartung, /ops): gleiche Shell wie die Dokument-Hauptseite
 * (layout-host, Banner, Doc-Nav, Hosted-Footer).
 */
export function staticHostedPageShellHtml(
  pageTitle: string,
  contentHtml: string,
  backParagraphHtml: string = "",
  options?: { hostExtraClass?: string; chromeTools?: { includeHelp?: boolean } }
): string {
  const safeTitle = escapeHtml(pageTitle);
  const hostClass = ["layout-host", "layout-host--hosted", "layout-host--static"]
    .concat(options?.hostExtraClass ? [options.hostExtraClass] : [])
    .join(" ");
  return `
  <div class="${hostClass}">
  <main class="layout layout--hosted layout--hosted-bg layout--static-page" aria-labelledby="static-page-title">
    <div class="hosted-banner hosted-banner--static-page">
      <div class="hosted-banner__brand">
        <div class="hosted-banner__title-row">
          <span class="hosted-banner__product">DSABrew</span>
          <h1 class="hosted-banner__static-h1" id="static-page-title">${safeTitle}</h1>
        </div>
      </div>
      <nav class="hosted-doc-nav hosted-doc-nav--static-page" aria-label="Seitennavigation">
        <div class="hosted-doc-nav__center">
          ${STATIC_PAGE_NEW_DOC}
        </div>
        <div class="hosted-doc-nav__right">${hostedChromeToolsHtml(options?.chromeTools)}</div>
      </nav>
    </div>
    <div class="static-page-main">
      ${contentHtml}
      ${backParagraphHtml}
    </div>
  </main>
    <footer class="hosted-doc-footer" role="contentinfo">
      ${siteChromeFooter("chrome-footer-nav chrome-footer-nav--bordered")}
    </footer>
  </div>`;
}

export function buildMaintenancePageLayout(): string {
  return staticHostedPageShellHtml(
    "Wartung",
    `<div class="legal-prose maintenance-prose">
      <p>
        Neue Dokumente können derzeit <strong>nicht angelegt</strong> werden — die Dienstlast ist zu hoch.
        Bestehende Dokumente sind weiterhin über Ihren Link erreichbar.
      </p>
      <p class="maintenance-hint">Bitte versuchen Sie es in einigen Minuten erneut.</p>
    </div>`,
    `<p class="legal-back"><a href="/" class="chrome-link">Seite aktualisieren</a></p>`,
    { hostExtraClass: "maintenance-shell" }
  );
}

export function buildAnleitungPageLayout(): string {
  return staticHostedPageShellHtml("Anleitung", ANLEITUNG_BODY_HTML, "", {
    chromeTools: { includeHelp: false }
  });
}

export function buildLegalPageLayout(kind: "impressum" | "datenschutz"): string {
  const title = kind === "impressum" ? "Impressum" : "Datenschutz";
  const body = kind === "impressum" ? IMPRESSUM_BODY_HTML : DATENSCHUTZ_BODY_HTML;
  return staticHostedPageShellHtml(title, body);
}

export function buildDocumentLayout(options: { mode: "view" | "edit" }, appVersion: string): string {
  const editorClasses =
    options.mode === "view" ? "editor editor--readonly" : "editor";
  const shareEditBtn =
    options.mode === "edit"
      ? `<button type="button" id="share-edit-btn" class="ui-toolbar-btn ui-toolbar-btn--secondary">${ICON_EDIT}<span>Teilen: Bearbeiten</span></button>`
      : "";
  const segLayout = `class="ui-segment-btn" aria-pressed="false"`;
  const segMd =
    options.mode === "edit"
      ? `class="ui-segment-btn" aria-pressed="true"`
      : `class="ui-segment-btn" aria-pressed="false"`;
  const segPv =
    options.mode === "view"
      ? `class="ui-segment-btn" aria-pressed="true"`
      : `class="ui-segment-btn" aria-pressed="false"`;
  const hostedSingleInit =
    options.mode === "edit"
      ? "layout--view-single layout--focus-editor"
      : "layout--view-single layout--focus-preview";
  return `
  <div class="layout-host layout-host--hosted">
  <main class="layout layout--hosted layout--hosted-bg ${hostedSingleInit}">
    <div class="hosted-banner">
      <div class="hosted-banner__brand">
        <div class="hosted-banner__title-row">
          <h1 class="hosted-banner__title">
            <span class="hosted-banner__product">DSABrew</span>
            <span class="hosted-banner__version" title="Build-Version">${escapeHtml(appVersion)}</span>
          </h1>
          <span class="hosted-banner__subtitle">${options.mode === "view" ? "Nur Lesen" : "Bearbeiten — Autosave"}</span>
        </div>
      </div>
      <nav class="hosted-doc-nav" aria-label="Dokumentnavigation">
        <div class="hosted-doc-nav__left" role="toolbar" aria-label="Teilen und Export">
          <button type="button" id="share-view-btn" class="ui-toolbar-btn ui-toolbar-btn--secondary">${ICON_VIEW}<span>Teilen: Nur Ansicht</span></button>
          ${shareEditBtn}
          <button type="button" id="pdf-btn-banner" class="ui-toolbar-btn ui-toolbar-btn--secondary" aria-label="PDF speichern">${ICON_PDF}<span>PDF speichern</span></button>
        </div>
        <div class="hosted-doc-nav__center">
          <button type="button" id="hosted-new-btn" class="ui-toolbar-btn ui-toolbar-btn--cta hosted-doc-nav__new-btn">
            <span class="hosted-doc-nav__new-icon" aria-hidden="true">+</span>
            <span>Neues Dokument</span>
          </button>
        </div>
        <div class="hosted-doc-nav__right">${hostedChromeToolsHtml()}</div>
      </nav>
      <div class="hosted-view-controls" role="region" aria-label="Ansicht">
        <div class="hosted-view-toolbar">
          <span class="hosted-view-label" id="hosted-view-label">Ansicht</span>
          <div class="hosted-view-radiogroup" role="radiogroup" aria-labelledby="hosted-view-label">
            <button type="button" ${segLayout} id="hosted-view-layout">Beides</button>
            <button type="button" ${segMd} id="hosted-view-md">Nur Markdown</button>
            <button type="button" ${segPv} id="hosted-view-preview">Nur Vorschau</button>
          </div>
        </div>
        <div class="editor__sync-bar editor__sync-bar--hosted" id="editor-sync-bar" hidden>
          <label class="editor__sync-label" for="scroll-link-toggle">
            <input type="checkbox" id="scroll-link-toggle" checked />
            Scroll koppeln
          </label>
        </div>
      </div>
    </div>
    <section class="${editorClasses}" aria-label="${options.mode === "view" ? "Nur Lesen — Quelltext nicht bearbeitbar" : "Markdown-Editor"}">
      <h2 class="editor__visually-hidden">Markdown</h2>
      <p id="save-status" class="editor__flash" aria-live="polite"></p>
      <div id="md-toolbar" class="md-toolbar-wrap"></div>
      <div class="editor__input-row">
        <div class="editor__viewport-gutter" id="editor-viewport-gutter" hidden aria-hidden="true">
          <div class="editor__viewport-gutter-inner" id="editor-viewport-gutter-inner">
            <div class="editor__viewport-gutter-track" id="editor-viewport-gutter-track">
              <div class="editor__viewport-gutter-pages" id="editor-viewport-gutter-pages" aria-hidden="true"></div>
              <div class="editor__viewport-gutter-range" id="editor-viewport-gutter-range"></div>
            </div>
          </div>
        </div>
        <textarea id="markdown-input" spellcheck="false" aria-label="Markdown-Quelltext"></textarea>
      </div>
    </section>
    <section class="preview" id="preview" tabindex="0" aria-label="Dokumentvorschau"></section>
  </main>
    <footer class="hosted-doc-footer" role="contentinfo">
      ${siteChromeFooter("chrome-footer-nav chrome-footer-nav--bordered")}
    </footer>
  </div>
`;
}

export type HostedViewPref = "layout" | "markdown" | "preview";

export function defaultHostedView(docMode: "view" | "edit"): HostedViewPref {
  return docMode === "edit" ? "layout" : "preview";
}

/**
 * Schmale Viewports (Issue #16): „Beides“ (zwei Spalten) ist unbenutzbar — stattdessen
 * ein Panel: Bearbeiten → „Nur Markdown“, Nur-Lesen → „Nur Vorschau“.
 */
export function effectiveHostedViewPref(
  pref: HostedViewPref,
  docMode: "view" | "edit",
  isNarrow: boolean
): HostedViewPref {
  if (!isNarrow || pref !== "layout") {
    return pref;
  }
  return docMode === "edit" ? "markdown" : "preview";
}

/** Reine Migration alter localStorage-Schlüssel → aktuelle `HostedViewPref`. */
export function migrateOldHostedPrefsFromValues(
  pane: string | null,
  focus: string | null
): HostedViewPref | null {
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

/** Trailing Slash entfernen; leerer Pfad → `/`. */
export function normalizeAppPathname(pathname: string): string {
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p || "/";
}

/** Token aus `/d/{token}` oder `null`. */
export function matchHostedDocToken(pathNorm: string): string | null {
  const m = /^\/d\/([^/]+)$/.exec(pathNorm);
  return m ? m[1] : null;
}
