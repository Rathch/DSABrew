/**
 * Erzeugt `web/public/dsa/image16.png` aus `media/image16.tiff` (Scriptorium-Banner im Impressum).
 * Bei fehlendem TIFF oder sharp-Fehler: 1×1-Platzhalter-PNG.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..");
const tiffPath = join(repoRoot, "media/image16.tiff");
const publicDir = join(webRoot, "public/dsa");
const outPublic = join(publicDir, "image16.png");

/** 1×1 transparentes PNG (Fallback). */
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

mkdirSync(publicDir, { recursive: true });

async function main() {
  const writePlaceholder = (reason) => {
    console.warn(`export-banner: ${reason} — schreibe Platzhalter-PNG.`);
    writeFileSync(outPublic, PLACEHOLDER_PNG);
  };

  if (!existsSync(tiffPath)) {
    writePlaceholder("media/image16.tiff fehlt");
    return;
  }
  try {
    const { default: sharp } = await import("sharp");
    await sharp(tiffPath).png().toFile(outPublic);
    console.log("Wrote", outPublic);
  } catch (e) {
    console.warn("export-banner:", e);
    writePlaceholder("Konvertierung fehlgeschlagen");
  }
}

await main();
