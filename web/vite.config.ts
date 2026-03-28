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
    }
  },
  test: {
    globals: true
  }
});
