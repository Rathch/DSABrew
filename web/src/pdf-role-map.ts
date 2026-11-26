/** PDF structure standard roles used in tagged export. */

export type PdfStructRole =
  | "Document"
  | "Part"
  | "Sect"
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "H5"
  | "H6"
  | "P"
  | "L"
  | "LI"
  | "Lbl"
  | "Link"
  | "TOC"
  | "TOCI"
  | "Table"
  | "THead"
  | "TBody"
  | "TR"
  | "TH"
  | "TD"
  | "Note"
  | "Figure"
  | "Caption"
  | "Span"
  | "Artifact";

const HEADING_TAG_TO_ROLE: Record<string, PdfStructRole> = {
  H1: "H1",
  H2: "H2",
  H3: "H3",
  H4: "H4",
  H5: "H5",
  H6: "H6"
};

export function headingRoleFromTag(tagName: string): PdfStructRole | null {
  return HEADING_TAG_TO_ROLE[tagName.toUpperCase()] ?? null;
}

/** Decorative / non-structural selectors — excluded from the accessibility tree. */
export const DECORATIVE_SELECTOR = [
  "[aria-hidden='true']",
  "[role='presentation']",
  ".toc-leader",
  ".dsa-gm-frame__cap",
  ".dsa-gm-frame__cap-img",
  ".book-footer-cluster--end",
  ".dsa-npc__template",
  ".impressum-scriptorium-banner-img"
].join(", ");

export function isDecorativeElement(el: Element): boolean {
  if (el.matches(DECORATIVE_SELECTOR)) {
    return true;
  }
  if (el instanceof HTMLImageElement) {
    const alt = el.getAttribute("alt");
    const role = el.getAttribute("role");
    if ((alt === "" || alt === null) && role !== "img") {
      return true;
    }
  }
  return false;
}
