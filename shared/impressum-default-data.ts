/**
 * Shared default legal notice (impressum) data (web + server canonical hash).
 * Web-specific rendering: `web/src/impressum-config.ts`.
 */

export interface ImpressumData {
  /** Main line under “IMPRESSUM” (project title) */
  projectTitle: string;
  versionLabel: string;
  /** Single-line display if `versionNumber` / `versionDate` / `versionEdition` are all empty */
  versionValue: string;
  /** Parts for “Version / Date / Edition” (display: joined with “ / ”) */
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
  /** Disclaimer body (one paragraph under the disclaimer heading, before the copyright line) */
  disclaimerBody: string;
  /** Text before “Copyright <year> by <name>” in the following paragraph */
  copyrightLinePrefix: string;
  copyrightYear: string;
  copyrightHolder: string;
  footerCreditsPrefix: string;
  footerWordTemplateLabel: string;
  footerWordTemplateUrl: string;
  /** Text after the link, e.g. “ by Massimo Feth …” */
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
  authorValue: "Christian Rath-ulrich",
  contactLabel: "Kontakt",
  contactValue: "dsa@rath-ulrich.de",
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
