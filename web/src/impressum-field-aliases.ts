import { DEFAULT_IMPRESSUM_DATA, type ImpressumData } from "./impressum-config";

/**
 * Kurzformen für `{{impressumField alias=Wert}}` (zusätzlich zu den echten Keys in ImpressumData).
 * Keys werden case-insensitive gematcht.
 */
export const IMPRESSUM_FIELD_ALIASES: Record<string, keyof ImpressumData> = {
  version: "versionNumber",
  datum: "versionDate",
  auflage: "versionEdition",
  /** einzeilige Alternative zu den drei Teilen */
  versionzeile: "versionValue",
  autor: "authorValue",
  kontakt: "contactValue",
  illustration: "illustrationsValue",
  illustrationen: "illustrationsValue",
  illustrations: "illustrationsValue",
  lektorat: "lektoratValue",
  /** Gesamter Disclaimer-Haupttext (ein Absatz); Aliase disclaimerabsatz* sind synonym */
  disclaimer: "disclaimerBody",
  disclaimereinleitung: "disclaimerBody",
  disclaimerabsatz1: "disclaimerBody",
  disclaimerabsatz2: "disclaimerBody",
  disclaimer1: "disclaimerBody",
  disclaimer2: "disclaimerBody",
  /** Copyright-Zeile */
  copyrightprefix: "copyrightLinePrefix",
  copyrightjahr: "copyrightYear",
  copyrightname: "copyrightHolder"
};

/** Löst `key` zu einem `ImpressumData`-Feld auf (Alias oder kanonischer Key, case-insensitive). */
export function resolveImpressumFieldKey(raw: string): keyof ImpressumData | null {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (lower in IMPRESSUM_FIELD_ALIASES) {
    return IMPRESSUM_FIELD_ALIASES[lower];
  }
  const keys = Object.keys(DEFAULT_IMPRESSUM_DATA) as (keyof ImpressumData)[];
  return keys.find((k) => k.toLowerCase() === lower) ?? null;
}
