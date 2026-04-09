import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAnchorToPageMap,
  defaultPdfFilename,
  exportPreviewToPdf,
  inferFontStyle,
  isAllowedLinkHref,
  pxToPt,
  rectToPdfMm,
  sanitizePdfText
} from "../src/pdf-export";

describe("pxToPt", () => {
  it("wandelt CSS-Pixel in Punkt um (96 dpi)", () => {
    expect(pxToPt(96)).toBe(72);
    expect(pxToPt(48)).toBe(36);
  });
});

describe("inferFontStyle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubCs(weight: string, style: string): void {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        fontWeight: weight,
        fontStyle: style
      }))
    );
  }

  it("erkennt normal", () => {
    stubCs("400", "normal");
    expect(inferFontStyle({} as HTMLElement)).toBe("normal");
  });

  it("erkennt bold und italic", () => {
    stubCs("bold", "normal");
    expect(inferFontStyle({} as HTMLElement)).toBe("bold");
    vi.unstubAllGlobals();
    stubCs("400", "italic");
    expect(inferFontStyle({} as HTMLElement)).toBe("italic");
    vi.unstubAllGlobals();
    stubCs("700", "italic");
    expect(inferFontStyle({} as HTMLElement)).toBe("bolditalic");
  });

  it("wertet numerisches fontWeight ≥ 600 als bold", () => {
    stubCs("600", "normal");
    expect(inferFontStyle({} as HTMLElement)).toBe("bold");
  });
});

describe("exportPreviewToPdf", () => {
  it("wirft synchron wenn keine .a4-page vorhanden", async () => {
    const root = {
      querySelectorAll: () => ({ length: 0 })
    } as unknown as HTMLElement;
    await expect(exportPreviewToPdf(root)).rejects.toThrow(/Keine Seiten/);
  });
});

describe("pdf-export helpers", () => {
  it("sanitizePdfText entfernt NUL und CR und trimmt", () => {
    expect(sanitizePdfText("  a\0b\rc  ")).toBe("abc");
  });

  it("isAllowedLinkHref blockiert javascript:, data: und vbscript:", () => {
    expect(isAllowedLinkHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedLinkHref("data:text/html,hi")).toBe(false);
    expect(isAllowedLinkHref("vbscript:msgbox(1)")).toBe(false);
    expect(isAllowedLinkHref("https://example.com/x")).toBe(true);
    expect(isAllowedLinkHref("#anker")).toBe(true);
  });

  it("rectToPdfMm liefert Null-Fläche bei leerem Seiten-Rect", () => {
    const page = { width: 0, height: 100, left: 0, top: 0 } as DOMRect;
    const el = { left: 0, top: 0, width: 10, height: 10 } as DOMRect;
    const r = rectToPdfMm(el, page, { x: 10, y: 20, w: 100, h: 200 });
    expect(r).toEqual({ x: 10, y: 20, w: 0, h: 0 });
  });

  it("rectToPdfMm skaliert relativ zum Seiten-Rect", () => {
    const page = { left: 100, top: 50, width: 200, height: 300 } as DOMRect;
    const el = { left: 150, top: 100, width: 50, height: 40 } as DOMRect;
    const box = { x: 0, y: 0, w: 100, h: 100 };
    const r = rectToPdfMm(el, page, box);
    expect(r.x).toBeCloseTo(25);
    expect(r.y).toBeCloseTo(16.666666666666668);
    expect(r.w).toBeCloseTo(25);
    expect(r.h).toBeCloseTo(13.333333333333334);
  });

  it("defaultPdfFilename folgt dsabrew-YYYY-MM-DD.pdf", () => {
    const name = defaultPdfFilename();
    expect(name).toMatch(/^dsabrew-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it("buildAnchorToPageMap sammelt [id] über alle Seiten", () => {
    const pages = {
      length: 2,
      forEach(
        fn: (page: { querySelectorAll: (s: string) => unknown[] }, index: number) => void
      ): void {
        fn(
          {
            querySelectorAll: () => [
              { getAttribute: (a: string) => (a === "id" ? "a" : null) }
            ]
          },
          0
        );
        fn(
          {
            querySelectorAll: () => [
              { getAttribute: (a: string) => (a === "id" ? "b" : null) }
            ]
          },
          1
        );
      }
    } as unknown as NodeListOf<HTMLElement>;
    const map = buildAnchorToPageMap(pages);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
  });
});
