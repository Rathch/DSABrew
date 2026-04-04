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
import easierIconUrl from "@media/image19.png?url";
import harderIconUrl from "@media/image20.png?url";
import chessImg8 from "@media/image8.png?url";
import chessImg9 from "@media/image9.png?url";
import chessImg10 from "@media/image10.png?url";
import chessImg11 from "@media/image11.png?url";
import difficultyEmptyUrl from "@media/image5.png?url";
import difficultyRedFilledUrl from "@media/image6.png?url";
import difficultyGreenFilledUrl from "@media/image3.png?url";

/** Resolved internal map ids (FR-013a backgrounds). `cover` is an alias for `einband`. */
const MAP_CANONICAL_KEYS = new Set(["einband", "content-even", "content-odd", "final"]);

const RAUTEN_ASSET_KEYS = new Set(["default", "dense"]);

/** During `md.render` per page: anchor IDs = `p{pageNumber}-{slug}` (see contracts/macros.md). */
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
  /* linkify: true eats leading “{{” in macros (e.g. {{npcBlock) → {npcBlock in HTML output). */
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

/** Scriptorium parchment style for Markdown tables (see style.css `.dsa-md-table`). */
md.renderer.rules.table_open = () => '<table class="dsa-md-table">\n';

export interface Footnote {
  label: string;
  content: string;
  sequence: number;
}

/** Scriptorium-style footer strip (number + running title), only after the impressum page. */
export interface BookFooterStrip {
  title: string;
  pageNumber: number;
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
  /** `true` after `\\pageSingle` / `{{pageSingle}}` — single-column layout (`.a4-page--single-column`). */
  singleColumn?: boolean;
  /** Set on all pages **after** the last `{{impressumPage}}` page (otherwise `undefined` → classic corner). */
  bookFooter?: BookFooterStrip;
}

export interface RenderResult {
  pages: RenderedPage[];
}

export interface RenderDocumentOptions {
  impressum?: Partial<ImpressumData>;
}

/** Page break; optional `Single` → following page is single-column (`\\pageSingle`). */
const PAGE_OR_SINGLE_BREAK = /(?:^|\n)\s*\\page(Single)?\s*\n/g;
const PAGE_ALIAS = /\{\{page\}\}/g;
const PAGE_SINGLE_ALIAS = /\{\{\s*pageSingle\s*\}\}/gi;
const PAGE_NUMBER = /\{\{pageNumber\s+(\d+)\}\}/g;
const FOOTNOTE_MACRO = /\{\{footnote\s+([^|]+?)\s*\|\s*([^}]+)\}\}/g;
/** Parchment read-aloud note (light); aliases: `vorlesenNote`. Title | body (Markdown in body). */
const READ_ALOUD_NOTE_MACRO = /\{\{(readAloudNote|vorlesenNote)\s+([^|]*?)\s*\|\s*([\s\S]*?)\}\}/g;
/** GM note (dark); alias: `meisterNote`. */
const GM_NOTE_MACRO = /\{\{(gmNote|meisterNote)\s+([^|]*?)\s*\|\s*([\s\S]*?)\}\}/g;
/** Rule/optional box (gray body, dark head): `Title | Subtitle | Markdown`. Empty subtitle: `Title | | Body`. */
const ROULBOX_MACRO =
  /\{\{\s*roulbox\s+([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([\s\S]*?)\}\}/gi;
/** Optional hints: icon on the left (`media/image19` / `image20`), body = Markdown. */
const EASIER_HARDER_MACRO = /\{\{(easier|harder)\s*\|\s*([\s\S]*?)\}\}/gi;
/** Inline chess piece: `{{ chess | pawn }}` — names in `resolveChessPiece`. */
const CHESS_MACRO = /\{\{\s*chess\s*\|\s*([^}]+?)\s*\}\}/gi;
/** Four diamonds 0–4; optional prefix: `{{ difficulty | Kampf: | grün 4 }}` or `{{ difficulty | rot 3 }}` (alias `dificulty`). Label must not contain `}` — otherwise `[^|]*?` spans past `}}` to the next macro’s `|`. */
const DIFFICULTY_RATING_MACRO =
  /\{\{\s*(?:difficulty|dificulty)\s*\|\s*(?:([^|}]*?)\s*\|\s*)?([^}]+?)\s*\}\}/gi;
/** Solo adventure: jump to numbered `## N. …` heading; LABEL = Markdown inline. No `}}` in LABEL. */
const ABSCHNITT_MACRO =
  /\{\{\s*abschnitt\s+(\d+)\s*\|\s*([\s\S]*?)\}\}/gi;
/** NPC/monster block: `key=value`, end `{{/npcBlock}}` (single- or multi-line). `gi`: optional space after `{{`, npcBlock spelling. */
const NPC_BLOCK_MACRO =
  /\{\{\s*npcBlock\s*\n?([\s\S]*?)\s*\{\{\s*\/npcBlock\s*\}\}/gi;
const VALID_BG_MACRO = /\\(map|rauten)\{([^}\n]+)\}/g;
const IMPRESSUM_PAGE_MACRO = /\{\{impressumPage\}\}/g;
const IMPRESSUM_FIELD_MACRO = /\{\{impressumField\s+(\w+)\s*=\s*([^}]*)\}\}/g;

/** Collects all `{{impressumField …}}` in the document (last value per key wins). */
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

/**
 * Ignore macro examples in \`…\` / \`\`\`…\`\`\` so e.g. \`{{impressumPage}}\` in a
 * macro list does not break footer logic (otherwise bookFooter is missing → small black .page-number).
 */
function stripCodeLikeSpansForMacroDetection(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "");
}

function pageContainsLiteralImpressumPageMacro(raw: string): boolean {
  const scan = stripCodeLikeSpansForMacroDetection(raw);
  IMPRESSUM_PAGE_MACRO.lastIndex = 0;
  return IMPRESSUM_PAGE_MACRO.test(scan);
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
 * `cover` → einband. Cover only: second word `hell` / `dunkel` (aliases light, dark, heller).
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

interface PageSegment {
  raw: string;
  /** This page’s content is single-column (after a preceding `\\pageSingle`). */
  singleColumn: boolean;
}

function splitPages(input: string): PageSegment[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [{ raw: "", singleColumn: false }];
  }
  const segments: PageSegment[] = [];
  PAGE_OR_SINGLE_BREAK.lastIndex = 0;
  let lastIndex = 0;
  let nextSegmentSingle = false;
  let m: RegExpExecArray | null;
  while ((m = PAGE_OR_SINGLE_BREAK.exec(normalized)) !== null) {
    segments.push({
      raw: normalized.slice(lastIndex, m.index),
      singleColumn: nextSegmentSingle
    });
    nextSegmentSingle = m[1] === "Single";
    lastIndex = PAGE_OR_SINGLE_BREAK.lastIndex;
  }
  segments.push({
    raw: normalized.slice(lastIndex),
    singleColumn: nextSegmentSingle
  });
  PAGE_OR_SINGLE_BREAK.lastIndex = 0;
  return segments;
}

function normalizePageBreakMacros(input: string): string {
  return input
    .replace(PAGE_ALIAS, "\n\\page\n")
    .replace(PAGE_SINGLE_ALIAS, "\n\\pageSingle\n");
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

function roulboxPlaceholder(sequence: number): string {
  return `DSABREWROULBOX${String(sequence).padStart(5, "0")}`;
}

function npcBlockPlaceholder(sequence: number): string {
  return `DSABREWNPCBLOCK${String(sequence).padStart(5, "0")}`;
}

function easierPlaceholder(sequence: number): string {
  return `DSABREWEASIER${String(sequence).padStart(5, "0")}`;
}

function harderPlaceholder(sequence: number): string {
  return `DSABREWHARDER${String(sequence).padStart(5, "0")}`;
}

function chessPlaceholder(sequence: number): string {
  return `DSABREWCHESS${String(sequence).padStart(5, "0")}`;
}

function abschnittPlaceholder(sequence: number): string {
  return `DSABREWABSCHNITT${String(sequence).padStart(5, "0")}`;
}

function difficultyRatingPlaceholder(sequence: number): string {
  return `DSABREWDRATE${String(sequence).padStart(5, "0")}`;
}

/** Four assets: image8–11 → piece type (DE/EN aliases, typo pown). */
function normalizeChessPieceKey(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function resolveChessPiece(raw: string): { src: string; label: string } | null {
  const key = normalizeChessPieceKey(raw);
  const map: Record<string, { src: string; label: string }> = {
    pawn: { src: chessImg8, label: "Bauer" },
    pown: { src: chessImg8, label: "Bauer" },
    bauer: { src: chessImg8, label: "Bauer" },
    rook: { src: chessImg9, label: "Turm" },
    turm: { src: chessImg9, label: "Turm" },
    tower: { src: chessImg9, label: "Turm" },
    knight: { src: chessImg10, label: "Springer" },
    springer: { src: chessImg10, label: "Springer" },
    horse: { src: chessImg10, label: "Springer" },
    bishop: { src: chessImg11, label: "Läufer" },
    laeufer: { src: chessImg11, label: "Läufer" },
    laufer: { src: chessImg11, label: "Läufer" },
    queen: { src: chessImg11, label: "Dame" },
    dame: { src: chessImg11, label: "Dame" },
    king: { src: chessImg10, label: "König" },
    koenig: { src: chessImg10, label: "König" },
    konig: { src: chessImg10, label: "König" }
  };
  return map[key] ?? null;
}

interface CollectedChessMacro {
  token: string;
  pieceRaw: string;
}

function collectChessMacros(raw: string): {
  cleaned: string;
  items: CollectedChessMacro[];
  warnings: string[];
} {
  const items: CollectedChessMacro[] = [];
  const warnings: string[] = [];
  let n = 1;
  CHESS_MACRO.lastIndex = 0;
  const cleaned = raw.replace(CHESS_MACRO, (_full, pieceRaw: string) => {
    const trimmed = pieceRaw.trim();
    const token = chessPlaceholder(n++);
    items.push({ token, pieceRaw: trimmed });
    if (trimmed && !resolveChessPiece(trimmed)) {
      warnings.push(`[WARN] chess: unbekannte Figur „${trimmed.slice(0, 80)}“`);
    }
    return token;
  });
  CHESS_MACRO.lastIndex = 0;
  return { cleaned, items, warnings };
}

function buildChessInlineHtml(pieceRaw: string): string {
  const resolved = resolveChessPiece(pieceRaw);
  if (!resolved) {
    return `<span class="dsa-chess dsa-chess--missing" title="${md.utils.escapeHtml(pieceRaw)}">?</span>`;
  }
  const srcAttr = md.utils.escapeHtml(resolved.src);
  const labelAttr = md.utils.escapeHtml(resolved.label);
  return `<span class="dsa-chess" role="img" aria-label="${labelAttr}"><img class="dsa-chess__img" src="${srcAttr}" alt="" decoding="async" loading="lazy" /></span>`;
}

/** `rot 3` / `grün 2` — mode and number may appear in any order. */
function parseDifficultyRatingInner(inner: string): { mode: "red" | "green"; points: number } | null {
  const parts = inner
    .trim()
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length < 2) {
    return null;
  }
  let mode: "red" | "green" | null = null;
  let points: number | null = null;
  for (const p of parts) {
    const pl = p.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    if (pl === "rot" || pl === "red" || pl === "r") {
      mode = "red";
    } else if (pl === "grun" || pl === "green" || pl === "g") {
      mode = "green";
    } else {
      const n = Number.parseInt(pl, 10);
      if (Number.isFinite(n)) {
        points = n;
      }
    }
  }
  if (mode === null || points === null) {
    return null;
  }
  if (points < 0 || points > 4) {
    return null;
  }
  return { mode, points };
}

interface CollectedDifficultyRatingMacro {
  token: string;
  mode: "red" | "green";
  points: number;
  /** Optional text before the diamonds (Markdown inline); empty = diamonds only. */
  label: string;
}

function collectDifficultyRatingMacros(raw: string): {
  cleaned: string;
  items: CollectedDifficultyRatingMacro[];
  warnings: string[];
} {
  const items: CollectedDifficultyRatingMacro[] = [];
  const warnings: string[] = [];
  let n = 1;
  DIFFICULTY_RATING_MACRO.lastIndex = 0;
  const cleaned = raw.replace(
    DIFFICULTY_RATING_MACRO,
    (_full, labelPart: string | undefined, rest: string) => {
      const label = (labelPart ?? "").trim();
      const parsed = parseDifficultyRatingInner(rest);
      const token = difficultyRatingPlaceholder(n++);
      if (!parsed) {
        const snippet = [label, rest].filter(Boolean).join(" | ").trim().slice(0, 96);
        warnings.push(
          `[WARN] difficulty: ungültig „${snippet}“ (z. B. \`Kampf: | grün 2\` oder \`rot 3\`)`
        );
        items.push({ token, mode: "red", points: 0, label });
        return token;
      }
      items.push({ token, mode: parsed.mode, points: parsed.points, label });
      return token;
    }
  );
  DIFFICULTY_RATING_MACRO.lastIndex = 0;
  return { cleaned, items, warnings };
}

function buildDifficultyRatingHtml(mode: "red" | "green", points: number, labelMarkdown: string): string {
  const filledSrc = mode === "red" ? difficultyRedFilledUrl : difficultyGreenFilledUrl;
  const emptySrc = difficultyEmptyUrl;
  const modeClass = mode === "red" ? "dsa-difficulty-rating--red" : "dsa-difficulty-rating--green";
  const ariaCore = `Schwierigkeit ${points} von 4`;
  const labelAttr = md.utils.escapeHtml(ariaCore);
  const slots: string[] = [];
  for (let i = 0; i < 4; i++) {
    const src = i < points ? filledSrc : emptySrc;
    const srcAttr = md.utils.escapeHtml(src);
    slots.push(`<img class="dsa-difficulty-rating__slot" src="${srcAttr}" alt="" decoding="async" loading="lazy" />`);
  }
  const rating = `<span class="dsa-difficulty-rating ${modeClass}" role="img" aria-label="${labelAttr}">${slots.join("")}</span>`;
  const lm = labelMarkdown.trim();
  if (!lm) {
    return rating;
  }
  const labelHtml = `<span class="dsa-difficulty-rating__label">${md.renderInline(lm)}</span>`;
  return `<span class="dsa-difficulty-rating-line">${labelHtml}${rating}</span>`;
}

interface CollectedDifficultyMacro {
  token: string;
  kind: "easier" | "harder";
  body: string;
}

function collectEasierHarderMacros(raw: string): { cleaned: string; items: CollectedDifficultyMacro[] } {
  const items: CollectedDifficultyMacro[] = [];
  let nEasier = 1;
  let nHarder = 1;
  EASIER_HARDER_MACRO.lastIndex = 0;
  const cleaned = raw.replace(EASIER_HARDER_MACRO, (_full, kindRaw: string, body: string) => {
    const kind = kindRaw.toLowerCase() as "easier" | "harder";
    const token =
      kind === "easier" ? easierPlaceholder(nEasier++) : harderPlaceholder(nHarder++);
    items.push({ kind, token, body });
    return token;
  });
  EASIER_HARDER_MACRO.lastIndex = 0;
  return { cleaned, items };
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

interface CollectedRoulboxMacro {
  token: string;
  title: string;
  subtitle: string;
  body: string;
}

function collectRoulboxes(raw: string): { cleaned: string; items: CollectedRoulboxMacro[] } {
  let sequence = 1;
  const items: CollectedRoulboxMacro[] = [];
  ROULBOX_MACRO.lastIndex = 0;
  const cleaned = raw.replace(ROULBOX_MACRO, (_full, title: string, subtitle: string, body: string) => {
    const token = roulboxPlaceholder(sequence);
    items.push({ token, title, subtitle, body });
    sequence += 1;
    return token;
  });
  ROULBOX_MACRO.lastIndex = 0;
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

function buildRoulboxHtml(title: string, subtitle: string, bodyMarkdown: string): string {
  const titleText = title.trim() || "Regel";
  const titleHtml = md.utils.escapeHtml(titleText);
  const subTrim = subtitle.trim();
  const subBlock = subTrim
    ? `<p class="dsa-roulbox__subtitle">${md.utils.escapeHtml(subTrim)}</p>`
    : "";
  const bodyHtml = md.render(bodyMarkdown.trim());
  return `<div class="dsa-roulbox-wrap"><aside class="dsa-roulbox" role="note"><header class="dsa-roulbox__header"><h3 class="dsa-roulbox__title">${titleHtml}</h3>${subBlock}</header><div class="dsa-roulbox__body">${bodyHtml}</div></aside></div>`;
}

function buildDifficultyCalloutHtml(kind: "easier" | "harder", bodyMarkdown: string): string {
  const iconSrc = kind === "easier" ? easierIconUrl : harderIconUrl;
  const bodyHtml = md.render(bodyMarkdown.trim());
  const cls = kind === "easier" ? "dsa-diff dsa-diff--easier" : "dsa-diff dsa-diff--harder";
  const label = kind === "easier" ? "Leichter Hinweis" : "Schwerer Hinweis";
  const labelAttr = md.utils.escapeHtml(label);
  const srcAttr = md.utils.escapeHtml(iconSrc);
  return `<div class="dsa-diff-wrap"><aside class="${cls}" role="note" aria-label="${labelAttr}"><img class="dsa-diff__icon" src="${srcAttr}" alt="" decoding="async" loading="lazy" /><div class="dsa-diff__body">${bodyHtml}</div></aside></div>`;
}

/** Replaces macro placeholders; prefers full `<p>TOKEN</p>` blocks (block-level). */
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

function injectRoulboxMacros(html: string, items: CollectedRoulboxMacro[]): string {
  let out = html;
  for (const item of items) {
    out = injectBlockToken(out, item.token, buildRoulboxHtml(item.title, item.subtitle, item.body));
  }
  return out;
}

function injectDifficultyMacros(html: string, items: CollectedDifficultyMacro[]): string {
  let out = html;
  for (const item of items) {
    out = injectBlockToken(out, item.token, buildDifficultyCalloutHtml(item.kind, item.body));
  }
  return out;
}

function injectChessMacros(html: string, items: CollectedChessMacro[]): string {
  let out = html;
  for (const item of items) {
    out = injectBlockToken(out, item.token, buildChessInlineHtml(item.pieceRaw));
  }
  return out;
}

function injectDifficultyRatingMacros(html: string, items: CollectedDifficultyRatingMacro[]): string {
  let out = html;
  for (const item of items) {
    out = injectBlockToken(out, item.token, buildDifficultyRatingHtml(item.mode, item.points, item.label));
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

/** Longest keys first so e.g. `ini` matches before `in` and `sonderfertigkeiten` parses correctly. */
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

/** One line with multiple `key=value` pairs (spaces between), e.g. `name=… portrait=…`. */
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
 * Portrait value from macro: strip quotes / angle brackets
 * (common with `portrait="https://…"` or paste from Markdown).
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
 * Portrait: http(s), absolute from `/`, or short name under `public/dsa/` (Vite).
 * `bild.png` → `/dsa/bild.png`; `dsa/sub/…` → `/dsa/sub/…`
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

  const portraitDummySrc = "/dsa/npc-portrait-dummy.svg";
  const portraitInner = portraitSrc
    ? `<img class="dsa-npc__portrait-img" src="${portraitSrc}" alt="" loading="lazy" decoding="async" />`
    : `<img class="dsa-npc__portrait-img dsa-npc__portrait-img--dummy" src="${portraitDummySrc}" alt="" role="presentation" loading="lazy" decoding="async" />`;

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

/** Entry for {{tocDepthH3}} — from Markdown of all pages (see contracts/macros.md: document-wide). */
interface TocHeadingItem {
  level: number;
  titleHtml: string;
  pageNumber: number;
  anchorId: string;
}

/**
 * Raw Markdown lines per page (after \\page), with the same skips as TOC / section index.
 */
function forEachDocumentMarkdownLine(
  pageSources: PageSegment[],
  pageNumberStart: number,
  onLine: (line: string, displayPage: number) => void
): void {
  for (let pageIndex = 0; pageIndex < pageSources.length; pageIndex++) {
    const source = pageSources[pageIndex].raw;
    const displayPage = pageNumberStart + pageIndex;
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let inFence = false;
    let inNpcBlock = false;
    let inRoulbox = false;
    let inEasierHarder = false;
    let inChess = false;
    let inDifficultyRating = false;
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
      if (/\{\{\s*roulbox\b/i.test(line)) {
        inRoulbox = true;
      }
      if (inRoulbox) {
        if (/\}\}/.test(line)) {
          inRoulbox = false;
        }
        continue;
      }
      if (/\{\{\s*(easier|harder)\s*\|/i.test(line)) {
        inEasierHarder = true;
      }
      if (inEasierHarder) {
        if (/\}\}/.test(line)) {
          inEasierHarder = false;
        }
        continue;
      }
      if (/\{\{\s*chess\s*\|/i.test(line)) {
        inChess = true;
      }
      if (inChess) {
        if (/\}\}/.test(line)) {
          inChess = false;
        }
        continue;
      }
      if (/\{\{\s*(?:difficulty|dificulty)\s*\|/i.test(line)) {
        inDifficultyRating = true;
      }
      if (inDifficultyRating) {
        if (/\}\}/.test(line)) {
          inDifficultyRating = false;
        }
        continue;
      }
      onLine(line, displayPage);
    }
  }
}

/**
 * Collects `#`–`###` lines in document order (all \\page segments).
 * Skips fenced code, {{npcBlock}}-, {{roulbox …}}-, {{easier|}}/{{harder|}} bodies to avoid false matches.
 * Slug/ID per page like the heading-anchor plugin (p{page}-{slug}).
 */
function collectDocumentHeadingsForToc(pageSources: PageSegment[], pageNumberStart: number): TocHeadingItem[] {
  const items: TocHeadingItem[] = [];
  const headingLineRe = /^\s{0,3}(#{1,3})\s+(.+?)\s*$/;
  const slugsByPage = new Map<number, Set<string>>();
  forEachDocumentMarkdownLine(pageSources, pageNumberStart, (line, displayPage) => {
    const m = headingLineRe.exec(line);
    if (!m) {
      return;
    }
    const titleRaw = m[2].trim();
    if (!titleRaw) {
      return;
    }
    let usedSlugs = slugsByPage.get(displayPage);
    if (!usedSlugs) {
      usedSlugs = new Set<string>();
      slugsByPage.set(displayPage, usedSlugs);
    }
    const base = slugifyHeadingText(titleRaw);
    let slug = base;
    if (usedSlugs.has(slug)) {
      let n = 2;
      while (usedSlugs.has(`${base}-${n}`)) {
        n += 1;
      }
      slug = `${base}-${n}`;
    }
    usedSlugs.add(slug);
    const anchorId = `p${displayPage}-${slug}`;
    items.push({
      level: m[1].length,
      titleHtml: md.renderInline(titleRaw),
      pageNumber: displayPage,
      anchorId
    });
  });
  return items;
}

/**
 * Numbered H2 (`## 14. Title`) → anchor id for {{abschnitt N | …}} (same slug rules as heading plugin).
 */
function collectNumberedH2AnchorMap(
  pageSources: PageSegment[],
  pageNumberStart: number
): { map: Map<number, string>; warnings: string[] } {
  const map = new Map<number, string>();
  const warnings: string[] = [];
  const headingLineRe = /^\s{0,3}(#{1,3})\s+(.+?)\s*$/;
  /** `## 15. Title` or `## 15 Title` (dot after number optional). */
  const sectionNumRe = /^(\d+)(?:\.\s+|\s+)/;
  const slugsByPage = new Map<number, Set<string>>();
  forEachDocumentMarkdownLine(pageSources, pageNumberStart, (line, displayPage) => {
    const m = headingLineRe.exec(line);
    if (!m || m[1].length !== 2) {
      return;
    }
    const titleRaw = m[2].trim();
    if (!titleRaw) {
      return;
    }
    const numM = sectionNumRe.exec(titleRaw);
    if (!numM) {
      return;
    }
    const sectionNum = Number.parseInt(numM[1], 10);
    if (!Number.isFinite(sectionNum)) {
      return;
    }
    let usedSlugs = slugsByPage.get(displayPage);
    if (!usedSlugs) {
      usedSlugs = new Set<string>();
      slugsByPage.set(displayPage, usedSlugs);
    }
    const base = slugifyHeadingText(titleRaw);
    let slug = base;
    if (usedSlugs.has(slug)) {
      let n = 2;
      while (usedSlugs.has(`${base}-${n}`)) {
        n += 1;
      }
      slug = `${base}-${n}`;
    }
    usedSlugs.add(slug);
    const anchorId = `p${displayPage}-${slug}`;
    if (map.has(sectionNum)) {
      warnings.push(
        `[WARN] {{abschnitt}}: Abschnittsnummer ${sectionNum} mehrfach im Dokument — es gilt der zuletzt gefundene Anker`
      );
    }
    map.set(sectionNum, anchorId);
  });
  return { map, warnings };
}

interface CollectedAbschnittRef {
  sectionNum: number;
  labelMarkdown: string;
}

function collectAbschnittMacros(raw: string): {
  cleaned: string;
  items: CollectedAbschnittRef[];
  warnings: string[];
} {
  const items: CollectedAbschnittRef[] = [];
  const warnings: string[] = [];
  let seq = 0;
  const re = new RegExp(ABSCHNITT_MACRO.source, "gi");
  const cleaned = raw.replace(re, (_full, nStr: string, label: string) => {
    const sectionNum = Number.parseInt(nStr, 10);
    if (!Number.isFinite(sectionNum) || sectionNum < 0) {
      warnings.push(`[WARN] {{abschnitt}}: ungültige Nummer „${nStr}“`);
      return label.trim();
    }
    seq += 1;
    items.push({ sectionNum, labelMarkdown: label.trim() });
    return abschnittPlaceholder(seq);
  });
  return { cleaned, items, warnings };
}

function injectAbschnittRefs(
  html: string,
  items: CollectedAbschnittRef[],
  anchorBySection: Map<number, string>
): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  let out = html;
  for (let i = 0; i < items.length; i++) {
    const token = abschnittPlaceholder(i + 1);
    const { sectionNum, labelMarkdown } = items[i];
    const id = anchorBySection.get(sectionNum);
    const labelHtml = md.renderInline(
      labelMarkdown.length > 0 ? labelMarkdown : `Abschnitt ${sectionNum}`
    );
    if (!id) {
      warnings.push(
        `[WARN] {{abschnitt ${sectionNum} | …}}: keine ##-Überschrift mit führender Nummer ${sectionNum} gefunden`
      );
      out = out.split(token).join(
        `<span class="dsa-abschnitt-ref dsa-abschnitt-ref--missing" data-abschnitt="${sectionNum}">${labelHtml}</span>`
      );
      continue;
    }
    const href = `#${md.utils.escapeHtml(id)}`;
    out = out.split(token).join(`<a class="dsa-abschnitt-ref" href="${href}">${labelHtml}</a>`);
  }
  return { html: out, warnings };
}

function buildTocNavHtml(items: TocHeadingItem[]): string {
  if (items.length === 0) {
    return `<nav class="toc toc--empty" aria-labelledby="toc-heading"><h2 class="toc-heading" id="toc-heading">Inhaltsverzeichnis</h2><p class="toc-empty">Keine Überschriften gefunden.</p></nav>`;
  }
  const lis = items
    .map((item) => {
      const href = `#${md.utils.escapeHtml(item.anchorId)}`;
      const num = String(item.pageNumber);
      return `<li class="toc-item toc-l${item.level}"><a class="toc-line" href="${href}"><span class="toc-title">${item.titleHtml}</span><span class="toc-leader" aria-hidden="true"></span><span class="toc-num">${num}</span></a></li>`;
    })
    .join("");
  return `<nav class="toc" aria-labelledby="toc-heading"><h2 class="toc-heading" id="toc-heading">Inhaltsverzeichnis</h2><ol class="toc-list">${lis}</ol></nav>`;
}

/** Replaces literal `{{tocDepthH3}}` in rendered HTML (e.g. inside <p>…</p>). */
function injectTocMacro(html: string, tocItems: TocHeadingItem[]): string {
  const tocHtml = buildTocNavHtml(tocItems);
  return html.split("{{tocDepthH3}}").join(tocHtml);
}

/** TOC uses `md.renderInline`; the footer strip needs plain text like the Scriptorium reference. */
function htmlToPlainFooterTitle(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0*39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export function renderDocument(markdown: string, options?: RenderDocumentOptions): RenderResult {
  const normalizedBreaks = normalizePageBreakMacros(markdown);
  const pageNumberData = parsePageNumberStart(normalizedBreaks);
  const pages = splitPages(pageNumberData.cleaned);

  const globalImp = collectGlobalImpressumOverrides(pageNumberData.cleaned);
  const runningTitleMerged = mergeImpressum({ ...options?.impressum, ...globalImp });
  const runningTitle = runningTitleMerged.projectTitle.trim() || DEFAULT_IMPRESSUM_DATA.projectTitle;

  const documentTocItems = collectDocumentHeadingsForToc(pages, pageNumberData.start);
  const abschnittAnchorBySection = collectNumberedH2AnchorMap(pages, pageNumberData.start);
  let abschnittIndexWarningsEmitted = false;
  const firstH1TocItem = documentTocItems.find((item) => item.level === 1);
  const plainFirstH1 = firstH1TocItem ? htmlToPlainFooterTitle(firstH1TocItem.titleHtml) : "";
  const runningFooterTitle = plainFirstH1.length > 0 ? plainFirstH1 : runningTitle;

  const renderedPages: RenderedPage[] = pages.map((segment, index) => {
    const rawPage = segment.raw;
    const displayPageNumber = pageNumberData.start + index;
    anchorPageDisplayNumber = displayPageNumber;

    const bgData = parseBackgrounds(rawPage);
    const imFields = collectImpressumFields(bgData.cleaned);
    const hasImpressumMacro = pageContainsLiteralImpressumPageMacro(imFields.cleaned);
    IMPRESSUM_PAGE_MACRO.lastIndex = 0;
    const withoutImpressumMacro = hasImpressumMacro
      ? imFields.cleaned.replace(IMPRESSUM_PAGE_MACRO, "\n")
      : imFields.cleaned;
    const footnoteData = collectFootnotes(withoutImpressumMacro);
    const readAloudData = collectReadAloudNotes(footnoteData.cleaned);
    const gmData = collectGmNotes(readAloudData.cleaned);
    const roulboxData = collectRoulboxes(gmData.cleaned);
    const easierHarderData = collectEasierHarderMacros(roulboxData.cleaned);
    /* NPC before chess/difficulty: prevents later macros from corrupting the block body with “{{ … }}”. */
    const npcData = !hasImpressumMacro
      ? collectNpcBlocks(easierHarderData.cleaned)
      : { cleaned: easierHarderData.cleaned, items: [] as CollectedNpcMacro[], warnings: [] as string[] };
    const chessData = collectChessMacros(npcData.cleaned);
    const difficultyRatingData = collectDifficultyRatingMacros(chessData.cleaned);
    const abschnittMacroData = collectAbschnittMacros(difficultyRatingData.cleaned);

    /* Document macros override programmatic options */
    const impressumDataMerged = mergeImpressum({
      ...options?.impressum,
      ...imFields.partial
    });

    let html: string;
    let abschnittRefWarnings: string[] = [];
    if (hasImpressumMacro) {
      html = renderImpressumHtml(impressumDataMerged, (s) => md.utils.escapeHtml(s));
    } else {
      html = md.render(abschnittMacroData.cleaned);
      html = injectNoteMacros(html, [...readAloudData.items, ...gmData.items]);
      html = injectRoulboxMacros(html, roulboxData.items);
      html = injectDifficultyMacros(html, easierHarderData.items);
      html = injectChessMacros(html, chessData.items);
      html = injectDifficultyRatingMacros(html, difficultyRatingData.items);
      html = injectNpcBlocks(html, npcData.items);
      html = injectFootnoteRefs(html, footnoteData.footnotes);
      html = injectTocMacro(html, documentTocItems);
      const abschnittInjected = injectAbschnittRefs(
        html,
        abschnittMacroData.items,
        abschnittAnchorBySection.map
      );
      html = abschnittInjected.html;
      abschnittRefWarnings = abschnittInjected.warnings;
    }

    const footnoteHtml =
      footnoteData.footnotes.length > 0
        ? `<footer class="footnotes">${footnoteData.footnotes
            .map((entry) => `<p>[${entry.label}] ${entry.content}</p>`)
            .join("")}</footer>`
        : "";

    const allWarnings = [
      ...bgData.warnings,
      ...imFields.fieldWarnings,
      ...chessData.warnings,
      ...difficultyRatingData.warnings,
      ...npcData.warnings,
      ...abschnittMacroData.warnings,
      ...abschnittRefWarnings
    ];
    if (!hasImpressumMacro && !abschnittIndexWarningsEmitted) {
      allWarnings.push(...abschnittAnchorBySection.warnings);
      abschnittIndexWarningsEmitted = true;
    }

    const warningHtml =
      allWarnings.length > 0
        ? `<aside class="warnings">${allWarnings
            .map((warning) => `<p>${md.utils.escapeHtml(warning)}</p>`)
            .join("")}</aside>`
        : "";

    /* Scriptorium / FR-013a: After the cover, content textures (image12 ↔ image17) alternate
     * against the naive “page N even ↔ even-asset” mapping. Odd page number → content-even
     * (image12), even → content-odd (image17), so impressum (usually page 2) and following
     * content pages match the Word template. */
    const effectiveMapKey =
      bgData.mapKey ?? (displayPageNumber % 2 === 0 ? "content-odd" : "content-even");

    /* Scriptorium footer strip after impressum; \map{final} (back cover) without page number in the strip. */
    const showBookFooter = index > 0 && effectiveMapKey !== "final";

    const bookFooter: BookFooterStrip | undefined = showBookFooter
      ? {
          title: runningFooterTitle,
          pageNumber: displayPageNumber
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
      singleColumn: segment.singleColumn,
      bookFooter
    };
  });

  return { pages: renderedPages };
}
