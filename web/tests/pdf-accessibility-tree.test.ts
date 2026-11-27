/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDocumentAccessibilityModel,
  buildPageAccessibilityTree,
  collectMcidTargets
} from "../src/pdf-accessibility-tree";
import { letterboxImageMm } from "../src/pdf-rect";

function mockA4Page(heading: string, pageTop: number): HTMLElement {
  const page = document.createElement("div");
  page.className = "a4-page";
  const body = document.createElement("div");
  body.className = "page-body";
  const h1 = document.createElement("h1");
  h1.textContent = heading;
  body.appendChild(h1);
  page.appendChild(body);

  vi.spyOn(page, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, pageTop, 794, 1123)
  );
  vi.spyOn(h1, "getBoundingClientRect").mockReturnValue(
    new DOMRect(40, pageTop + 80, 700, 40)
  );
  return page;
}

describe("buildPageAccessibilityTree", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extrahiert MCID-Ziele auch wenn die Seite außerhalb des Viewports liegt", () => {
    const page = mockA4Page("Erste Seite", -4000);
    const box = letterboxImageMm(794, 1123);
    const tree = buildPageAccessibilityTree(page, 0, box);
    const targets = collectMcidTargets(tree.nodes);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.text).toBe("Erste Seite");
    expect(targets[0]?.rect?.w).toBeGreaterThan(0);
  });

  it("liefert für jede Seite eines mehrseitigen Dokuments Text-Ziele", () => {
    const pages = [
      mockA4Page("Seite eins", -3000),
      mockA4Page("Seite zwei", -1500),
      mockA4Page("Seite drei", 0)
    ];
    const box = letterboxImageMm(794, 1123);
    const trees = pages.map((p, i) => buildPageAccessibilityTree(p, i, box));
    const model = buildDocumentAccessibilityModel(
      pages as unknown as NodeListOf<HTMLElement>,
      trees
    );

    expect(model.pages).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      const targets = collectMcidTargets(model.pages[i]!.nodes);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0]?.rect?.h).toBeGreaterThan(0);
    }
  });
});
