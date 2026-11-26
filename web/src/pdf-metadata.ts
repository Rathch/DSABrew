const KEYWORDS_MAX_LEN = 2400;

function sanitizePdfText(s: string): string {
  return s.replace(/\0/g, "").replace(/\r/g, "").trim();
}

/** PDF document info + impressum fields extracted from the preview DOM. */
export interface PdfExportMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
  impressum: Record<string, string>;
}

/**
 * Document title for PDF metadata: project title (Impressum) → first content H1 → footer title.
 */
export function extractDocumentTitle(pages: NodeListOf<HTMLElement>): string {
  for (const page of pages) {
    const project = page.querySelector<HTMLElement>(".impressum-project-title");
    const pt = sanitizePdfText(project?.textContent ?? "");
    if (pt) {
      return pt;
    }
  }
  for (const page of pages) {
    for (const h1 of page.querySelectorAll<HTMLElement>("h1")) {
      if (h1.classList.contains("impressum-main-title")) {
        continue;
      }
      const t = sanitizePdfText(h1.textContent ?? "");
      if (t) {
        return t;
      }
    }
  }
  for (const page of pages) {
    const footer = page.querySelector<HTMLElement>(".book-footer-title");
    const ft = sanitizePdfText(footer?.textContent ?? "");
    if (ft) {
      return ft;
    }
  }
  return "DSABrew Export";
}

function extractImpressumSheet(sheet: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};

  const project = sanitizePdfText(sheet.querySelector(".impressum-project-title")?.textContent ?? "");
  if (project) {
    out.Projekttitel = project;
  }

  sheet.querySelectorAll<HTMLElement>(".impressum-field").forEach((field) => {
    const label = sanitizePdfText(field.querySelector(".impressum-field-label")?.textContent ?? "");
    const value = sanitizePdfText(field.querySelector(".impressum-field-value")?.textContent ?? "");
    if (label && value) {
      out[label] = value;
    }
  });

  const disclaimerParas = sheet.querySelectorAll<HTMLElement>(".impressum-disclaimer-text");
  disclaimerParas.forEach((p, idx) => {
    const t = sanitizePdfText(p.textContent ?? "");
    if (!t) {
      return;
    }
    const key = idx === 0 ? "Disclaimer" : idx === 1 ? "Copyright" : `Disclaimer ${idx + 1}`;
    out[key] = t;
  });

  const footer = sanitizePdfText(sheet.querySelector(".impressum-footer")?.textContent ?? "");
  if (footer) {
    out["Fußzeile Impressum"] = footer.replace(/\s+/g, " ").trim();
  }

  return out;
}

function findImpressumFields(pages: NodeListOf<HTMLElement>): Record<string, string> {
  for (const page of pages) {
    const sheet = page.querySelector<HTMLElement>(".impressum-sheet");
    if (sheet) {
      return extractImpressumSheet(sheet);
    }
  }
  return {};
}

function pickAuthor(impressum: Record<string, string>): string | undefined {
  return impressum.Autor ?? impressum.autor ?? impressum.Author ?? impressum["Autor/in"];
}

function pickSubject(impressum: Record<string, string>, title: string): string | undefined {
  const version =
    impressum["Version / Datum / Auflage"] ?? impressum.Version ?? impressum.version ?? undefined;
  if (version && version !== title) {
    return version;
  }
  return title !== "DSABrew Export" ? title : undefined;
}

/** Semicolon-separated label:value pairs for PDF Keywords. */
export function buildPdfKeywords(impressum: Record<string, string>): string | undefined {
  const entries = Object.entries(impressum).filter(([, v]) => v.trim().length > 0);
  if (entries.length === 0) {
    return undefined;
  }
  const raw = entries.map(([k, v]) => `${k}: ${v}`).join("; ");
  if (raw.length <= KEYWORDS_MAX_LEN) {
    return raw;
  }
  return `${raw.slice(0, KEYWORDS_MAX_LEN - 1)}…`;
}

export function extractPdfMetadata(pages: NodeListOf<HTMLElement>): PdfExportMetadata {
  const impressum = findImpressumFields(pages);
  const title = impressum.Projekttitel ?? extractDocumentTitle(pages);
  const author = pickAuthor(impressum);
  const subject = pickSubject(impressum, title);
  const keywords = buildPdfKeywords(impressum);

  return {
    title,
    author,
    subject,
    keywords,
    impressum
  };
}
