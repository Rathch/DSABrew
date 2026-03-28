/**
 * Erzeugt /dsa/gm-frame-cap-top.png, gm-frame-repeat-y.png, gm-frame-cap-bottom.png
 *
 * Quelle (optional): media/gm-meister-frame.png — voller SL-Rahmen (Referenz-Screenshot).
 * Fehlt die Datei: Platzhalter-Leisten (SVG→PNG) + Mittelstreifen aus media/image27.png.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..");
const outDir = join(webRoot, "public/dsa");

const SRC_FRAME = join(repoRoot, "media/gm-meister-frame.png");
const SRC_PARCHMENT = join(repoRoot, "media/image27.png");

const OUT_TOP = join(outDir, "gm-frame-cap-top.png");
const OUT_MID = join(outDir, "gm-frame-repeat-y.png");
const OUT_BOT = join(outDir, "gm-frame-cap-bottom.png");

mkdirSync(outDir, { recursive: true });

/** Einfache dunkle Leisten mit Goldlinie (bis echte Vorlage liegt). */
function placeholderCapSvg(height, variant) {
  const defs = `<defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#2a221c"/>
      <stop offset="100%" style="stop-color:#1a1512"/>
    </linearGradient>
  </defs>`;
  if (variant === "top") {
    const gem = `<ellipse cx="400" cy="52" rx="22" ry="14" fill="#c45c18" opacity="0.95"/><ellipse cx="400" cy="50" rx="18" ry="11" fill="#ff9a3c" opacity="0.85"/>`;
    const wave = `<path d="M0 ${height - 2} Q200 ${height - 8} 400 ${height - 4} T800 ${height - 2} L800 ${height} L0 ${height} Z" fill="#8b7355" opacity="0.35"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  ${defs}
  <rect width="800" height="${height}" fill="url(#g)"/>
  ${wave}
  ${gem}
</svg>`;
  }
  const gem = `<path d="M400 56 L418 76 L410 96 L390 96 L382 76 Z" fill="#1a1816" stroke="#6b5a45" stroke-width="2"/>`;
  const wave = `<path d="M0 0 L800 0 L800 4 Q600 10 400 6 Q200 2 0 8 Z" fill="#8b7355" opacity="0.35"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  ${defs}
  <rect width="800" height="${height}" fill="url(#g)"/>
  ${wave}
  ${gem}
</svg>`;
}

async function writePlaceholderCaps() {
  const topH = 108;
  const botH = 104;
  await sharp(Buffer.from(placeholderCapSvg(topH, "top"), "utf8"))
    .png()
    .toFile(OUT_TOP);
  await sharp(Buffer.from(placeholderCapSvg(botH, "bottom"), "utf8"))
    .png()
    .toFile(OUT_BOT);
  console.log("slice-gm-frame: Platzhalter-Leisten (gm-frame-cap-*.png)");
}

async function sliceFromFullFrame(absPath) {
  const buf = await sharp(absPath).ensureAlpha().png().toBuffer();
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h || w < 32 || h < 64) {
    throw new Error(`slice-gm-frame: ungültige Bildgröße ${w}×${h}`);
  }

  const topH = Math.round(h * 0.175);
  const botH = Math.round(h * 0.195);
  const bodyStart = topH;
  const bodyEnd = h - botH;
  const bodyLen = bodyEnd - bodyStart;
  if (bodyLen < 24) {
    throw new Error("slice-gm-frame: Bild zu niedrig für Mittelstreifen");
  }
  const midH = Math.min(64, Math.max(28, Math.round(bodyLen * 0.1)));
  const midY = bodyStart + Math.round((bodyLen - midH) / 2);

  await sharp(buf)
    .extract({ left: 0, top: 0, width: w, height: topH })
    .png()
    .toFile(OUT_TOP);
  await sharp(buf)
    .extract({ left: 0, top: midY, width: w, height: midH })
    .png()
    .toFile(OUT_MID);
  await sharp(buf)
    .extract({ left: 0, top: h - botH, width: w, height: botH })
    .png()
    .toFile(OUT_BOT);
  console.log(
    `slice-gm-frame: aus gm-meister-frame.png (${w}×${h}) — top ${topH}px, mid ${midH}px @${midY}, bottom ${botH}px`
  );
}

async function midFromImage27() {
  if (!existsSync(SRC_PARCHMENT)) {
    const flat = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="40" viewBox="0 0 800 40">
  <rect width="800" height="40" fill="#4a423e"/>
  <rect x="0" y="0" width="800" height="40" fill="none" stroke="#2a2420" stroke-width="1" opacity="0.4"/>
</svg>`;
    await sharp(Buffer.from(flat, "utf8")).png().toFile(OUT_MID);
    console.log("slice-gm-frame: Mittelstreifen-Platzhalter (SVG)");
    return;
  }
  const buf = await sharp(SRC_PARCHMENT).ensureAlpha().png().toBuffer();
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) {
    return;
  }
  const midH = Math.max(32, Math.min(56, Math.round(h * 0.08)));
  const midY = Math.round((h - midH) / 2);
  await sharp(buf)
    .extract({ left: 0, top: midY, width: w, height: midH })
    .resize(800, null)
    .png()
    .toFile(OUT_MID);
  console.log("slice-gm-frame: Mittelstreifen aus image27.png (auf 800px Breite skaliert)");
}

async function main() {
  if (existsSync(SRC_FRAME)) {
    try {
      await sliceFromFullFrame(SRC_FRAME);
      return;
    } catch (e) {
      console.warn("slice-gm-frame: Schnitt fehlgeschlagen —", e.message || e);
    }
  }
  await writePlaceholderCaps();
  await midFromImage27();
}

await main();
