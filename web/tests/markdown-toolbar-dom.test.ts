// Toolbar-Integration: echtes DOM (happy-dom) für attachMarkdownToolbar / Tastenkürzel.
// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { attachMarkdownToolbar } from "../src/markdown-toolbar";

function mockMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("attachMarkdownToolbar (DOM)", () => {
  it("Bold-Button formatiert die Auswahl", () => {
    mockMatchMedia(true);
    const container = document.createElement("div");
    const ta = document.createElement("textarea");
    ta.value = "word";
    ta.setSelectionRange(0, 4);
    attachMarkdownToolbar(container, ta);
    const bold = container.querySelector("#md-tool-bold") as HTMLButtonElement | null;
    expect(bold).not.toBeNull();
    bold!.click();
    expect(ta.value).toBe("**word**");
  });

  it("Strg+B wendet Fett an", () => {
    mockMatchMedia(true);
    const container = document.createElement("div");
    const ta = document.createElement("textarea");
    ta.value = "x";
    ta.setSelectionRange(0, 1);
    attachMarkdownToolbar(container, ta);
    const ev = new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true });
    ta.dispatchEvent(ev);
    expect(ta.value).toBe("**x**");
  });

  it("Desktop-Breite: Markdown- und Makro-Panel gleichzeitig sichtbar (kein hidden)", () => {
    mockMatchMedia(false);
    const container = document.createElement("div");
    const ta = document.createElement("textarea");
    attachMarkdownToolbar(container, ta);
    const mdPanel = container.querySelector("#md-toolbar-panel-markdown") as HTMLElement | null;
    const macroPanel = container.querySelector("#md-toolbar-panel-macros") as HTMLElement | null;
    expect(mdPanel).not.toBeNull();
    expect(macroPanel).not.toBeNull();
    expect(mdPanel!.hidden).toBe(false);
    expect(macroPanel!.hidden).toBe(false);
    const macroBtn = container.querySelector("#md-tool-readAloudNote") as HTMLButtonElement | null;
    expect(macroBtn).not.toBeNull();
  });
});
