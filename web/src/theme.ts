/** Siehe `specs/002-modern-ui-darkmode/contracts/ui-shell.md` */
export const LS_THEME_KEY = "dsabrew-theme";

export type ThemePreference = "light" | "dark" | "system";

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(LS_THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") {
      return v;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(LS_THEME_KEY, pref);
  } catch {
    /* ignore */
  }
  applyThemePreference(pref);
  syncThemeToggleButtons();
}

export function effectiveThemeIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") {
    return true;
  }
  if (pref === "light") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemePreference(pref: ThemePreference): void {
  const dark = effectiveThemeIsDark(pref);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function onSystemThemeChange(): void {
  if (getThemePreference() === "system") {
    applyThemePreference("system");
    syncThemeToggleButtons();
  }
}

let systemMql: MediaQueryList | null = null;

/** Einmal beim App-Start; reagiert nur, wenn Nutzer „System“ gewählt hat. */
export function initThemeMediaListener(): void {
  if (systemMql) {
    return;
  }
  systemMql = window.matchMedia("(prefers-color-scheme: dark)");
  systemMql.addEventListener("change", onSystemThemeChange);
}

export function syncThemeToggleButtons(): void {
  const pref = getThemePreference();
  const effectiveDark = effectiveThemeIsDark(pref);
  const appRoot = document.getElementById("app");
  if (!appRoot) {
    return;
  }

  appRoot.querySelectorAll<HTMLButtonElement>("[data-theme-btn]").forEach((btn) => {
    const mode = btn.dataset.themeBtn;
    const on =
      (mode === "light" && pref === "light") || (mode === "dark" && pref === "dark");
    btn.setAttribute("aria-pressed", on ? "true" : "false");

    /* Nur die jeweils andere Option: bei dunkler Darstellung nur „Hell“, bei heller nur „Dunkel“. */
    if (mode === "light") {
      btn.hidden = !effectiveDark;
    } else {
      btn.hidden = effectiveDark;
    }
  });

  appRoot.querySelectorAll(".theme-segmented").forEach((seg) => {
    const n = seg.querySelectorAll("[data-theme-btn]:not([hidden])").length;
    seg.classList.toggle("theme-segmented--single", n === 1);
  });
}

const ICON_SUN = `<svg class="theme-segmented__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>`;

const ICON_MOON = `<svg class="theme-segmented__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.25 8.25 0 009.25 12c0 2.9.496 5.564 1.328 7.531a.75.75 0 01-.162.819l-.07.057a.75.75 0 01-.9 0l-.044-.036A8.25 8.25 0 011.5 12a8.25 8.25 0 016.584-8.123.75.75 0 01.822.162l.004.003.004.003z" clip-rule="evenodd"/></svg>`;

/** Zwei Modi + implizites „System“ (OS): kein eigener Button; erneuter Klick auf Hell/Dunkel schaltet zurück auf System. */
export function themeControlClusterHtml(): string {
  return `
    <div class="theme-segmented" role="radiogroup" aria-label="Farbschema: Hell, Dunkel oder System (Standard)">
      <button type="button" data-theme-btn="light" class="theme-segmented__btn" aria-pressed="false" title="Helles Schema (nochmal klicken für System-Standard)">
        ${ICON_SUN}<span>Hell</span>
      </button>
      <button type="button" data-theme-btn="dark" class="theme-segmented__btn" aria-pressed="false" title="Dunkles Schema (nochmal klicken für System-Standard)">
        ${ICON_MOON}<span>Dunkel</span>
      </button>
    </div>`;
}
