import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMPRESSUM_DATA,
  formatVersionDisplayLine,
  mergeImpressum,
  renderImpressumHtml,
  safeHttpHref
} from "../src/impressum-config";

describe("mergeImpressum", () => {
  it("merges partial data over defaults", () => {
    const m = mergeImpressum({ projectTitle: "X" });
    expect(m.projectTitle).toBe("X");
    expect(m.authorValue).toBe(DEFAULT_IMPRESSUM_DATA.authorValue);
  });

  it("returns a full copy when no partial is passed", () => {
    const a = mergeImpressum();
    const b = mergeImpressum();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe("formatVersionDisplayLine", () => {
  it("joins version parts when any of the three fields is set", () => {
    expect(
      formatVersionDisplayLine({
        ...DEFAULT_IMPRESSUM_DATA,
        versionNumber: "v1",
        versionDate: "",
        versionEdition: "1",
        versionValue: "fallback"
      })
    ).toBe("v1 / 1");
  });

  it("falls back to versionValue when all three parts are empty", () => {
    expect(
      formatVersionDisplayLine({
        ...DEFAULT_IMPRESSUM_DATA,
        versionNumber: "  ",
        versionDate: "",
        versionEdition: "",
        versionValue: "  nur diese Zeile  "
      })
    ).toBe("nur diese Zeile");
  });
});

describe("safeHttpHref", () => {
  it("replaces javascript:, data: and vbscript: URLs with #", () => {
    expect(safeHttpHref("javascript:alert(1)")).toBe("#");
    expect(safeHttpHref("  JaVaScRiPt:evil  ")).toBe("#");
    expect(safeHttpHref("data:text/html,<p>x</p>")).toBe("#");
    expect(safeHttpHref("vbscript:msgbox(1)")).toBe("#");
  });

  it("prefixes bare hosts with https://", () => {
    expect(safeHttpHref("example.com/path")).toBe("https://example.com/path");
    expect(safeHttpHref("//example.com")).toBe("https://example.com");
  });

  it("leaves http(s) URLs unchanged", () => {
    expect(safeHttpHref("https://a.de/x")).toBe("https://a.de/x");
    expect(safeHttpHref("http://b.de")).toBe("http://b.de");
  });
});

describe("renderImpressumHtml", () => {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  it("includes escaped project title and IMPRESSUM heading", () => {
    const html = renderImpressumHtml(
      { ...DEFAULT_IMPRESSUM_DATA, projectTitle: '<img src=x onerror=alert(1)>' },
      esc
    );
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("IMPRESSUM");
    expect(html).toContain("impressum-scriptorium-banner-img");
  });

  it("uses safe href for footer link", () => {
    const html = renderImpressumHtml(
      { ...DEFAULT_IMPRESSUM_DATA, footerWordTemplateUrl: "javascript:void(0)" },
      esc
    );
    expect(html).toContain('href="#"');
    expect(html).not.toContain("javascript:");
  });
});
