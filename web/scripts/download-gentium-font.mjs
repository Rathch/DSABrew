/**
 * Downloads Gentium Book Plus (OFL) for PDF/UA text embedding.
 */
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "fonts");
const outFile = join(outDir, "GentiumBookPlus-Regular.ttf");
const FONT_URLS = [
  "https://cdn.jsdelivr.net/fontsource/fonts/gentium-book-plus@latest/latin-400-normal.ttf",
  "https://github.com/googlefonts/gentium-book/raw/refs/heads/main/fonts/ttf/GentiumBookPlus-Regular.ttf"
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} für ${url}`));
        return;
      }
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
      file.on("error", reject);
    }).on("error", reject);
  });
}

mkdirSync(outDir, { recursive: true });
if (existsSync(outFile)) {
  console.log("download-gentium-font: bereits vorhanden");
} else {
  let ok = false;
  for (const url of FONT_URLS) {
    try {
      await download(url, outFile);
      ok = true;
      console.log(`download-gentium-font: GentiumBookPlus-Regular.ttf (${url})`);
      break;
    } catch (e) {
      console.warn(`download-gentium-font: ${url} — ${e instanceof Error ? e.message : e}`);
    }
  }
  if (!ok) {
    process.exit(1);
  }
}
