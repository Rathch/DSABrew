// Toolbar-Integration: echtes DOM (happy-dom) für attachMarkdownToolbar / Tastenkürzel.
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { attachMarkdownToolbar } from "../src/markdown-toolbar";

describe("attachMarkdownToolbar (DOM)", () => {
  it("Bold-Button formatiert die Auswahl", () => {
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
    const container = document.createElement("div");
    const ta = document.createElement("textarea");
    ta.value = "x";
    ta.setSelectionRange(0, 1);
    attachMarkdownToolbar(container, ta);
    const ev = new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true });
    ta.dispatchEvent(ev);
    expect(ta.value).toBe("**x**");
  });
});
