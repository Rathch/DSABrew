/**
 * Installs the reference graphic for GM ornament bars:
 * copies a PNG (screenshot of the target box) to media/gm-meister-frame.png
 *
 * Usage: node scripts/import-gm-meister-frame.mjs <source.png> [--prepare]
 *    or: MEISTER_FRAME_SRC=/path/to.png node scripts/import-gm-meister-frame.mjs
 * With --prepare: run slice-gm-frame.mjs right after (sharp required).
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..");
const dest = join(repoRoot, "media/gm-meister-frame.png");

const args = process.argv.slice(2).filter((a) => a !== "--prepare");
const doPrepare = process.argv.includes("--prepare");
const src = args[0] || process.env.MEISTER_FRAME_SRC;
if (!src || !existsSync(src)) {
  console.error(
    "import-gm-meister-frame: Quelle fehlt.\n" +
      "  Beispiel: node scripts/import-gm-meister-frame.mjs ~/Downloads/meister-ziel.png\n" +
      "  Oder:     MEISTER_FRAME_SRC=C:\\\\pfad\\\\ziel.png node scripts/import-gm-meister-frame.mjs\n" +
      "  Mit Schnitt: …ziel.png --prepare"
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
const bytes = statSync(dest).size;
console.log("import-gm-meister-frame:", src, "→", dest, `(${bytes} bytes)`);
if (doPrepare) {
  const r = spawnSync(process.execPath, [join(__dirname, "slice-gm-frame.mjs")], {
    cwd: webRoot,
    stdio: "inherit"
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
} else {
  console.log("import-gm-meister-frame: danach im Ordner web: npm run prepare-assets");
}
