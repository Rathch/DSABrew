/**
 * Macht die Porträt-Mitte in npc-block-template.png transparent (für Bild unter der Vorlage).
 * Prozentwerte müssen zu web/src/style.css `.dsa-npc__frame` passen (--npc-p-t / --npc-p-r / --npc-p-w).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const templatePath = join(webRoot, "public/dsa/npc-block-template.png");
const punchFlag = join(webRoot, ".npc-template-needs-punch");

/** Synchron zu style.css `.dsa-npc__frame` */
const NPC_P_T = 0.036;
const NPC_P_R = 0.02;
const NPC_P_W = 0.27;

/**
 * Kreis etwas kleiner als der CSS-Platz, damit der goldene Ring der PNG nicht mit weggeschnitten wird.
 * Bei Bedarf anpassen (0.82–0.95).
 */
const PUNCH_RADIUS_SCALE = 0.88;

async function main() {
  if (!existsSync(punchFlag) || readFileSync(punchFlag, "utf8").trim() !== "yes") {
    console.log("punch-npc-portrait-hole: übersprungen (media/npc-block-template.png mit Transparenz aktiv)");
    return;
  }
  if (!existsSync(templatePath)) {
    console.warn("punch-npc-portrait-hole: npc-block-template.png fehlt (zuerst copy-parchment-assets)");
    return;
  }

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch (e) {
    console.warn("punch-npc-portrait-hole: sharp nicht verfügbar — überspringe Porträt-Loch.", e.message || e);
    return;
  }

  const image = sharp(templatePath).ensureAlpha();
  const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const ch = info.channels;
  if (ch !== 4) {
    console.warn("punch-npc-portrait-hole: erwarte 4 Kanäle, hat", ch);
    return;
  }

  const d = NPC_P_W * W;
  const r = (d / 2) * PUNCH_RADIUS_SCALE;
  const cx = W - NPC_P_R * W - d / 2;
  const cy = NPC_P_T * H + d / 2;
  const r2 = r * r;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        const i = (y * W + x) * 4;
        data[i + 3] = 0;
      }
    }
  }

  await sharp(data, {
    raw: {
      width: W,
      height: H,
      channels: 4
    }
  })
    .png()
    .toFile(templatePath);
  console.log(
    `punch-npc-portrait-hole: Porträt-Loch transparent (Zentrum ~${cx.toFixed(0)},${cy.toFixed(0)} px, r≈${r.toFixed(1)})`
  );
}

await main();
