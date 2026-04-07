import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  absoluteDocUrl,
  apiUrl,
  buildDocumentLayout,
  buildLegalPageLayout,
  buildMaintenancePageLayout,
  copyTextToClipboard,
  defaultHostedView,
  effectiveHostedViewPref,
  escapeHtml,
  matchHostedDocToken,
  migrateOldHostedPrefsFromValues,
  normalizeAppPathname,
  scrollPreviewToElementById
} from "../src/main-helpers";

describe("apiUrl", () => {
  it("hängt Pfad an Basis ohne trailing slash", () => {
    expect(apiUrl("/api/x", "https://api.example.com")).toBe("https://api.example.com/api/x");
    expect(apiUrl("/api/x", "https://api.example.com/")).toBe("https://api.example.com/api/x");
  });

  it("ohne Basis nur den Pfad", () => {
    expect(apiUrl("/api/x", undefined)).toBe("/api/x");
    expect(apiUrl("/api/x", "")).toBe("/api/x");
  });
});

describe("absoluteDocUrl", () => {
  it("baut /d/{slug}-URL mit encodeURIComponent", () => {
    expect(absoluteDocUrl("a/b token", "https://app.example")).toBe(
      "https://app.example/d/a%2Fb%20token"
    );
  });
});

describe("escapeHtml", () => {
  it("maskiert <>&", () => {
    expect(escapeHtml("<a & b>")).toBe("&lt;a &amp; b&gt;");
  });
});

describe("normalizeAppPathname", () => {
  it("entfernt trailing slash und normalisiert leer", () => {
    expect(normalizeAppPathname("/foo/")).toBe("/foo");
    expect(normalizeAppPathname("/")).toBe("/");
    expect(normalizeAppPathname("")).toBe("/");
  });
});

describe("matchHostedDocToken", () => {
  it("liefert Token oder null", () => {
    expect(matchHostedDocToken("/d/abc123")).toBe("abc123");
    expect(matchHostedDocToken("/d/a/b")).toBeNull();
    expect(matchHostedDocToken("/foo")).toBeNull();
  });
});

describe("migrateOldHostedPrefsFromValues", () => {
  it("mappt alte Schlüssel", () => {
    expect(migrateOldHostedPrefsFromValues("layout", null)).toBe("layout");
    expect(migrateOldHostedPrefsFromValues("single", "editor")).toBe("markdown");
    expect(migrateOldHostedPrefsFromValues("single", "preview")).toBe("preview");
    expect(migrateOldHostedPrefsFromValues(null, null)).toBeNull();
    expect(migrateOldHostedPrefsFromValues("single", "other")).toBeNull();
  });
});

describe("defaultHostedView", () => {
  it("Edit → layout, View → preview", () => {
    expect(defaultHostedView("edit")).toBe("layout");
    expect(defaultHostedView("view")).toBe("preview");
  });
});

describe("scrollPreviewToElementById", () => {
  it("scrollt nur wenn Element existiert und in preview liegt", () => {
    const scrollIntoView = vi.fn();
    const el = { scrollIntoView } as unknown as HTMLElement;
    const preview = {
      contains: (node: Node) => node === el
    } as unknown as HTMLElement;

    scrollPreviewToElementById(preview, "any", "auto", () => el);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });

    scrollIntoView.mockClear();
    scrollPreviewToElementById(preview, "missing", "auto", () => null);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("copyTextToClipboard", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("nutzt navigator.clipboard wenn verfügbar", async () => {
    const ok = await copyTextToClipboard("hello");
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
  });

  it("fällt auf execCommand zurück wenn clipboard fehlschlägt", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }
    });
    const ta = { value: "", style: {} as Record<string, string>, select: vi.fn() };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ta),
      body: { appendChild, removeChild },
      execCommand: vi.fn(() => true)
    });
    const ok = await copyTextToClipboard("fallback");
    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(appendChild).toHaveBeenCalledWith(ta);
    expect(removeChild).toHaveBeenCalledWith(ta);
    expect(ta.value).toBe("fallback");
  });
});

describe("effectiveHostedViewPref (#16 schmale Viewports)", () => {
  it("ersetzt Beides durch Nur Markdown im Bearbeiten-Modus", () => {
    expect(effectiveHostedViewPref("layout", "edit", true)).toBe("markdown");
    expect(effectiveHostedViewPref("layout", "edit", false)).toBe("layout");
    expect(effectiveHostedViewPref("preview", "edit", true)).toBe("preview");
    expect(effectiveHostedViewPref("markdown", "edit", true)).toBe("markdown");
  });

  it("ersetzt Beides durch Nur Vorschau im Nur-Lesen-Modus", () => {
    expect(effectiveHostedViewPref("layout", "view", true)).toBe("preview");
    expect(effectiveHostedViewPref("layout", "view", false)).toBe("layout");
  });
});

describe("HTML layouts", () => {
  it("buildMaintenancePageLayout enthält Wartungstitel und Footer", () => {
    const html = buildMaintenancePageLayout();
    expect(html).toContain("Wartung");
    expect(html).toContain("maintenance-shell");
    expect(html).toContain("site-chrome-footer");
  });

  it("buildLegalPageLayout unterscheidet impressum/datenschutz", () => {
    expect(buildLegalPageLayout("impressum")).toContain("Christian Rath-Ulrich");
    expect(buildLegalPageLayout("datenschutz")).toContain("Datenschutz");
  });

  it("buildDocumentLayout enthält Modus und Version", () => {
    const view = buildDocumentLayout({ mode: "view" }, "1.2.3");
    expect(view).toContain("editor--readonly");
    expect(view).toContain("1.2.3");
    expect(view).not.toContain("share-edit-btn");

    const edit = buildDocumentLayout({ mode: "edit" }, "0.0.1");
    expect(edit).toContain('id="share-edit-btn"');
    expect(edit).toContain("0.0.1");
    expect(edit).not.toContain("editor--readonly");
  });
});
