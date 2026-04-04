import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E gegen echten Fastify-Server (keine page.route-Mocks).
 * Build: VITE_PUBLIC_API_BASE=http://127.0.0.1:3001 npm run build
 * Start: web/scripts/e2e-integration-serve.sh (Server + vite preview).
 */
export default defineConfig({
  testDir: "e2e/integration",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `bash "${path.join(__dirname, "scripts", "e2e-integration-serve.sh")}"`,
    cwd: __dirname,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
