/**
 * Reine Hilfen und HTML-Strings für den App-Shell-Einstieg (`main.ts`).
 * Ermöglicht Unit-Tests ohne vollständigen Browser-Bootstrap.
 */
import { DATENSCHUTZ_BODY_HTML } from "./datenschutz-content";
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

export const A_CHROME = 'class="chrome-link"';
export const A_ERR = 'class="chrome-link chrome-link--danger"';
export const ERR_ASIDE = "dsabrew-err-aside";

const ICON_VIEW = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

const ICON_EDIT = `<svg class="hosted-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

export function landingFooterNav(navClass: string): string {
  return `
    <nav class="${navClass}" aria-label="Rechtliches und externe Links">
      <ul>
        <li><a href="/impressum" ${A_CHROME}>Impressum</a></li>
        <li><a href="/datenschutz" ${A_CHROME}>Datenschutz</a></li>
        <li><a href="${LINK_SCRIPTORIUM}" rel="noopener noreferrer" ${A_CHROME}>Scriptorium Aventuris</a></li>
        <li><a href="${LINK_ELF}" rel="noopener noreferrer" ${A_CHROME}>ELF (Ulisses)</a></li>
        <li><a href="${LINK_GPL}" rel="noopener noreferrer" ${A_CHROME}>GNU GPLv3</a></li>
        <li><a href="${LINK_GITHUB}" rel="noopener noreferrer" ${A_CHROME}>GitHub</a></li>
        <li><a href="${LINK_ISSUES_NEW}" rel="noopener noreferrer" ${A_CHROME}>Fehler melden</a></li>
      </ul>
    </nav>`;
}

export function siteChromeFooter(footerNavClass: string): string {
  return `<div class="site-chrome-footer">${landingFooterNav(footerNavClass)}${fanProductNoticeHtml()}</div>`;
}

export function buildMaintenancePageLayout(): string {
  return `
  <div class="legal-shell maintenance-shell">
    <header class="legal-header">
      <h1 class="legal-h1" id="legal-page-title">Wartung</h1>
      ${themeControlClusterHtml()}
    </header>
    <main class="legal-main" aria-labelledby="legal-page-title">
      <div class="legal-prose maintenance-prose">
        <p>
          Neue Dokumente können derzeit <strong>nicht angelegt</strong> werden — die Dienstlast ist zu hoch.
          Bestehende Dokumente sind weiterhin über Ihren Link erreichbar.
        </p>
        <p class="maintenance-hint">Bitte versuchen Sie es in einigen Minuten erneut.</p>
      </div>
      <p class="legal-back"><a href="/" class="chrome-link">Seite aktualisieren</a></p>
    </main>
    ${siteChromeFooter("chrome-footer-nav chrome-footer-nav--bordered-strong")}
  </div>
`;
}

export function buildLegalPageLayout(kind: "impressum" | "datenschutz"): string {
  const title = kind === "impressum" ? "Impressum" : "Datenschutz";
  const body =
    kind === "impressum"
      ? `<div class="legal-prose">
      <address class="legal-impressum-address">
        <p class="legal-impressum-name">Christian Rath-Ulrich</p>
        <p>Ernst-Mühlendyckstr 2<br />51143 Köln</p>
        <p>
          <a href="mailto:kontakt@rath-ulrich.de" ${A_CHROME}>kontakt@rath-ulrich.de</a>
        </p>
      </address>
    </div>`
      : DATENSCHUTZ_BODY_HTML;
  return `
  <div class="legal-shell">
    <header class="legal-header">
      <h1 class="legal-h1" id="legal-page-title">${title}</h1>
      ${themeControlClusterHtml()}
    </header>
    <main class="legal-main" aria-labelledby="legal-page-title">
      ${body}
      <p class="legal-back"><a href="/" ${A_CHROME}>← Neues Dokument</a></p>
    </main>
    ${siteChromeFooter("chrome-footer-nav chrome-footer-nav--bordered-strong")}
  </div>
`;
}

export function hostedChromeToolsHtml(): string {
  return `
    <div class="hosted-chrome-tools">
      <div class="editor__sync-bar" id="editor-sync-bar" hidden>
        <label class="editor__sync-label" for="scroll-link-toggle">
          <input type="checkbox" id="scroll-link-toggle" checked />
          Scroll koppeln
        </label>
      </div>
      ${themeControlClusterHtml()}
    </div>`;
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
          <button type="button" id="pdf-btn-banner" class="ui-toolbar-btn ui-toolbar-btn--secondary" aria-label="PDF speichern">PDF speichern</button>
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
      </div>
    </div>
    <section class="${editorClasses}" aria-label="${options.mode === "view" ? "Nur Lesen — Quelltext nicht bearbeitbar" : "Markdown-Editor"}">
      <h2 class="editor__visually-hidden">Markdown</h2>
      <p id="save-status" class="editor__flash" aria-live="polite"></p>
      <div id="md-toolbar" class="md-toolbar-wrap"></div>
      <div class="editor__input-row">
        <div class="editor__line-numbers-host" id="editor-line-numbers-host" aria-hidden="true">
          <div class="editor__line-numbers-scroll" id="editor-line-numbers-scroll">
            <pre class="editor__line-numbers-inner" id="editor-line-numbers-inner"></pre>
          </div>
        </div>
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
