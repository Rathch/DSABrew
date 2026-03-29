import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config (Repository-Root). ESLint 9 erlaubt keine Lint-Ziele außerhalb des
 * Config-Verzeichnisses, wenn die Config unter `web/` liegt — daher diese Datei hier.
 * @see https://typescript-eslint.io/getting-started
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "web/dist/**",
      "web/coverage/**",
      "web/scripts/**"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["web/src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    files: ["web/vite.config.ts"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["web/tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.vitest }
    }
  },
  {
    files: ["server/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["shared/**/*.ts"],
    languageOptions: {
      globals: { ...globals.es2021 }
    }
  }
);
