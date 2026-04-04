import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isPageBreakLine,
  minimapSegmentLayout,
  pageSegmentsZeroBased,
  splitMarkdownPageChunks,
  textareaLineMetrics,
  updateEditorPageStripeBackground
} from "../src/editor-page-stripes";

describe("splitMarkdownPageChunks", () => {
  it("splits on \\page and normalizes {{page}}", () => {
    expect(splitMarkdownPageChunks("a\n\\page\nb")).toEqual(["a", "b"]);
    expect(splitMarkdownPageChunks("x{{page}}y")).toEqual(["x", "y"]);
  });

  it("treats \\pageSingle as a break", () => {
    expect(splitMarkdownPageChunks("p1\n\\pageSingle\np2")).toEqual(["p1", "p2"]);
  });
});

describe("isPageBreakLine", () => {
  it("detects dedicated page-break lines only", () => {
    expect(isPageBreakLine("\\page")).toBe(true);
    expect(isPageBreakLine("  \\pageSingle  ")).toBe(true);
    expect(isPageBreakLine("{{page}}")).toBe(true);
    expect(isPageBreakLine("{{pageSingle}}")).toBe(true);
    expect(isPageBreakLine("text \\page")).toBe(false);
    expect(isPageBreakLine("")).toBe(false);
  });
});

describe("pageSegmentsZeroBased", () => {
  it("returns one segment for text without breaks", () => {
    expect(pageSegmentsZeroBased("a\nb")).toEqual([{ start: 0, end: 1 }]);
  });

  it("excludes page-break lines from segments", () => {
    expect(pageSegmentsZeroBased("a\n\\page\nb")).toEqual([
      { start: 0, end: 0 },
      { start: 2, end: 2 }
    ]);
  });

  it("handles CRLF input", () => {
    const segs = pageSegmentsZeroBased("x\r\n\\page\r\ny");
    expect(segs.length).toBe(2);
    expect(segs[1]).toEqual({ start: 2, end: 2 });
  });
});

describe("textareaLineMetrics / minimapSegmentLayout (getComputedStyle mocked)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        lineHeight: "20px",
        fontSize: "14px",
        paddingTop: "4px",
        paddingBottom: "6px"
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("textareaLineMetrics parses px line height and padding", () => {
    const ta = { value: "x" } as HTMLTextAreaElement;
    expect(textareaLineMetrics(ta)).toEqual({ lh: 20, pt: 4, pb: 6 });
  });

  it("textareaLineMetrics falls back when line-height is normal", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        lineHeight: "normal",
        fontSize: "10px",
        paddingTop: "0px",
        paddingBottom: "0px"
      }))
    );
    const ta = { value: "x" } as HTMLTextAreaElement;
    expect(textareaLineMetrics(ta).lh).toBe(14);
  });

  it("minimapSegmentLayout scales segment heights to scrollHeight", () => {
    const ta = {
      value: "a\nb",
      scrollHeight: 100
    } as HTMLTextAreaElement;
    const layouts = minimapSegmentLayout(ta, [{ start: 0, end: 1 }]);
    expect(layouts.length).toBe(1);
    expect(layouts[0]!.top).toBeGreaterThanOrEqual(0);
    expect(layouts[0]!.height).toBeGreaterThan(0);
  });
});

describe("updateEditorPageStripeBackground", () => {
  it("always clears textarea page stripes (minimap-only)", () => {
    const classList = { add: vi.fn(), remove: vi.fn() };
    const style = { removeProperty: vi.fn(), backgroundImage: "" };
    const ta = {
      value: "a\n\\page\nb",
      scrollHeight: 120,
      classList,
      style
    } as unknown as HTMLTextAreaElement;
    updateEditorPageStripeBackground(ta);
    expect(classList.remove).toHaveBeenCalledWith("editor-textarea--page-stripes");
    expect(style.removeProperty).toHaveBeenCalledWith("background-image");
    expect(classList.add).not.toHaveBeenCalled();
  });
});
