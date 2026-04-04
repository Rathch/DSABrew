import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countLines, setupEditorLineNumbers } from "../src/editor-line-numbers";

describe("countLines", () => {
  it("behandelt leeren String als eine Zeile", () => {
    expect(countLines("")).toBe(1);
  });

  it("zählt LF, CR und CRLF", () => {
    expect(countLines("a")).toBe(1);
    expect(countLines("a\nb")).toBe(2);
    expect(countLines("a\rb")).toBe(2);
    expect(countLines("a\r\nb")).toBe(2);
    expect(countLines("x\ny\nz")).toBe(3);
  });

  it("zählt eine führende oder abschließende Zeilenschaltung als zusätzliche Zeile", () => {
    expect(countLines("\na")).toBe(2);
    expect(countLines("a\n")).toBe(2);
  });
});

describe("setupEditorLineNumbers", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        fontFamily: "monospace",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "20px",
        letterSpacing: "normal",
        paddingTop: "4px",
        paddingBottom: "4px"
      }))
    );

    vi.stubGlobal("document", {
      fonts: { ready: Promise.resolve() }
    });

    vi.stubGlobal(
      "ResizeObserver",
      class {
        callback: () => void;
        constructor(cb: () => void) {
          this.callback = cb;
        }
        observe(): void {
          this.callback();
        }
        disconnect(): void {}
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createSetup(): {
    textarea: HTMLTextAreaElement;
    scrollEl: HTMLElement;
    inner: HTMLElement;
    host: HTMLElement;
    inputHandlers: (() => void)[];
    scrollHandlers: (() => void)[];
  } {
    const inputHandlers: (() => void)[] = [];
    const scrollHandlers: (() => void)[] = [];

    const textarea = {
      value: "",
      scrollTop: 0,
      addEventListener: vi.fn((type: string, fn: () => void) => {
        if (type === "input") {
          inputHandlers.push(fn);
        }
        if (type === "scroll") {
          scrollHandlers.push(fn);
        }
      }),
      style: {}
    } as unknown as HTMLTextAreaElement;

    const scrollEl = { scrollTop: 0 } as unknown as HTMLElement;
    const inner = { style: {} as CSSStyleDeclaration, textContent: "" as string | null } as unknown as HTMLElement;
    const host = { style: {} as CSSStyleDeclaration } as unknown as HTMLElement;

    return { textarea, scrollEl, inner, host, inputHandlers, scrollHandlers };
  }

  it("setzt Zeilennummern und Host-Breite beim Init (inkl. fonts.ready)", async () => {
    const { textarea, scrollEl, inner, host } = createSetup();
    textarea.value = "a\nb\nc";

    setupEditorLineNumbers(textarea, scrollEl, inner, host);

    expect(inner.textContent).toBe("1\n2\n3");
    expect(inner.style.fontFamily).toBe("monospace");
    expect(host.style.width).toBe("2.25ch");
    expect(host.style.minWidth).toBe("2.25ch");

    await Promise.resolve();
    expect(inner.textContent).toBe("1\n2\n3");
  });

  it("aktualisiert bei input und verbreitert die Gutter ab 10 Zeilen", async () => {
    const { textarea, scrollEl, inner, host, inputHandlers } = createSetup();
    const ten = Array.from({ length: 10 }, (_, i) => `L${i + 1}`).join("\n");

    setupEditorLineNumbers(textarea, scrollEl, inner, host);
    await Promise.resolve();

    textarea.value = ten;
    for (const fn of inputHandlers) {
      fn();
    }

    expect(inner.textContent?.startsWith("1\n2\n")).toBe(true);
    expect(inner.textContent?.endsWith("9\n10")).toBe(true);
    expect(host.style.width).toBe("3.25ch");
  });

  it("synchronisiert scrollTop vom Textarea zum Scroll-Container", async () => {
    const { textarea, scrollEl, inner, host, scrollHandlers } = createSetup();

    setupEditorLineNumbers(textarea, scrollEl, inner, host);
    await Promise.resolve();

    textarea.scrollTop = 42;
    for (const fn of scrollHandlers) {
      fn();
    }
    expect(scrollEl.scrollTop).toBe(42);
  });
});
