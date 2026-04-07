// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLineRange,
  insertAbschnittMacro,
  insertAtCursor,
  insertCodeBlock,
  insertImageFromUrl,
  insertLink,
  isSeparator,
  setHeadingLevel,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  wrapSelection
} from "../src/markdown-toolbar";

/** Minimal textarea mock; `setSelectionRange` aktualisiert selectionStart/End. */
function createTextarea(value: string, start: number, end: number): HTMLTextAreaElement {
  const ta = {
    value,
    selectionStart: start,
    selectionEnd: end,
    setSelectionRange: vi.fn(function (this: typeof ta, s: number, e: number) {
      this.selectionStart = s;
      this.selectionEnd = e;
    }),
    focus: vi.fn(),
    dispatchEvent: vi.fn()
  };
  return ta as unknown as HTMLTextAreaElement;
}

describe("getLineRange", () => {
  it("liefert eine Zeile ohne nachfolgenden Zeilenumbruch", () => {
    expect(getLineRange("hello", 0, 5)).toEqual({ start: 0, end: 5 });
  });

  it("liefert die zweite Zeile bei Auswahl mit Zeilenumbruch am Ende", () => {
    const r = getLineRange("a\nb\nc", 2, 4);
    expect(r).toEqual({ start: 2, end: 3 });
  });

  it("passt lineEnd an, wenn die Auswahl mit Newline endet", () => {
    const r = getLineRange("a\nb", 0, 2);
    expect(r).toEqual({ start: 0, end: 1 });
  });
});

describe("wrapSelection", () => {
  it("fügt Platzhalter ein und markiert ihn bei leerer Auswahl", () => {
    const ta = createTextarea("", 0, 0);
    wrapSelection(ta, "**", "**", "Text");
    expect(ta.value).toBe("**Text**");
    expect(ta.setSelectionRange).toHaveBeenCalledWith(2, 6);
    expect(ta.dispatchEvent).toHaveBeenCalled();
  });

  it("umhüllt markierten Text", () => {
    const ta = createTextarea("hello world", 6, 11);
    wrapSelection(ta, "*", "*", "x");
    expect(ta.value).toBe("hello *world*");
    expect(ta.setSelectionRange).toHaveBeenCalledWith(6, 13);
  });
});

describe("insertAtCursor", () => {
  it("fügt an der Cursorposition ein und setzt Cursor ans Ende", () => {
    const ta = createTextarea("ab", 1, 1);
    insertAtCursor(ta, "XY");
    expect(ta.value).toBe("aXYb");
    expect(ta.setSelectionRange).toHaveBeenCalledWith(3, 3);
  });
});

describe("insertImageFromUrl", () => {
  it("fügt Markdown-Bildzeile ein, wenn prompt eine URL liefert", () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("https://example.com/x.png");
    const ta = createTextarea("", 0, 0);
    insertImageFromUrl(ta);
    expect(ta.value).toContain("![Bild](https://example.com/x.png)");
    promptSpy.mockRestore();
  });

  it("fügt nichts ein bei Abbruch (prompt null)", () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);
    const ta = createTextarea("x", 0, 0);
    insertImageFromUrl(ta);
    expect(ta.value).toBe("x");
    promptSpy.mockRestore();
  });
});

describe("setHeadingLevel", () => {
  it("ersetzt vorhandene #-Präfixe und setzt die gewünschte Ebene", () => {
    const ta = createTextarea("## alt\nneu", 0, 10);
    setHeadingLevel(ta, 1);
    expect(ta.value).toBe("# alt\n# neu");
  });
});

describe("toggleBulletList", () => {
  it("setzt Aufzählungszeichen für nicht-leere Zeilen", () => {
    const ta = createTextarea("eins\nzwei", 0, 8);
    toggleBulletList(ta);
    expect(ta.value).toBe("- eins\n- zwei");
  });

  it("lässt leere Zeilen unverändert", () => {
    const ta = createTextarea("a\n\nb", 0, 5);
    toggleBulletList(ta);
    expect(ta.value).toBe("- a\n\n- b");
  });
});

describe("toggleOrderedList", () => {
  it("nummeriert Zeilen fortlaufend", () => {
    const ta = createTextarea("x\ny", 0, 3);
    toggleOrderedList(ta);
    expect(ta.value).toBe("1. x\n2. y");
  });
});

describe("toggleBlockquote", () => {
  it("setzt > vor nicht-leeren Zeilen", () => {
    const ta = createTextarea("zitat", 0, 5);
    toggleBlockquote(ta);
    expect(ta.value).toBe("> zitat");
  });
});

describe("insertCodeBlock", () => {
  it("fügt Fence ein und positioniert den Cursor in der Mitte", () => {
    const ta = createTextarea("x", 1, 1);
    insertCodeBlock(ta);
    expect(ta.value).toBe("x```\n\n```");
    expect(ta.setSelectionRange).toHaveBeenLastCalledWith(5, 5);
  });
});

describe("insertLink", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bricht ab bei abgebrochenem URL-Prompt", () => {
    vi.stubGlobal("window", {
      prompt: vi.fn(() => null)
    });
    const ta = createTextarea("hi", 0, 2);
    insertLink(ta);
    expect(ta.value).toBe("hi");
  });

  it("ersetzt Auswahl durch Markdown-Link", () => {
    vi.stubGlobal("window", {
      prompt: vi.fn(() => "https://example.com")
    });
    const ta = createTextarea("click me", 0, 5);
    insertLink(ta);
    expect(ta.value).toBe("[click](https://example.com) me");
  });

  it("fragt nach Label, wenn nichts markiert ist", () => {
    const prompts = vi
      .fn()
      .mockReturnValueOnce("https://x.test")
      .mockReturnValueOnce("Label");
    vi.stubGlobal("window", { prompt: prompts });
    const ta = createTextarea("start", 0, 0);
    insertLink(ta);
    expect(ta.value).toBe("[Label](https://x.test)start");
  });
});

describe("insertAbschnittMacro", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bricht ab bei abgebrochenem N-Prompt", () => {
    vi.stubGlobal("window", {
      prompt: vi.fn(() => null),
      alert: vi.fn()
    });
    const ta = createTextarea("x", 0, 1);
    insertAbschnittMacro(ta);
    expect(ta.value).toBe("x");
  });

  it("warnt bei ungültiger Nummer und ändert nichts", () => {
    const alert = vi.fn();
    vi.stubGlobal("window", {
      prompt: vi.fn(() => "01"),
      alert
    });
    const ta = createTextarea("x", 0, 1);
    insertAbschnittMacro(ta);
    expect(alert).toHaveBeenCalled();
    expect(ta.value).toBe("x");
  });

  it("warnt bei N=0", () => {
    const alert = vi.fn();
    vi.stubGlobal("window", {
      prompt: vi.fn(() => "0"),
      alert
    });
    const ta = createTextarea("x", 0, 1);
    insertAbschnittMacro(ta);
    expect(alert).toHaveBeenCalled();
  });

  it("nutzt markierten Text als Beschriftung", () => {
    vi.stubGlobal("window", {
      prompt: vi.fn(() => "3"),
      alert: vi.fn()
    });
    const ta = createTextarea("abc def", 4, 7);
    insertAbschnittMacro(ta);
    expect(ta.value).toBe("abc {{abschnitt 3 | def}}");
  });

  it("fragt nach Label, wenn nichts markiert ist", () => {
    vi.stubGlobal("window", {
      prompt: vi
        .fn()
        .mockReturnValueOnce("2")
        .mockReturnValueOnce("Mein Text"),
      alert: vi.fn()
    });
    const ta = createTextarea("x", 1, 1);
    insertAbschnittMacro(ta);
    expect(ta.value).toBe("x{{abschnitt 2 | Mein Text}}");
  });
});

describe("isSeparator", () => {
  it("erkennt sep-IDs", () => {
    expect(isSeparator("sep1")).toBe(true);
    expect(isSeparator("bold")).toBe(false);
  });
});
