/**
 * Erzeugt /dsa/gm-frame-cap-top.png, gm-frame-repeat-y.png, gm-frame-cap-bottom.png
 *
 * Leisten: bevorzugt media/image28.png (oben) + media/image26.png (unten), jeweils 800px breit.
 * Alternativ: Referenz-Screenshot media/gm-meister-frame.png (optional gm-meister-frame-slice.json),
 * oder Ausschnitte aus image29.png, sonst SVG-Platzhalter.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..");
const outDir = join(webRoot, "public/dsa");

/** Referenz-Screenshot des kompletten Meister-Kastens (Zierleisten mit Gem + Maske); erste vorhandene Datei gewinnt */
const SRC_FRAME_CANDIDATES = [
  "media/gm-meister-frame.png",
  "media/meisterinformationen-reference.png"
];
const SLICE_RATIOS_PATH = join(repoRoot, "media/gm-meister-frame-slice.json");
/** Scriptorium: eigenständige Zierleisten-Grafiken */
const SRC_CAP_TOP = join(repoRoot, "media/image28.png");
const SRC_CAP_BOTTOM = join(repoRoot, "media/image26.png");
/** Gleiche Datei wie `note-gm-meister-bg.png` — obere/untere Leisten optisch an den Mittelstreifen anbinden */
const SRC_MEISTER_PANEL = join(repoRoot, "media/image29.png");
const SRC_PARCHMENT = join(repoRoot, "media/image27.png");

const OUT_TOP = join(outDir, "gm-frame-cap-top.png");
const OUT_MID = join(outDir, "gm-frame-repeat-y.png");
const OUT_BOT = join(outDir, "gm-frame-cap-bottom.png");

mkdirSync(outDir, { recursive: true });

function resolveSrcFramePath() {
  for (const rel of SRC_FRAME_CANDIDATES) {
    const abs = join(repoRoot, rel);
    if (existsSync(abs)) {
      return abs;
    }
  }
  return null;
}

/** Anteil der Bildhöhe für obere/untere Zierleiste bei `gm-meister-frame*.png` (optional überschreibbar per JSON). */
function readFullFrameSliceRatios() {
  const defaults = { topRatio: 0.13, bottomRatio: 0.15 };
  if (!existsSync(SLICE_RATIOS_PATH)) {
    return defaults;
  }
  try {
    const j = JSON.parse(readFileSync(SLICE_RATIOS_PATH, "utf8"));
    const top = typeof j.topRatio === "number" ? j.topRatio : defaults.topRatio;
    const bottom = typeof j.bottomRatio === "number" ? j.bottomRatio : defaults.bottomRatio;
    if (top <= 0 || bottom <= 0 || top + bottom >= 0.95) {
      return defaults;
    }
    return { topRatio: top, bottomRatio: bottom };
  } catch {
    return defaults;
  }
}

function deckleLeftPath(h) {
  const y = (t) => (h * t).toFixed(2);
  return `M0,0 L11,${y(0.035)} L3,${y(0.11)} L13,${y(0.19)} L5,${y(0.28)} L15,${y(0.36)} L6,${y(0.46)} L14,${y(0.54)} L7,${y(0.64)} L16,${y(0.72)} L5,${y(0.82)} L12,${y(0.91)} L0,${h} Z`;
}

function deckleRightPath(w, h) {
  const y = (t) => (h * t).toFixed(2);
  return `M${w},0 L${w - 11},${y(0.035)} L${w - 3},${y(0.11)} L${w - 13},${y(0.19)} L${w - 5},${y(0.28)} L${w - 15},${y(0.36)} L${w - 6},${y(0.46)} L${w - 14},${y(0.54)} L${w - 7},${y(0.64)} L${w - 16},${y(0.72)} L${w - 5},${y(0.82)} L${w - 12},${y(0.91)} L${w},${h} Z`;
}

/**
 * Fallback-Leisten: Pergament-Ton, leichte Textur, zackige Kanten (Anschluss ans Mittelfeld),
 * Gold-/Bronze-Zierleiste — nur wenn weder gm-meister-frame noch image29 vorliegen.
 */
function placeholderCapSvg(height, variant, uid) {
  const noise = `<filter id="n${uid}" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="${uid}" result="t"/>
    <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.22 0" result="g"/>
    <feBlend in="SourceGraphic" in2="g" mode="multiply"/>
  </filter>`;
  const defs = `<defs>
    <linearGradient id="g${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3d342c"/>
      <stop offset="45%" stop-color="#2a221c"/>
      <stop offset="100%" stop-color="#161210"/>
    </linearGradient>
    <linearGradient id="gold${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4a3d28" stop-opacity="0.9"/>
      <stop offset="20%" stop-color="#c9a227"/>
      <stop offset="50%" stop-color="#e8d4a8"/>
      <stop offset="80%" stop-color="#b8923a"/>
      <stop offset="100%" stop-color="#4a3d28" stop-opacity="0.9"/>
    </linearGradient>
    ${noise}
  </defs>`;
  const w = 800;
  const deckleL = deckleLeftPath(height);
  const deckleR = deckleRightPath(w, height);
  const seamWave =
    variant === "top"
      ? `M0,${height} L0,${height - 3} C80,${height - 14} 160,${height - 6} 240,${height - 10} S400,${height - 18} 480,${height - 8} S640,${height - 4} 720,${height - 12} L800,${height - 5} L800,${height} Z`
      : `M0,0 L0,5 C100,12 200,2 300,8 S500,14 600,4 S750,10 800,3 L800,0 Z`;

  if (variant === "top") {
    const gem = `<ellipse cx="400" cy="${Math.min(52, height - 20)}" rx="22" ry="14" fill="#c45c18" opacity="0.95"/><ellipse cx="400" cy="${Math.min(50, height - 22)}" rx="18" ry="11" fill="#ff9a3c" opacity="0.85"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  ${defs}
  <g filter="url(#n${uid})">
    <rect width="800" height="${height}" fill="url(#g${uid})"/>
    <path d="${deckleL}" fill="#1a1510" opacity="0.45"/>
    <path d="${deckleR}" fill="#1a1510" opacity="0.45"/>
    <rect x="24" y="3" width="752" height="5" rx="1" fill="url(#gold${uid})" opacity="0.55"/>
    <path d="${seamWave}" fill="#0d0b09" opacity="0.4"/>
  </g>
  ${gem}
</svg>`;
  }
  const cy = Math.round(height * 0.48);
  const gem = `<path d="M400 ${cy - 8} L418 ${cy + 12} L410 ${cy + 32} L390 ${cy + 32} L382 ${cy + 12} Z" fill="#1a1816" stroke="#a08040" stroke-width="1.2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  ${defs}
  <g filter="url(#n${uid})">
    <rect width="800" height="${height}" fill="url(#g${uid})"/>
    <path d="${deckleL}" fill="#1a1510" opacity="0.45"/>
    <path d="${deckleR}" fill="#1a1510" opacity="0.45"/>
    <rect x="24" y="${height - 8}" width="752" height="5" rx="1" fill="url(#gold${uid})" opacity="0.55"/>
    <path d="${seamWave}" fill="#0d0b09" opacity="0.4"/>
  </g>
  ${gem}
</svg>`;
}

async function writePlaceholderCaps(sharp) {
  const topH = 108;
  const botH = 104;
  await sharp(Buffer.from(placeholderCapSvg(topH, "top", "1"), "utf8"))
    .png()
    .toFile(OUT_TOP);
  await sharp(Buffer.from(placeholderCapSvg(botH, "bottom", "2"), "utf8"))
    .png()
    .toFile(OUT_BOT);
  console.log("slice-gm-frame: Platzhalter-Leisten (gm-frame-cap-*.png)");
}

/** Obere/untere Ausschnitte aus image29 — gleiche Grafik wie Mittel-Hintergrund, wirkt wie ein Stück. */
async function sliceCapsFromMeisterPanel(sharp, absPath) {
  const buf = await sharp(absPath).ensureAlpha().png().toBuffer();
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h || w < 32 || h < 64) {
    throw new Error(`slice-gm-frame: image29 ungültig ${w}×${h}`);
  }
  const topH = Math.max(24, Math.round(h * 0.168));
  const botH = Math.max(24, Math.round(h * 0.188));
  if (topH + botH >= h - 8) {
    throw new Error("slice-gm-frame: image29 zu niedrig für Leisten");
  }
  await sharp(buf)
    .extract({ left: 0, top: 0, width: w, height: topH })
    .resize({ width: 800 })
    .png()
    .toFile(OUT_TOP);
  await sharp(buf)
    .extract({ left: 0, top: h - botH, width: w, height: botH })
    .resize({ width: 800 })
    .png()
    .toFile(OUT_BOT);
  console.log(
    `slice-gm-frame: Leisten aus image29.png (${w}×${h}) — oben ${topH}px, unten ${botH}px → 800px breit`
  );
}

async function sliceFromFullFrame(sharp, absPath) {
  const buf = await sharp(absPath).ensureAlpha().png().toBuffer();
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h || w < 32 || h < 64) {
    throw new Error(`slice-gm-frame: ungültige Bildgröße ${w}×${h}`);
  }

  const { topRatio, bottomRatio } = readFullFrameSliceRatios();
  const topH = Math.max(16, Math.round(h * topRatio));
  const botH = Math.max(16, Math.round(h * bottomRatio));
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
    .resize({ width: 800 })
    .png()
    .toFile(OUT_TOP);
  await sharp(buf)
    .extract({ left: 0, top: midY, width: w, height: midH })
    .png()
    .toFile(OUT_MID);
  await sharp(buf)
    .extract({ left: 0, top: h - botH, width: w, height: botH })
    .resize({ width: 800 })
    .png()
    .toFile(OUT_BOT);
  console.log(
    `slice-gm-frame: aus Referenz-Rahmen (${w}×${h}, topRatio=${topRatio}, bottomRatio=${bottomRatio}) — top ${topH}px, mid ${midH}px @${midY}, bottom ${botH}px → Leisten 800px breit`
  );
}

/** image28 = obere Leiste, image26 = untere Leiste (Scriptorium-Assets). */
async function capsFromImage28And26(sharp) {
  if (!existsSync(SRC_CAP_TOP) || !existsSync(SRC_CAP_BOTTOM)) {
    return false;
  }
  await sharp(SRC_CAP_TOP).ensureAlpha().resize({ width: 800 }).png().toFile(OUT_TOP);
  await sharp(SRC_CAP_BOTTOM).ensureAlpha().resize({ width: 800 }).png().toFile(OUT_BOT);
  console.log("slice-gm-frame: gm-frame-cap-top ← image28.png, gm-frame-cap-bottom ← image26.png (800px breit)");
  await midFromImage27(sharp);
  return true;
}

async function midFromImage27(sharp) {
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
  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch (e) {
    console.warn(
      "slice-gm-frame: sharp nicht installiert — überspringe (nach `npm install` in web/ erneut `npm run prepare-assets`).",
      e.message || e
    );
    return;
  }

  try {
    if (await capsFromImage28And26(sharp)) {
      return;
    }
  } catch (e) {
    console.warn("slice-gm-frame: image28/image26 —", e.message || e);
  }

  const srcFrame = resolveSrcFramePath();
  if (srcFrame) {
    try {
      await sliceFromFullFrame(sharp, srcFrame);
      return;
    } catch (e) {
      console.warn("slice-gm-frame: Schnitt fehlgeschlagen —", e.message || e);
    }
  }
  if (existsSync(SRC_MEISTER_PANEL)) {
    try {
      await sliceCapsFromMeisterPanel(sharp, SRC_MEISTER_PANEL);
      await midFromImage27(sharp);
      return;
    } catch (e) {
      console.warn("slice-gm-frame: image29-Leisten fehlgeschlagen —", e.message || e);
    }
  }
  await writePlaceholderCaps(sharp);
  await midFromImage27(sharp);
}

await main();
