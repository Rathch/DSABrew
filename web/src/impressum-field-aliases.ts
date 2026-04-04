import { DEFAULT_IMPRESSUM_DATA, type ImpressumData } from "./impressum-config";

export const IMPRESSUM_FIELD_ALIASES: Record<string, keyof ImpressumData> = {
  version: "versionNumber",
  datum: "versionDate",
  auflage: "versionEdition",
  versionzeile: "versionValue",
  autor: "authorValue",
  kontakt: "contactValue",
  illustration: "illustrationsValue",
  illustrationen: "illustrationsValue",
  illustrations: "illustrationsValue",
  lektorat: "lektoratValue",
  disclaimer: "disclaimerBody",
  disclaimereinleitung: "disclaimerBody",
  disclaimerabsatz1: "disclaimerBody",
  disclaimerabsatz2: "disclaimerBody",
  disclaimer1: "disclaimerBody",
  disclaimer2: "disclaimerBody",
  copyrightprefix: "copyrightLinePrefix",
  copyrightjahr: "copyrightYear",
  copyrightname: "copyrightHolder"
};

export function resolveImpressumFieldKey(raw: string): keyof ImpressumData | null {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (lower in IMPRESSUM_FIELD_ALIASES) {
    return IMPRESSUM_FIELD_ALIASES[lower];
  }
  const keys = Object.keys(DEFAULT_IMPRESSUM_DATA) as (keyof ImpressumData)[];
  return keys.find((k) => k.toLowerCase() === lower) ?? null;
}
