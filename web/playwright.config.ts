import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E gemäß specs/001-dsa-brew-renderer/contracts/e2e-playwright.md
 * — vite preview auf 4173 (dist muss existieren: vorher `npm run build`).
 */
export default defineConfig({
  testDir: "e2e",
  // Nur Mock-/Smoke-E2E; echte API: playwright.integration.config.ts + e2e-integration-Job
  testIgnore: ["**/integration/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite preview --host 127.0.0.1 --port 4173 --strictPort",
    cwd: __dirname,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
