import MarkdownIt from "markdown-it";

import { NPC_TEMPLATE_PX } from "./npc-template-dimensions";
import {
  DEFAULT_IMPRESSUM_DATA,
  mergeImpressum,
  renderImpressumHtml,
  type ImpressumData
} from "./impressum-config";
import { resolveImpressumFieldKey } from "./impressum-field-aliases";
import { applyHeadingAnchorPlugin } from "./markdown-heading-anchor";

/** Resolved internal map ids (FR-013a backgrounds). `cover` is an alias for `einband`. */
const MAP_CANONICAL_KEYS = new Set(["einband", "content-even", "content-odd", "final"]);

const RAUTEN_ASSET_KEYS = new Set(["default", "dense"]);

/** Während `md.render` pro Seite: Anker-IDs = `p{Seitennummer}-{slug}` (siehe contracts/macros.md). */
let anchorPageDisplayNumber = 1;

function slugifyHeadingText(text: string): string {
  const t = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return t.length > 0 ? t : "abschnitt";
}

const md = new MarkdownIt({
  html: false,
  /* linkify: true frisst u. a. führende „{{“ in Makros (z. B. {{npcBlock) → {npcBlock in der HTML-Ausgabe). */
  linkify: false
});

applyHeadingAnchorPlugin(md, (s: string) => `p${anchorPageDisplayNumber}-${slugifyHeadingText(s)}`);

md.validateLink = (url: string): boolean => {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith("javascript:")) {
    return false;
  }
  return true;
};

export interface Footnote {
  label: string;
  content: string;
  sequence: number;
}

/** Scriptorsium-artige Fußzeile (Nummer + Laufender Titel), nur nach dem Impressum. */
export interface BookFooterStrip {
  title: string;
  pageNumber: number;
  /** Ungerade angezeigte Seitenzahl: Nummer links (Außen); gerade: Nummer rechts. */
  numberOnLeft: boolean;
}

export interface RenderedPage {
  index: number;
  displayPageNumber: number;
  renderedHtml: string;
  warnings: string[];
  footnotes: Footnote[];
  /** Canonical map id (`einband`, `content-even`, …) when macro was valid. */
  mapKey: string | null;
  rautenKey: string | null;
  /** Extra CSS class names for page chrome (backgrounds), space-separated. */
  pageChromeClasses: string;
  /** Gesetzt auf allen Seiten **nach** der letzten `{{impressumPage}}`-Seite (sonst `undefined` → klassische Ecke). */
  bookFooter?: BookFooterStrip;
}

export interface RenderResult {
  pages: RenderedPage[];
}

export interface RenderDocumentOptions {
  impressum?: Partial<ImpressumData>;
}

const PAGE_SPLIT = /\n\s*\\page\s*\n/g;
const PAGE_ALIAS = /\{\{page\}\}/g;
const PAGE_NUMBER = /\{\{pageNumber\s+(\d+)\}\}/g;
const FOOTNOTE_MACRO = /\{\{footnote\s+([^|]+?)\s*\|\s*([^}]+)\}\}/g;
/** Pergament-Vorlesetext (hell); Aliase: `vorlesenNote`. Titel | Fließtext (Markdown im Inhalt). */
const READ_ALOUD_NOTE_MACRO = /\{\{(readAloudNote|vorlesenNote)\s+([^|]*?)\s*\|\s*([\s\S]*?)\}\}/g;
/** Meisterinformation (dunkel); Alias: `meisterNote`. */
const GM_NOTE_MACRO = /\{\{(gmNote|meisterNote)\s+([^|]*?)\s*\|\s*([\s\S]*?)\}\}/g;
/** NPC-/Monster-Kasten: `schlüssel=wert`, Ende `{{/npcBlock}}` (ein- oder mehrzeilig). */
const NPC_BLOCK_MACRO =
  /\{\{npcBlock\s*\n?([\s\S]*?)\s*\{\{\s*\/npcBlock\s*\}\}\}/g;
const VALID_BG_MACRO = /\\(map|rauten)\{([^}\n]+)\}/g;
const IMPRESSUM_PAGE_MACRO = /\{\{impressumPage\}\}/g;
const IMPRESSUM_FIELD_MACRO = /\{\{impressumField\s+(\w+)\s*=\s*([^}]*)\}\}/g;

/** Sammelt alle `{{impressumField …}}` im Dokument (letzte Angabe pro Key gewinnt). */
function collectGlobalImpressumOverrides(fullMarkdown: string): Partial<ImpressumData> {
  const partial: Partial<ImpressumData> = {};
  const re = new RegExp(IMPRESSUM_FIELD_MACRO.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(fullMarkdown)) !== null) {
    const resolved = resolveImpressumFieldKey(m[1]);
    if (resolved) {
      (partial as Record<string, string>)[resolved] = m[2].trim();
    }
  }
  return partial;
}

function findLastImpressumPageIndex(pages: string[]): number {
  let last = -1;
  for (let i = 0; i < pages.length; i++) {
    IMPRESSUM_PAGE_MACRO.lastIndex = 0;
    if (IMPRESSUM_PAGE_MACRO.test(pages[i])) {
      last = i;
    }
  }
  IMPRESSUM_PAGE_MACRO.lastIndex = 0;
  return last;
}

function collectImpressumFields(raw: string): {
  cleaned: string;
  partial: Partial<ImpressumData>;
  fieldWarnings: string[];
} {
  const partial: Partial<ImpressumData> = {};
  const fieldWarnings: string[] = [];
  const cleaned = raw.replace(IMPRESSUM_FIELD_MACRO, (_full, key: string, value: string) => {
    const resolved = resolveImpressumFieldKey(key);
    if (resolved) {
      (partial as Record<string, string>)[resolved] = value.trim();
    } else {
      fieldWarnings.push(`[WARN] Unknown impressumField key: ${key.trim()}`);
    }
    return "";
  });
  return { cleaned, partial, fieldWarnings };
}

/**
 * `cover` → einband. Nur beim Einband: zweites Wort `hell` / `dunkel` (Aliase light, dark, heller).
 */
function parseMapMacroInner(rawKey: string): {
  canonical: string | null;
  einbandTone?: "hell" | "dunkel";
} {
  const parts = rawKey
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return { canonical: null };
  }

  let base = parts[0];
  if (base === "cover") {
    base = "einband";
  }

  if (!MAP_CANONICAL_KEYS.has(base)) {
    return { canonical: null };
  }

  if (parts.length === 1) {
    return base === "einband"
      ? { canonical: "einband", einbandTone: "dunkel" }
      : { canonical: base };
  }

  if (base !== "einband" || parts.length > 2) {
    return { canonical: null };
  }

  const mod = parts[1];
  if (mod === "hell" || mod === "heller" || mod === "light") {
    return { canonical: "einband", einbandTone: "hell" };
  }
  if (mod === "dunkel" || mod === "dark") {
    return { canonical: "einband", einbandTone: "dunkel" };
  }
  return { canonical: null };
}

export function buildPageChromeClasses(
  mapKey: string | null,
  rautenKey: string | null,
  einbandTone?: "hell" | "dunkel"
): string {
  const parts: string[] = [];
  if (mapKey) {
    parts.push(`page-bg-${mapKey}`);
    if (mapKey === "einband" && einbandTone === "hell") {
      parts.push("page-einband-hell");
    }
  }
  if (rautenKey) {
    parts.push(`page-rauten-${rautenKey}`);
  }
  return parts.join(" ").trim();
}

function splitPages(input: string): string[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [""];
  }
  return normalized.split(PAGE_SPLIT);
}

function normalizePageBreakMacros(input: string): string {
  return input.replace(PAGE_ALIAS, "\n\\page\n");
}

function parsePageNumberStart(input: string): { start: number; cleaned: string } {
  let start = 1;
  const cleaned = input.replace(PAGE_NUMBER, (_, n: string) => {
    start = Number.parseInt(n, 10) || 1;
    return "";
  });
  return { start, cleaned };
}

/**
 * Plain-text token (no `__`, `*`, `[` patterns that Markdown would interpret).
 * Real `<sup>` is injected after `md.render` — with `html: false`, raw `<sup>` in the source would be escaped.
 */
function footnoteRefPlaceholder(sequence: number): string {
  return `DSABREWFNREF${String(sequence).padStart(5, "0")}`;
}

function readAloudNotePlaceholder(sequence: number): string {
  return `DSABREWREADNOTE${String(sequence).padStart(5, "0")}`;
}

function gmNotePlaceholder(sequence: number): string {
  return `DSABREWGMNOTE${String(sequence).padStart(5, "0")}`;
}

function npcBlockPlaceholder(sequence: number): string {
  return `DSABREWNPCBLOCK${String(sequence).padStart(5, "0")}`;
}

interface CollectedNoteMacro {
  token: string;
  title: string;
  body: string;
  kind: "readAloud" | "gm";
}

function collectReadAloudNotes(raw: string): { cleaned: string; items: CollectedNoteMacro[] } {
  let sequence = 1;
  const items: CollectedNoteMacro[] = [];
  READ_ALOUD_NOTE_MACRO.lastIndex = 0;
  const cleaned = raw.replace(READ_ALOUD_NOTE_MACRO, (_full, _name: string, title: string, body: string) => {
    const token = readAloudNotePlaceholder(sequence);
    items.push({ kind: "readAloud", token, title, body });
    sequence += 1;
    return token;
  });
  READ_ALOUD_NOTE_MACRO.lastIndex = 0;
  return { cleaned, items };
}

function collectGmNotes(raw: string): { cleaned: string; items: CollectedNoteMacro[] } {
  let sequence = 1;
  const items: CollectedNoteMacro[] = [];
  GM_NOTE_MACRO.lastIndex = 0;
  const cleaned = raw.replace(GM_NOTE_MACRO, (_full, _name: string, title: string, body: string) => {
    const token = gmNotePlaceholder(sequence);
    items.push({ kind: "gm", token, title, body });
    sequence += 1;
    return token;
  });
  GM_NOTE_MACRO.lastIndex = 0;
  return { cleaned, items };
}

const DEFAULT_READ_ALOUD_TITLE = "Zum Vorlesen oder Nacherzählen:";
const DEFAULT_GM_TITLE = "Meisterinformation:";

function buildReadAloudNoteHtml(title: string, bodyMarkdown: string): string {
  const titleText = title.trim() || DEFAULT_READ_ALOUD_TITLE;
  const titleHtml = md.utils.escapeHtml(titleText);
  const bodyHtml = md.render(bodyMarkdown.trim());
  return `<div class="dsa-note-wrap dsa-note-wrap--read-aloud"><aside class="dsa-note dsa-note--read-aloud" role="note"><h3 class="dsa-note__title">${titleHtml}</h3><div class="dsa-note__body">${bodyHtml}</div></aside></div>`;
}

function buildGmNoteHtml(title: string, bodyMarkdown: string): string {
  const titleText = title.trim() || DEFAULT_GM_TITLE;
  const titleHtml = md.utils.escapeHtml(titleText);
  const bodyHtml = md.render(bodyMarkdown.trim());
  return `<div class="dsa-note-wrap dsa-note-wrap--gm"><div class="dsa-gm-frame" role="note"><div class="dsa-gm-frame__cap dsa-gm-frame__cap--top"><img class="dsa-gm-frame__cap-img" src="/dsa/gm-frame-cap-top.png" alt="" decoding="async" /></div><div class="dsa-gm-frame__mid"><aside class="dsa-note dsa-note--gm dsa-note--gm-framed"><h3 class="dsa-note__title">${titleHtml}</h3><div class="dsa-note__body">${bodyHtml}</div></aside></div><div class="dsa-gm-frame__cap dsa-gm-frame__cap--bottom"><img class="dsa-gm-frame__cap-img" src="/dsa/gm-frame-cap-bottom.png" alt="" decoding="async" /></div></div></div>`;
}

/** Ersetzt Makro-Platzhalter; bevorzugt ganze `<p>TOKEN</p>`-Blöcke (Block-Level). */
function injectBlockToken(html: string, token: string, blockHtml: string): string {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wrapped = new RegExp(`<p>\\s*${escaped}\\s*</p>`, "gi");
  let out = html.replace(wrapped, blockHtml);
  if (out.includes(token)) {
    out = out.split(token).join(blockHtml);
  }
  return out;
}

function injectNoteMacros(html: string, items: CollectedNoteMacro[]): string {
  let out = html;
  for (const item of items) {
    const block =
      item.kind === "readAloud"
        ? buildReadAloudNoteHtml(item.title, item.body)
        : buildGmNoteHtml(item.title, item.body);
    out = injectBlockToken(out, item.token, block);
  }
  return out;
}

const NPC_KEY_ALIASES: Record<string, string> = {
  titel: "name",
  title: "name",
  bild: "portrait",
  image: "portrait",
  size: "groesse",
  größe: "groesse",
  weight: "gewicht",
  attack1: "angriff1",
  attack2: "angriff2",
  actions: "aktionen",
  special: "sonderfertigkeiten",
  specials: "sonderfertigkeiten",
  sonderfertigkeit: "sonderfertigkeiten",
  talents: "talente"
};

function normalizeNpcKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  return NPC_KEY_ALIASES[k] ?? k;
}

/** Längste Schlüssel zuerst, damit z. B. `ini` vor `in` und `sonderfertigkeiten` korrekt greift. */
const NPC_SCAN_KEYS_SORTED = [
  "sonderfertigkeiten",
  "angriff1",
  "angriff2",
  "aktionen",
  "portrait",
  "groesse",
  "gewicht",
  "row3e",
  "talente",
  "name",
  "lep",
  "ini",
  "mu",
  "kl",
  "in",
  "ch",
  "ff",
  "ge",
  "ko",
  "kk",
  "aw",
  "rs",
  "sk",
  "zk",
  "gs"
].sort((a, b) => b.length - a.length);

/** Eine Zeile mit mehreren `schlüssel=wert`-Paaren (Leerzeichen dazwischen), z. B. `name=… portrait=…`. */
function parseNpcSingleLine(single: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lower = single.toLowerCase();
  const hits: { pos: number; key: string }[] = [];
  for (let i = 0; i < lower.length; i++) {
    for (const key of NPC_SCAN_KEYS_SORTED) {
      const token = `${key}=`;
      if (lower.slice(i, i + token.length) !== token) {
        continue;
      }
      if (i > 0 && !/[\s\n]/.test(single[i - 1]!)) {
        continue;
      }
      hits.push({ pos: i, key });
      break;
    }
  }
  for (let i = 0; i < hits.length; i++) {
    const valueStart = hits[i].pos + hits[i].key.length + 1;
    const valueEnd = i + 1 < hits.length ? hits[i + 1].pos : single.length;
    const value = single.slice(valueStart, valueEnd).trim();
    const k = normalizeNpcKey(hits[i].key);
    if (k) {
      out[k] = value;
    }
  }
  return out;
}

function parseNpcBlockBody(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      continue;
    }
    const eq = t.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const eqCount = (t.match(/=/g) ?? []).length;
    if (eqCount <= 1) {
      const rawKey = t.slice(0, eq).trim();
      const value = t.slice(eq + 1).trim();
      const key = normalizeNpcKey(rawKey);
      if (key) {
        out[key] = value;
      }
    } else {
      const parsed = parseNpcSingleLine(t);
      if (Object.keys(parsed).length > 0) {
        Object.assign(out, parsed);
      } else {
        const rawKey = t.slice(0, eq).trim();
        const value = t.slice(eq + 1).trim();
        const key = normalizeNpcKey(rawKey);
        if (key) {
          out[key] = value;
        }
      }
    }
  }
  return out;
}

/**
 * Portrait-Wert aus dem Makro: Anführungszeichen / spitze Klammern entfernen
 * (häufig bei `portrait="https://…"` oder Kopie aus Markdown).
 */
function normalizeNpcPortraitRaw(raw: string): string {
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  if (t.startsWith("<") && t.endsWith(">")) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Portrait: http(s), absolut ab `/`, oder kurzer Name für `public/dsa/` (Vite).
 * `bild.png` → `/dsa/bild.png`; `dsa/unter/…` → `/dsa/unter/…`
 */
function portraitSrcForHtml(url: string): string | null {
  const t = normalizeNpcPortraitRaw(url);
  if (!t) {
    return null;
  }
  if (t.startsWith("/") && !t.startsWith("//") && !t.includes("..")) {
    return md.utils.escapeHtml(t);
  }
  if (!t.includes("..") && !/^[a-z][a-z0-9+.-]*:/i.test(t)) {
    if (/^dsa\//i.test(t)) {
      const rest = t.slice(4).replace(/^\/+/, "");
      if (rest && !rest.startsWith("/") && !rest.includes("\\") && !rest.includes("..")) {
        return md.utils.escapeHtml(`/dsa/${rest}`);
      }
    }
    if (!t.includes("/") && !t.includes("\\")) {
      if (/^[a-zA-Z0-9_.-]+$/.test(t)) {
        return md.utils.escapeHtml(`/dsa/${t}`);
      }
    }
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }
    if (u.username || u.password) {
      return null;
    }
    return md.utils.escapeHtml(u.href);
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return md.utils.escapeHtml(s);
}

function npcVal(fields: Record<string, string>, key: string): string {
  return (fields[key] ?? "").trim();
}

function buildNpcStatGrid(fields: Record<string, string>): string {
  const cell = (label: string, key: string, extraClass?: string): string => {
    const v = npcVal(fields, key);
    const cls = `dsa-npc__stat-cell${extraClass ? ` ${extraClass}` : ""}`;
    return `<span class="${cls}"><strong>${esc(label)}</strong> ${v ? esc(v) : "—"}</span>`;
  };
  const row3e = npcVal(fields, "row3e");
  const rows: string[][] = [
    [cell("MU", "mu"), cell("KL", "kl"), cell("IN", "in"), cell("CH", "ch")],
    [cell("FF", "ff"), cell("GE", "ge"), cell("KO", "ko"), cell("KK", "kk")],
    [cell("LeP", "lep"), cell("INI", "ini", "dsa-npc__stat-cell--span-2"), cell("AW", "aw")]
  ];
  if (row3e) {
    const row3last = `<span class="dsa-npc__stat-cell">${esc(row3e)}</span>`;
    const emptyCell = `<span class="dsa-npc__stat-cell dsa-npc__stat-cell--empty"></span>`;
    rows.push([row3last, emptyCell, emptyCell, emptyCell]);
  }
  rows.push([cell("RS", "rs"), cell("SK", "sk"), cell("ZK", "zk"), cell("GS", "gs")]);
  const inner = rows
    .map((r) => `<div class="dsa-npc__stat-row">${r.join("")}</div>`)
    .join("");
  return `<div class="dsa-npc__stat-grid" role="group" aria-label="Eigenschaften">${inner}</div>`;
}

function buildNpcBlockHtml(fields: Record<string, string>): string {
  const name = npcVal(fields, "name") || "Unbenannt";
  const groesse = npcVal(fields, "groesse");
  const gewicht = npcVal(fields, "gewicht");
  const portraitRaw = npcVal(fields, "portrait");
  const portraitSrc = portraitSrcForHtml(portraitRaw);

  const portraitInner = portraitSrc
    ? `<img class="dsa-npc__portrait-img" src="${portraitSrc}" alt="" loading="lazy" decoding="async" />`
    : `<div class="dsa-npc__portrait-placeholder" aria-hidden="true"></div>`;

  const metaGroesse = groesse
    ? `<p class="dsa-npc__meta"><strong>Größe:</strong> ${esc(groesse)}</p>`
    : "";
  const metaGewicht = gewicht
    ? `<p class="dsa-npc__meta"><strong>Gewicht:</strong> ${esc(gewicht)}</p>`
    : "";

  const a1 = npcVal(fields, "angriff1");
  const a2 = npcVal(fields, "angriff2");
  const akt = npcVal(fields, "aktionen");
  const combatParts: string[] = [];
  if (a1) {
    combatParts.push(`<p class="dsa-npc__line"><strong>Angriff 1:</strong> ${esc(a1)}</p>`);
  }
  if (a2) {
    combatParts.push(`<p class="dsa-npc__line"><strong>Angriff 2:</strong> ${esc(a2)}</p>`);
  }
  if (akt) {
    combatParts.push(`<p class="dsa-npc__line"><strong>Aktionen:</strong> ${esc(akt)}</p>`);
  }
  const combatHtml =
    combatParts.length > 0
      ? `<div class="dsa-npc__combat">${combatParts.join("")}</div>`
      : "";

  const sonder = npcVal(fields, "sonderfertigkeiten");
  const talente = npcVal(fields, "talente");
  const extras: string[] = [];
  if (sonder) {
    extras.push(`<p class="dsa-npc__line"><strong>Sonderfertigkeiten:</strong> ${esc(sonder)}</p>`);
  }
  if (talente) {
    extras.push(`<p class="dsa-npc__line"><strong>Talente:</strong> ${esc(talente)}</p>`);
  }
  const extrasHtml =
    extras.length > 0 ? `<div class="dsa-npc__extras">${extras.join("")}</div>` : "";

  return `<div class="dsa-npc-wrap">
  <section class="dsa-npc" aria-label="NSC / Monster ${esc(name)}">
    <div class="dsa-npc__frame">
      <div class="dsa-npc__inner">
        <div class="dsa-npc__content">
          <header class="dsa-npc__header">
            <div class="dsa-npc__title-block">
              <h3 class="dsa-npc__name">${esc(name)}</h3>
              ${metaGroesse}
              ${metaGewicht}
            </div>
          </header>
          ${buildNpcStatGrid(fields)}
          ${combatHtml}
          ${extrasHtml}
        </div>
      </div>
      <img
        class="dsa-npc__template"
        src="/dsa/npc-block-template.png"
        alt=""
        width="${NPC_TEMPLATE_PX.w}"
        height="${NPC_TEMPLATE_PX.h}"
        decoding="async"
        fetchpriority="low"
        aria-hidden="true"
      />
      <div class="dsa-npc__portrait">${portraitInner}</div>
    </div>
  </section>
</div>`;
}

interface CollectedNpcMacro {
  token: string;
  fields: Record<string, string>;
}

function collectNpcBlocks(raw: string): { cleaned: string; items: CollectedNpcMacro[]; warnings: string[] } {
  const warnings: string[] = [];
  let sequence = 1;
  const items: CollectedNpcMacro[] = [];
  NPC_BLOCK_MACRO.lastIndex = 0;
  const cleaned = raw.replace(NPC_BLOCK_MACRO, (_full, body: string) => {
    const fields = parseNpcBlockBody(body);
    const portraitRaw = npcVal(fields, "portrait");
    if (portraitRaw && !portraitSrcForHtml(portraitRaw)) {
      warnings.push(`[WARN] npcBlock: Portrait-URL ungültig oder nicht erlaubt: ${portraitRaw.slice(0, 96)}`);
    }
    const token = npcBlockPlaceholder(sequence);
    items.push({ token, fields });
    sequence += 1;
    return token;
  });
  NPC_BLOCK_MACRO.lastIndex = 0;
  return { cleaned, items, warnings };
}

function injectNpcBlocks(html: string, items: CollectedNpcMacro[]): string {
  let out = html;
  for (const item of items) {
    out = injectBlockToken(out, item.token, buildNpcBlockHtml(item.fields));
  }
  return out;
}

function collectFootnotes(raw: string): { cleaned: string; footnotes: Footnote[] } {
  const footnotes: Footnote[] = [];
  let sequence = 1;
  const cleaned = raw.replace(FOOTNOTE_MACRO, (_, label: string, content: string) => {
    const escapedLabel = md.utils.escapeHtml(label.trim());
    const escapedContent = md.utils.escapeHtml(content.trim());
    footnotes.push({
      label: escapedLabel,
      content: escapedContent,
      sequence
    });
    const marker = footnoteRefPlaceholder(sequence);
    sequence += 1;
    return marker;
  });
  return { cleaned, footnotes };
}

function injectFootnoteRefs(html: string, footnotes: Footnote[]): string {
  let out = html;
  for (const fn of footnotes) {
    const token = footnoteRefPlaceholder(fn.sequence);
    const sup = `<sup class="footnote-ref">[${fn.label}]</sup>`;
    if (out.includes(token)) {
      out = out.split(token).join(sup);
    }
  }
  return out;
}

function parseBackgrounds(raw: string): {
  cleaned: string;
  mapKey: string | null;
  rautenKey: string | null;
  einbandTone?: "hell" | "dunkel";
  warnings: string[];
} {
  const warnings: string[] = [];
  let mapKey: string | null = null;
  let rautenKey: string | null = null;
  let einbandTone: "hell" | "dunkel" | undefined;

  const cleaned = raw.replace(VALID_BG_MACRO, (_, macro: "map" | "rauten", key: string) => {
    const normalizedKey = key.trim().toLowerCase();
    if (macro === "map") {
      const parsed = parseMapMacroInner(key);
      if (!parsed.canonical) {
        warnings.push(`[WARN] Unknown map key: ${key.trim()}`);
      } else {
        mapKey = parsed.canonical;
        if (parsed.canonical === "einband" && parsed.einbandTone) {
          einbandTone = parsed.einbandTone;
        }
      }
    } else if (!RAUTEN_ASSET_KEYS.has(normalizedKey)) {
      warnings.push(`[WARN] Unknown rauten key: ${key.trim()}`);
    } else {
      rautenKey = normalizedKey;
    }
    return "";
  });

  if (cleaned.includes("\\map{") || cleaned.includes("\\rauten{")) {
    warnings.push("[WARN] Malformed macro invocation");
  }

  return { cleaned, mapKey, rautenKey, einbandTone, warnings };
}

/** Eintrag für {{tocDepthH3}} — aus Markdown aller Seiten (siehe contracts/macros.md: dokumentweit). */
interface TocHeadingItem {
  level: number;
  titleHtml: string;
}

/**
 * Sammelt `#`–`###`-Zeilen in Dokumentreihenfolge (alle \\page-Segmente).
 * Überspringt Fenced Code und {{npcBlock}}-Körper, damit keine falschen Treffer.
 */
function collectDocumentHeadingsForToc(pageSources: string[]): TocHeadingItem[] {
  const items: TocHeadingItem[] = [];
  const headingLineRe = /^\s{0,3}(#{1,3})\s+(.+?)\s*$/;
  for (const source of pageSources) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let inFence = false;
    let inNpcBlock = false;
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) {
        continue;
      }
      if (/\{\{\s*npcBlock\b/i.test(line)) {
        inNpcBlock = true;
      }
      if (inNpcBlock) {
        if (/\{\{\s*\/npcBlock\s*\}\}/i.test(line)) {
          inNpcBlock = false;
        }
        continue;
      }
      const m = headingLineRe.exec(line);
      if (!m) {
        continue;
      }
      const titleRaw = m[2].trim();
      if (!titleRaw) {
        continue;
      }
      items.push({
        level: m[1].length,
        titleHtml: md.renderInline(titleRaw)
      });
    }
  }
  return items;
}

function buildTocNavHtml(items: TocHeadingItem[]): string {
  if (items.length === 0) {
    return `<nav class="toc"><p>No headings found.</p></nav>`;
  }
  const lis = items
    .map((item) => `<li class="toc-l${item.level}">${item.titleHtml}</li>`)
    .join("");
  return `<nav class="toc"><ol>${lis}</ol></nav>`;
}

/** Ersetzt wörtliches `{{tocDepthH3}}` im gerenderten HTML (z. B. in <p>…</p>). */
function injectTocMacro(html: string, tocItems: TocHeadingItem[]): string {
  const tocHtml = buildTocNavHtml(tocItems);
  return html.split("{{tocDepthH3}}").join(tocHtml);
}

export function renderDocument(markdown: string, options?: RenderDocumentOptions): RenderResult {
  const normalizedBreaks = normalizePageBreakMacros(markdown);
  const pageNumberData = parsePageNumberStart(normalizedBreaks);
  const pages = splitPages(pageNumberData.cleaned);

  const globalImp = collectGlobalImpressumOverrides(pageNumberData.cleaned);
  const runningTitleMerged = mergeImpressum({ ...options?.impressum, ...globalImp });
  const runningTitle = runningTitleMerged.projectTitle.trim() || DEFAULT_IMPRESSUM_DATA.projectTitle;

  const lastImpressumPageIndex = findLastImpressumPageIndex(pages);
  const documentTocItems = collectDocumentHeadingsForToc(pages);

  const renderedPages: RenderedPage[] = pages.map((rawPage, index) => {
    const displayPageNumber = pageNumberData.start + index;
    anchorPageDisplayNumber = displayPageNumber;

    const bgData = parseBackgrounds(rawPage);
    const imFields = collectImpressumFields(bgData.cleaned);
    const hasImpressumMacro = IMPRESSUM_PAGE_MACRO.test(imFields.cleaned);
    IMPRESSUM_PAGE_MACRO.lastIndex = 0;
    const withoutImpressumMacro = imFields.cleaned.replace(IMPRESSUM_PAGE_MACRO, "\n");
    const footnoteData = collectFootnotes(withoutImpressumMacro);
    const readAloudData = collectReadAloudNotes(footnoteData.cleaned);
    const gmData = collectGmNotes(readAloudData.cleaned);
    const npcData = !hasImpressumMacro
      ? collectNpcBlocks(gmData.cleaned)
      : { cleaned: gmData.cleaned, items: [] as CollectedNpcMacro[], warnings: [] as string[] };

    /* Makros im Dokument überschreiben programmatische Optionen */
    const impressumDataMerged = mergeImpressum({
      ...options?.impressum,
      ...imFields.partial
    });

    let html: string;
    if (hasImpressumMacro) {
      html = renderImpressumHtml(impressumDataMerged, (s) => md.utils.escapeHtml(s));
    } else {
      html = md.render(npcData.cleaned);
      html = injectNoteMacros(html, [...readAloudData.items, ...gmData.items]);
      html = injectNpcBlocks(html, npcData.items);
      html = injectFootnoteRefs(html, footnoteData.footnotes);
      html = injectTocMacro(html, documentTocItems);
    }

    const footnoteHtml =
      footnoteData.footnotes.length > 0
        ? `<footer class="footnotes">${footnoteData.footnotes
            .map((entry) => `<p>[${entry.label}] ${entry.content}</p>`)
            .join("")}</footer>`
        : "";

    const allWarnings = [...bgData.warnings, ...imFields.fieldWarnings, ...npcData.warnings];

    const warningHtml =
      allWarnings.length > 0
        ? `<aside class="warnings">${allWarnings
            .map((warning) => `<p>${md.utils.escapeHtml(warning)}</p>`)
            .join("")}</aside>`
        : "";

    /* Scriptorium / FR-013a: Nach dem Einband wechseln die Inhaltstexturen (image12 ↔ image17)
     * gegen die naive „Seite N gerade ↔ even-Asset“-Zuordnung. Ungerade Seitenzahl → content-even
     * (image12), gerade → content-odd (image17), damit Impressum (meist Seite 2) und folgende
     * Inhaltsseiten zur Word-Vorlage passen. */
    const effectiveMapKey =
      bgData.mapKey ?? (displayPageNumber % 2 === 0 ? "content-odd" : "content-even");

    const showBookFooter =
      lastImpressumPageIndex >= 0
        ? index > lastImpressumPageIndex
        : index > 0;

    const bookFooter: BookFooterStrip | undefined = showBookFooter
      ? {
          title: runningTitle,
          pageNumber: displayPageNumber,
          numberOnLeft: displayPageNumber % 2 === 1
        }
      : undefined;

    return {
      index,
      displayPageNumber,
      renderedHtml: `${warningHtml}${html}${footnoteHtml}`,
      warnings: allWarnings,
      footnotes: footnoteData.footnotes,
      mapKey: effectiveMapKey,
      rautenKey: bgData.rautenKey,
      pageChromeClasses: buildPageChromeClasses(
        effectiveMapKey,
        bgData.rautenKey,
        effectiveMapKey === "einband" ? bgData.einbandTone : undefined
      ),
      bookFooter
    };
  });

  return { pages: renderedPages };
}
