/**
 * `repoRoot` für Pfade (SQLite, Logs). `.env` wird in `load-dotenv.mjs` per
 * `node --import …` vor allen Modulen geladen (`package.json` scripts `start` / `dev`).
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const repoRoot = join(__dirname, "../..");
