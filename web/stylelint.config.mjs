/**
 * Stylelint: extends the community “standard” rule set (strict, widely used).
 * @see https://github.com/stylelint/stylelint-config-standard
 */
/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["**/node_modules/**", "**/coverage/**", "**/dist/**"],
  rules: {
    /**
     * No unprefixed equivalents for these; keep macOS font rendering hints.
     * @see https://stylelint.io/user-guide/rules/property-no-vendor-prefix/
     */
    "property-no-vendor-prefix": [
      true,
      {
        ignoreProperties: [
          "-webkit-font-smoothing",
          "-moz-osx-font-smoothing",
          /* Kein standardsiertes Äquivalent für iOS-Momentum-Scrolling / Druckfarben. */
          "-webkit-overflow-scrolling",
          "-webkit-print-color-adjust"
        ]
      }
    ],
    /**
     * Projekt nutzt BEM-artige Klassen (z. B. `.theme-segmented__btn`, `--single`);
     * `stylelint-config-standard` erwartet reines kebab-case ohne `__`/`--`.
     */
    "selector-class-pattern": null,
    /**
     * Große Single-File-Stylesheet: Reihenfolge nach Spezifität wäre hier
     * ein massives Refactor ohne funktionalen Gewinn.
     */
    "no-descending-specificity": null
  }
};
