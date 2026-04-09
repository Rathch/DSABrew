import type { ImpressumData } from "../../shared/impressum-default-data.js";
import { DEFAULT_IMPRESSUM_DATA } from "../../shared/impressum-default-data.js";
import { isUnsafeUrlScheme } from "./unsafe-url-schemes";

export type { ImpressumData };
export { DEFAULT_IMPRESSUM_DATA };

/** Public asset at `public/dsa/image16.png` (produced by `npm run prepare-assets`). */
function impressumBannerImageSrc(): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}dsa/image16.png`;
}

/**
 * Default data for the legal notice (impressum) page (after the cover).
 *
 * **Primarily customizable in Markdown** (per document):
 * - `{{impressumField key=value}}` — keys = `ImpressumData` or German short forms (`version`, `datum`, `auflage`, `autor`, `kontakt`, `illustration`, `lektorat`, `disclaimer`, …); see `impressum-field-aliases.ts` and `contracts/macros.md`.
 * - `{{impressumPage}}` — renders the block; field macros on the same page above it
 *
 * **Defaults here** (`DEFAULT_IMPRESSUM_DATA`) when no field macro is set.
 * Optional: `renderDocument(md, { impressum: { … } })` — overridden by field macros.
 */

export function mergeImpressum(partial?: Partial<ImpressumData>): ImpressumData {
  return { ...DEFAULT_IMPRESSUM_DATA, ...partial };
}

/** “Version / Date / Edition” line: prefers the three separate fields, otherwise `versionValue`. */
export function formatVersionDisplayLine(data: ImpressumData): string {
  const parts = [data.versionNumber, data.versionDate, data.versionEdition]
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" / ");
  }
  return data.versionValue.trim();
}

/** Safe href attributes (no executable URL schemes). */
export function safeHttpHref(url: string): string {
  const t = url.trim();
  if (isUnsafeUrlScheme(t)) {
    return "#";
  }
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t.replace(/^\/+/, "")}`;
  }
  return t;
}

export function renderImpressumHtml(data: ImpressumData, esc: (s: string) => string): string {
  const href = esc(safeHttpHref(data.footerWordTemplateUrl));

  const row = (label: string, value: string): string => `
    <div class="impressum-field">
      <div class="impressum-field-label">${esc(label)}</div>
      <div class="impressum-field-value">${esc(value)}</div>
    </div>`;

  return `
<div class="impressum-sheet">
  <header class="impressum-scriptorium-banner">
    <img
      class="impressum-scriptorium-banner-img"
      src="${esc(impressumBannerImageSrc())}"
      alt="${esc("Scriptorium Aventuris")}"
      decoding="async"
    />
  </header>
  <h1 class="impressum-main-title">${esc("IMPRESSUM")}</h1>
  <p class="impressum-project-title">${esc(data.projectTitle)}</p>
  ${row(data.versionLabel, formatVersionDisplayLine(data))}
  ${row(data.authorLabel, data.authorValue)}
  ${row(data.contactLabel, data.contactValue)}
  ${row(data.illustrationsLabel, data.illustrationsValue)}
  ${row(data.lektoratLabel, data.lektoratValue)}
  <section class="impressum-disclaimer" aria-label="Disclaimer">
    <h2 class="impressum-disclaimer-heading">${esc("Disclaimer")}</h2>
    <p class="impressum-disclaimer-text">${esc(data.disclaimerBody)}</p>
    <p class="impressum-disclaimer-text">${esc(data.copyrightLinePrefix)}<strong>${esc(data.copyrightYear)}</strong> ${esc("von")} <strong>${esc(data.copyrightHolder)}</strong>.</p>
  </section>
  <footer class="impressum-footer">
    ${esc(data.footerCreditsPrefix)} <a class="impressum-footer-link" href="${href}" rel="noopener noreferrer">${esc(data.footerWordTemplateLabel)}</a>${esc(data.footerCreditsSuffix)}
  </footer>
</div>`.trim();
}
