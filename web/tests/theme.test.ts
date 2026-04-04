import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LS_THEME_KEY,
  applyThemePreference,
  effectiveThemeIsDark,
  getThemePreference,
  initThemeMediaListener,
  setThemePreference,
  syncThemeToggleButtons,
  themeControlClusterHtml
} from "../src/theme";

function mockMatchMedia(dark: boolean): void {
  const impl = vi.fn((query: string) => ({
    matches: dark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
  vi.stubGlobal("matchMedia", impl);
  vi.stubGlobal("window", { matchMedia: impl });
}

function stubMinimalDocument(): void {
  const classSet = new Set<string>();
  const root = {
    classList: {
      contains: (name: string) => classSet.has(name),
      toggle: (name: string, force?: boolean) => {
        const on = force !== undefined ? force : !classSet.has(name);
        if (on) {
          classSet.add(name);
        } else {
          classSet.delete(name);
        }
        return on;
      }
    },
    style: { colorScheme: "" as string }
  };
  vi.stubGlobal("document", {
    documentElement: root,
    getElementById: vi.fn(() => null)
  });
}

describe("theme preference", () => {
  beforeEach(() => {
    const mem: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k]! : null),
      setItem: (k: string, v: string) => {
        mem[k] = String(v);
      },
      removeItem: (k: string) => {
        delete mem[k];
      },
      clear: () => {
        for (const k of Object.keys(mem)) {
          delete mem[k];
        }
      },
      key: (i: number) => Object.keys(mem)[i] ?? null,
      get length() {
        return Object.keys(mem).length;
      }
    });
    mockMatchMedia(false);
    stubMinimalDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to system when unset or invalid", () => {
    expect(getThemePreference()).toBe("system");
    localStorage.setItem(LS_THEME_KEY, "nope");
    expect(getThemePreference()).toBe("system");
  });

  it("persists light and dark", () => {
    setThemePreference("light");
    expect(localStorage.getItem(LS_THEME_KEY)).toBe("light");
    expect(getThemePreference()).toBe("light");
    setThemePreference("dark");
    expect(getThemePreference()).toBe("dark");
  });

  it("effectiveThemeIsDark follows pref and prefers-color-scheme for system", () => {
    mockMatchMedia(false);
    expect(effectiveThemeIsDark("light")).toBe(false);
    expect(effectiveThemeIsDark("dark")).toBe(true);
    expect(effectiveThemeIsDark("system")).toBe(false);
    mockMatchMedia(true);
    expect(effectiveThemeIsDark("system")).toBe(true);
  });

  it("applyThemePreference toggles dark class on documentElement", () => {
    applyThemePreference("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    applyThemePreference("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("initThemeMediaListener is idempotent", () => {
    const mql = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    const mm = vi.fn(() => mql);
    vi.stubGlobal("matchMedia", mm);
    vi.stubGlobal("window", { matchMedia: mm });
    initThemeMediaListener();
    initThemeMediaListener();
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("themeControlClusterHtml contains both theme buttons", () => {
    const html = themeControlClusterHtml();
    expect(html).toContain('data-theme-btn="light"');
    expect(html).toContain('data-theme-btn="dark"');
    expect(html).toContain("theme-segmented");
  });

  it("syncThemeToggleButtons sets pressed state and visibility from preference", () => {
    localStorage.setItem(LS_THEME_KEY, "dark");
    mockMatchMedia(false);
    const lightBtn = {
      dataset: { themeBtn: "light" },
      hidden: false,
      setAttribute: vi.fn()
    };
    const darkBtn = {
      dataset: { themeBtn: "dark" },
      hidden: false,
      setAttribute: vi.fn()
    };
    const segment = {
      classList: { toggle: vi.fn() },
      querySelectorAll(sel: string) {
        if (sel === "[data-theme-btn]:not([hidden])") {
          return [lightBtn, darkBtn].filter((b) => !b.hidden);
        }
        return [];
      }
    };
    const app = {
      querySelectorAll(sel: string) {
        if (sel === "[data-theme-btn]") {
          return [lightBtn, darkBtn];
        }
        if (sel === ".theme-segmented") {
          return [segment];
        }
        return [];
      }
    };
    const classSet = new Set<string>();
    const root = {
      classList: {
        contains: (name: string) => classSet.has(name),
        toggle: (name: string, force?: boolean) => {
          const on = force !== undefined ? force : !classSet.has(name);
          if (on) {
            classSet.add(name);
          } else {
            classSet.delete(name);
          }
          return on;
        }
      },
      style: { colorScheme: "" as string }
    };
    vi.stubGlobal("document", {
      documentElement: root,
      getElementById: (id: string) => (id === "app" ? app : null)
    });
    syncThemeToggleButtons();
    expect(lightBtn.hidden).toBe(false);
    expect(darkBtn.hidden).toBe(true);
    expect(lightBtn.setAttribute).toHaveBeenCalledWith("aria-pressed", "false");
    expect(darkBtn.setAttribute).toHaveBeenCalledWith("aria-pressed", "true");
    expect(segment.classList.toggle).toHaveBeenCalledWith("theme-segmented--single", true);
  });
});
