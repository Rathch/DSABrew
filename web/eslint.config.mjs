import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config (cwd: web/). Lints web sources, tests, Vite config, repo `shared/` and `server/`.
 * @see https://typescript-eslint.io/getting-started
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "scripts/**"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.vitest }
    }
  },
  {
    files: ["../server/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["../shared/**/*.ts"],
    languageOptions: {
      globals: { ...globals.es2021 }
    }
  }
);
