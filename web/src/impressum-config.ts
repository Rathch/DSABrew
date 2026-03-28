/** Öffentliches Asset unter `public/dsa/image16.png` (wird von `npm run prepare-assets` erzeugt). */
function impressumBannerImageSrc(): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}dsa/image16.png`;
}

/**
 * Standard-Daten für die Impressum-Seite (nach dem Einband).
 *
 * **Primär anpassbar im Markdown** (pro Dokument):
 * - `{{impressumField key=value}}` — Keys = `ImpressumData` oder deutsche Kurzformen (`version`, `datum`, `auflage`, `autor`, `kontakt`, `illustration`, `lektorat`, `disclaimer`, …); siehe `impressum-field-aliases.ts` und `contracts/macros.md`.
 * - `{{impressumPage}}` — rendert den Block; Feld-Makros auf derselben Seite darüber
 *
 * **Defaults hier** (`DEFAULT_IMPRESSUM_DATA`), wenn kein Feld-Makro gesetzt ist.
 * Optional: `renderDocument(md, { impressum: { … } })` — wird von Feld-Makros überschrieben.
 */
export interface ImpressumData {
  /** Hauptzeile unter „IMPRESSUM“ (Projekttitel) */
  projectTitle: string;
  versionLabel: string;
  /** Einzeilige Anzeige, falls `versionNumber`/`versionDate`/`versionEdition` alle leer sind */
  versionValue: string;
  /** Einzelteile für „Version / Datum / Auflage“ (Anzeige: mit „ / “ verbunden) */
  versionNumber: string;
  versionDate: string;
  versionEdition: string;
  authorLabel: string;
  authorValue: string;
  contactLabel: string;
  contactValue: string;
  illustrationsLabel: string;
  illustrationsValue: string;
  lektoratLabel: string;
  lektoratValue: string;
  /** Disclaimer-Haupttext (ein Absatz unter der Disclaimer-Überschrift, vor der Copyright-Zeile) */
  disclaimerBody: string;
  /** Text vor „Copyright <Jahr> von <Name>“ im Absatz danach */
  copyrightLinePrefix: string;
  copyrightYear: string;
  copyrightHolder: string;
  footerCreditsPrefix: string;
  footerWordTemplateLabel: string;
  footerWordTemplateUrl: string;
  /** Text nach dem Link, z. B. „ von Massimo Feth …“ */
  footerCreditsSuffix: string;
}

export const DEFAULT_IMPRESSUM_DATA: ImpressumData = {
  projectTitle: "Abenteuerliche Beschreibung",
  versionLabel: "Version / Datum / Auflage",
  versionValue: "Version 1.4 / 15.10.2017 / 5. Auflage",
  versionNumber: "Version 1.4",
  versionDate: "15.10.2017",
  versionEdition: "5. Auflage",
  authorLabel: "Autor",
  authorValue: "Massimo Feth",
  contactLabel: "Kontakt",
  contactValue: "blog@fethz.de",
  illustrationsLabel: "Illustrationen",
  illustrationsValue: "Lorem Ipsum, Dolor Sit, Amet Consetetur",
  lektoratLabel: "Lektorat / Korrekturen",
  lektoratValue: "Lorem Ipsum, Dolor Sit, Amet Consetetur",
  disclaimerBody:
    "Das vorliegende Werk verwendet das Regelwerk „Das Schwarze Auge“ (DSA) und die Spielwelt Aventuria. Beide sind geistiges Eigentum von Ulisses Spiele GmbH. " +
    "Die Nutzung erfolgt im Rahmen der Fan-Richtlinien bzw. der vertraglichen Regelungen mit Ulisses Spiele. Weitere Informationen: www.ulisses-spiele.de. " +
    "„Das Schwarze Auge“, „Aventuria“, „Scriptorium Aventuris“ und zugehörige Marken sind eingetragene Marken der Ulisses Spiele GmbH.",
  copyrightLinePrefix: "Alle anderen Originalmaterialien in diesem Werk sind Copyright ",
  copyrightYear: "2017",
  copyrightHolder: "NAME HIER EINTRAGEN",
  footerCreditsPrefix: "Credits / Dieses Produkt basiert auf der",
  footerWordTemplateLabel: "Microsoft Word-Vorlage",
  footerWordTemplateUrl: "https://blog.fethz.de",
  footerCreditsSuffix: " von Massimo Feth (blog.fethz.de)."
};

export function mergeImpressum(partial?: Partial<ImpressumData>): ImpressumData {
  return { ...DEFAULT_IMPRESSUM_DATA, ...partial };
}

/** Zeile „Version / Datum / Auflage“: bevorzugt die drei Einzelfelder, sonst `versionValue`. */
export function formatVersionDisplayLine(data: ImpressumData): string {
  const parts = [data.versionNumber, data.versionDate, data.versionEdition]
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" / ");
  }
  return data.versionValue.trim();
}

/** Sichere href-Attribute (kein javascript:). */
export function safeHttpHref(url: string): string {
  const t = url.trim();
  if (/^javascript:/i.test(t)) {
    return "#";
  }
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t.replace(/^\/+/, "")}`;
  }
  return t;
}

/**
 * Statisches HTML für die Impressum-Seite. `esc` = z. B. markdown-it `escapeHtml`.
 */
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
