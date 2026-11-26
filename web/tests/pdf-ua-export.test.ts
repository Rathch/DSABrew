/** @vitest-environment happy-dom */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPageAccessibilityTree, collectMcidTargets, sortByColumnFlow } from "../src/pdf-accessibility-tree";
import { A4_HEIGHT_MM, anchorDestTopPt, letterboxImageMm, mmToPt } from "../src/pdf-rect";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontPath = join(__dirname, "../public/fonts/GentiumBookPlus-Regular.ttf");

function stubLayoutGlobals(): void {
  vi.stubGlobal(
    "getComputedStyle",
    vi.fn(() => ({
      fontWeight: "400",
      fontStyle: "normal",
      fontSize: "12px"
    }))
  );
}

describe("sortByColumnFlow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sortiert linke Spalte vor rechter Spalte", () => {
    const columnRoot = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 400 })
    } as HTMLElement;
    const left = {
      getBoundingClientRect: () => ({ left: 10, top: 100, width: 80, height: 20 })
    } as HTMLElement;
    const right = {
      getBoundingClientRect: () => ({ left: 120, top: 50, width: 80, height: 20 })
    } as HTMLElement;
    const ordered = sortByColumnFlow([right, left], columnRoot);
    expect(ordered[0]).toBe(left);
    expect(ordered[1]).toBe(right);
  });
});

describe("buildPageAccessibilityTree", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mappt Überschrift und Absatz", () => {
    stubLayoutGlobals();
    const page = document.createElement("article");
    page.className = "a4-page";
    page.innerHTML = `<div class="page-body"><h1>Titel</h1><p>Text</p></div>`;
    document.body.appendChild(page);
    const pageRect = { left: 0, top: 0, width: 800, height: 1130 } as DOMRect;
    Object.defineProperty(page, "getBoundingClientRect", {
      value: () => pageRect
    });
    page.querySelectorAll("h1, p").forEach((el) => {
      Object.defineProperty(el, "getBoundingClientRect", {
        value: () => ({ left: 40, top: 80, width: 700, height: 24, right: 740, bottom: 104 })
      });
    });
    const box = letterboxImageMm(1600, 2260);
    const tree = buildPageAccessibilityTree(page, 0, box);
    expect(tree.nodes.some((n) => n.role === "H1" && n.text === "Titel")).toBe(true);
    expect(tree.nodes.some((n) => n.role === "P" && n.text === "Text")).toBe(true);
    page.remove();
  });

  it("collectMcidTargets sammelt verschachtelte Knoten", () => {
    const nodes = [
      {
        role: "L" as const,
        children: [
          { role: "LI" as const, children: [{ role: "P" as const, text: "a", rect: { x: 1, y: 1, w: 10, h: 5 }, children: [] }] }
        ]
      }
    ];
    expect(collectMcidTargets(nodes)).toHaveLength(1);
  });
});

describe("buildTaggedPdfBytes", () => {
  beforeEach(() => {
    if (!existsSync(fontPath)) {
      return;
    }
    const bytes = readFileSync(fontPath);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("GentiumBookPlus") || String(url).includes("fontsource")) {
          return {
            ok: true,
            arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
          };
        }
        return { ok: false, status: 404 };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("erzeugt PDF mit StructTreeRoot und Marked", async () => {
    if (!existsSync(fontPath)) {
      return;
    }
    const { buildTaggedPdfBytes, pdfBytesContainTaggedMarkers } = await import("../src/pdf-lib-writer");
    const model = {
      title: "Test",
      metadata: {
        title: "Test",
        author: "Autor",
        subject: "v1",
        keywords: "Autor: Autor",
        impressum: { Autor: "Autor" }
      },
      pages: [
        {
          pageIndex: 0,
          nodes: [
            {
              role: "H1" as const,
              text: "Hello",
              rect: { x: 20, y: 30, w: 100, h: 12 },
              fontSizePt: 14,
              children: []
            }
          ]
        }
      ]
    };
    const raster = {
      pngBytes: minimalPng(),
      canvasWidth: 100,
      canvasHeight: 141
    };
    const bytes = await buildTaggedPdfBytes(model, [raster], [], new Map());
    expect(bytes[0]).toBe(0x25);
    expect(String.fromCharCode(bytes[1], bytes[2], bytes[3])).toBe("PDF");
    expect(pdfBytesContainTaggedMarkers(bytes)).toBe(true);
    expect(new TextDecoder("latin1").decode(bytes)).toMatch(/\/Subtype\s*\/Image/);

    if (process.env.WRITE_PDF_UA_FIXTURE === "1") {
      const { mkdirSync, writeFileSync } = await import("node:fs");
      const { join: joinPath, dirname: dirName } = await import("node:path");
      const { fileURLToPath: toPath } = await import("node:url");
      const dir = joinPath(dirName(toPath(import.meta.url)), "fixtures/pdf-ua");
      mkdirSync(dir, { recursive: true });
      writeFileSync(joinPath(dir, "reference.pdf"), bytes);
    }
  });

  it("anchorDestTopPt setzt die Abschnittskante an den oberen Viewport-Rand", () => {
    expect(anchorDestTopPt(0)).toBeCloseTo(mmToPt(A4_HEIGHT_MM));
    expect(anchorDestTopPt(80)).toBeCloseTo(mmToPt(A4_HEIGHT_MM - 80));
    expect(anchorDestTopPt(-20)).toBeCloseTo(mmToPt(A4_HEIGHT_MM));
    expect(anchorDestTopPt(A4_HEIGHT_MM + 40)).toBe(0);
  });

  it("interner Abschnittslink springt auf die Überschrift, nicht auf den Seitenanfang", async () => {
    if (!existsSync(fontPath)) {
      return;
    }
    const { buildTaggedPdfBytes } = await import("../src/pdf-lib-writer");
    const raster = { pngBytes: minimalPng(), canvasWidth: 100, canvasHeight: 141 };
    const emptyPage = { pageIndex: 0, nodes: [] as { role: "P"; text: string; rect: { x: number; y: number; w: number; h: number }; fontSizePt: number; children: [] }[] };
    const model = {
      title: "Multi",
      metadata: { title: "Multi", impressum: {} },
      pages: [
        { ...emptyPage, pageIndex: 0 },
        { ...emptyPage, pageIndex: 1 },
        { ...emptyPage, pageIndex: 2 },
        { ...emptyPage, pageIndex: 3 }
      ]
    };
    const anchorDests = new Map([["ziel", { page: 4, topMm: 80 }]]);
    const links = [
      {
        href: "#ziel",
        pageIndex: 0,
        rectMm: { x: 10, y: 10, w: 40, h: 8 }
      },
      {
        href: "#fehlt",
        pageIndex: 0,
        rectMm: { x: 10, y: 30, w: 40, h: 8 }
      }
    ];
    const bytes = await buildTaggedPdfBytes(model, Array.from({ length: 4 }, () => raster), links, anchorDests);
    const text = new TextDecoder("latin1").decode(bytes);
    const tops = [...text.matchAll(/\/XYZ\s+[0-9.]+\s+([0-9.]+)\s+[0-9.]+/g)].map((m) => Number(m[1]));
    expect(tops).toHaveLength(1);
    expect(tops[0]).toBeCloseTo(anchorDestTopPt(80), 2);
    expect(tops[0]).toBeLessThan(anchorDestTopPt(0) - 1);
  });
});

function minimalPng(): Uint8Array {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00,
    0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00,
    0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
}
