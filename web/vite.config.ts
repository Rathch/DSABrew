import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

export default defineConfig({
  resolve: {
    alias: {
      "@media": resolve(repoRoot, "media")
    }
  },
  server: {
    fs: {
      allow: [repoRoot]
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts"]
      // Add minimum thresholds as needed, e.g. thresholds: { lines: 50 }
    }
  }
});
