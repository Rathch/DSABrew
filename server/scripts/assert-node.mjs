/**
 * Läuft vor `npm run dev` / `npm start`: bricht mit klarer Meldung ab, wenn Node < engines.node.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const eng = typeof pkg.engines?.node === "string" ? pkg.engines.node : ">=24.0.0";
const m = /^>=\s*(\d+)/.exec(eng) ?? /^(\d+)/.exec(eng);
const minMajor = m ? Number(m[1]) : 24;
const cur = Number(process.versions.node.split(".")[0]);

if (!Number.isFinite(cur) || cur < minMajor) {
  console.error(`[dsabrew-server] Node ${process.version} erfüllt nicht ${eng} (${pkg.name} → package.json → engines).`);
  console.error("[dsabrew-server] Im Repository-Root: nvm install && nvm use   (siehe .nvmrc), dann hier: npm install");
  process.exit(1);
}
