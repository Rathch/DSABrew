import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const rootPkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
  version?: string;
};
const appVersion = rootPkg.version ?? "0.0.0";

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion)
  },
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
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            const auth = req.headers.authorization;
            if (auth) {
              proxyReq.setHeader("Authorization", auth);
            }
          });
        }
      }
    }
  },
  test: {
    globals: true,
    // Nur tests/: Vitest. e2e/ ist Playwright (keine *.spec.ts hier, sonst Konflikt mit test.describe).
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
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
