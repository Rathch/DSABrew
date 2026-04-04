import { afterEach, describe, expect, it, vi } from "vitest";
import { previewIsVisible, scrollRatio, setScrollRatio } from "../src/scroll-sync";

describe("scrollRatio", () => {
  it("liefert 0 wenn nicht scrollbar", () => {
    const el = { scrollHeight: 100, clientHeight: 100, scrollTop: 5 } as unknown as HTMLElement;
    expect(scrollRatio(el)).toBe(0);
  });

  it("liefert scrollTop / (scrollHeight - clientHeight)", () => {
    const el = { scrollHeight: 200, clientHeight: 50, scrollTop: 75 } as unknown as HTMLElement;
    expect(scrollRatio(el)).toBeCloseTo(75 / 150);
  });
});

describe("setScrollRatio", () => {
  it("ändert scrollTop nicht bei nicht scrollbarer Fläche", () => {
    const el = { scrollHeight: 80, clientHeight: 80, scrollTop: 0 } as unknown as HTMLElement;
    setScrollRatio(el, 0.9);
    expect((el as { scrollTop: number }).scrollTop).toBe(0);
  });

  it("setzt scrollTop proportional zur Ratio", () => {
    const el = { scrollHeight: 300, clientHeight: 100, scrollTop: 0 } as unknown as HTMLElement;
    setScrollRatio(el, 0.25);
    expect((el as { scrollTop: number }).scrollTop).toBe(50);
  });

  it("klemmt Ratio auf [0, max]", () => {
    const el = { scrollHeight: 120, clientHeight: 20, scrollTop: 0 } as unknown as HTMLElement;
    setScrollRatio(el, -1);
    expect((el as { scrollTop: number }).scrollTop).toBe(0);
    setScrollRatio(el, 2);
    expect((el as { scrollTop: number }).scrollTop).toBe(100);
  });
});

describe("previewIsVisible", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ist false wenn display none", () => {
    vi.stubGlobal("getComputedStyle", vi.fn(() => ({ display: "none" })));
    expect(previewIsVisible({} as HTMLElement)).toBe(false);
  });

  it("ist true wenn display nicht none", () => {
    vi.stubGlobal("getComputedStyle", vi.fn(() => ({ display: "flex" })));
    expect(previewIsVisible({} as HTMLElement)).toBe(true);
  });
});
