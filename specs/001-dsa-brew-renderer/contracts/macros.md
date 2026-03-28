# Contracts: DSABrew Renderer Macros (MVP)

**Date**: 2026-03-26 (updated 2026-03-27)  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`

This document defines the macro surface that extends plain Markdown.

## Macro: `\page`

**Type**: Structural

- Starts a new A4 page.
- Consecutive `\page` blocks create consecutive pages, including empty pages.
- Empty or whitespace-only documents still produce exactly one page.

## Macro: `{{page}}`

**Type**: Structural (alias)

- **Semantically equivalent** to `\page`: inserts a page break using the same splitting rules.
- Whitespace may surround the token; implementation normalizes it to the same internal page split as `\page`.

## Macro: `\pageSingle`

**Type**: Structural

- Like `\page`, starts a **new** A4 page, but the **following** page’s body uses **one column** (`column-count: 1`) instead of the default two-column layout.
- The **preceding** page’s column layout is unchanged.

## Macro: `{{pageSingle}}`

**Type**: Structural (alias)

- **Semantically equivalent** to `\pageSingle` (same split + single-column flag for the next page).

## Macro: `{{impressumField key=value}}`

**Type**: Impressum data override

- Sets a single field on the Impressum template for the **current page**. **Key** must match a field in `ImpressumData` (see `web/src/impressum-config.ts`) **or** one of the aliases below (matching is **case-insensitive**). Examples: `projectTitle`, `authorValue`, `disclaimerBody`, `footerWordTemplateUrl`.
- **Value** is the text after the first `=` until `}}` (no `}` inside the value).
- Multiple `{{impressumField …}}` lines may appear on the same page; they merge over `DEFAULT_IMPRESSUM_DATA`. **Document macros override** programmatic `renderDocument(..., { impressum: { … } })` for the same keys.
- Recommended: set fields above `{{impressumPage}}` on that page.

**Deutsche Kurz-Keys (häufige Felder)**

| Kurz-Key | Bedeutung |
|----------|-----------|
| `version` | Versions-Teil (z. B. „Version 1.4“) |
| `datum` | Datums-Teil |
| `auflage` | Auflagen-Teil |
| `autor` | Autor |
| `kontakt` | Kontakt |
| `illustration` / `illustrationen` / `illustrations` | Illustrationen |
| `lektorat` | Lektorat / Korrekturen |
| `disclaimer` | gesamter Disclaimer-**Haupttext** (ein Absatz unter „Disclaimer“) |
| `disclaimerabsatz1` / `disclaimerabsatz2` / `disclaimer1` / `disclaimer2` | synonym zu `disclaimer` (setzen dasselbe Feld) |

**Version / Datum / Auflage**

- Kanonische Keys: `versionNumber`, `versionDate`, `versionEdition`. Die Anzeigezeile unter der Versions-Überschrift wird aus den **nicht leeren** Teilen mit ` / ` zusammengesetzt; sind alle drei leer, wird `versionValue` (eine Zeile) verwendet.
- Aliase: `version` → `versionNumber`, `datum` → `versionDate`, `auflage` → `versionEdition`, `versionzeile` → `versionValue`.

**Autor, Kontakt, Illustrationen, Lektorat**

- Kanonisch: `authorValue`, `contactValue`, `illustrationsValue`, `lektoratValue`.
- Aliase: `autor`, `kontakt`, `illustration` / `illustrationen` / `illustrations`, `lektorat`.

**Disclaimer**

- Kanonisch: `disclaimerBody` — ein Fließtext-Absatz (vor der Copyright-Zeile). Die Copyright-Zeile danach steuern `copyrightLinePrefix`, `copyrightYear`, `copyrightHolder` (Aliase `copyrightprefix`, `copyrightjahr`, `copyrightname`).
- Aliase: `disclaimer`, `disclaimereinleitung`, `disclaimerabsatz1`, `disclaimerabsatz2`, `disclaimer1`, `disclaimer2` → alles `disclaimerBody` (bei mehreren Zeilen im Dokument überschreibt die letzte).

**Copyright-Zeile (dritter Disclaimer-Absatz)**

- Kanonisch: `copyrightLinePrefix`, `copyrightYear`, `copyrightHolder`.
- Aliase: `copyrightprefix`, `copyrightjahr`, `copyrightname`.

Vollständige Alias-Tabelle: `web/src/impressum-field-aliases.ts`.

## Macro: `{{impressumPage}}`

**Type**: Generated page content

- Expands to the full **Impressum** block (headings, fields, Disclaimer, footer credits).
- **Defaults**: `web/src/impressum-config.ts` (`DEFAULT_IMPRESSUM_DATA`); overrides via `{{impressumField …}}` on the same page.
- **Page background**: same rules as other content pages — **no** separate `\map{impressum}`; use automatic **even/odd** content backgrounds or an explicit `\map{content-even}` / `\map{content-odd}` if needed.
- Other Markdown on the same page is ignored when this macro is present (Impressum-only page).

## Headings

Headings are expressed using plain Markdown headings:

- `# Title` (H1)
- `## Title` (H2)
- `### Title` (H3)
- `#### Title` (H4)

**Font sizes and families** (Scriptorium Word alignment): see `specs/001-dsa-brew-renderer/contracts/typography.md`.

## Macro: `\map{KEY}`

**Type**: Background asset selector

- Selects a **map** (full-page) background for the **current** page.
- **Supported keys (MVP)** — each resolves to packaged assets under `web/public/dsa/` (copied from `media/` in the repo):
  - `einband` — Einband / cover; **Standard (dunkel)**: `image13.png` als **oberer** Banner, `image14.png` als **unterer** Rahmen auf dunklem Grund (`#0d1520`); Fließtext und Inhaltsverknüpfungen **hell** gehalten.
  - `einband hell` (Aliase zweites Wort: `heller`, `light`) — gleiche Leisten **image13** / **image14**, Mittelfläche mit **Pergament** (`note-read-aloud-parchment.png`); Schrift **dunkel** wie auf Inhaltsseiten.
  - `einband dunkel` (Aliase: `dark`) — explizit wie `einband` ohne zweites Wort.
  - `cover` — **Alias** für `einband` (nur erstes Wort); ebenfalls `cover hell` / `cover dunkel` möglich.
  - `content-even` — even content page; `image12.jpeg`.
  - `content-odd` — odd content page; `image17.jpeg`.
  - `final` — final / back page; `image32.png`.
- **Automatic content backgrounds**: If a page contains **no** `\map{...}` macro, the implementation alternates the two content textures (Scriptorium / FR-013a): **odd** displayed page numbers use **`content-even`** (`image12.jpeg`), **even** displayed page numbers use **`content-odd`** (`image17.jpeg`). This keeps the Impressum page (typically page 2) and the following content pages aligned with the reference template. `{{pageNumber N}}` sets the displayed page number; explicit `\map{...}` on that page overrides this default.
- Unknown keys omit the background and produce a visible warning/placeholder marker.
- Malformed invocations are ignored and produce a visible warning/placeholder marker.

## Macro: `\rauten{KEY}`

**Type**: Background asset selector

- Selects a rauten background asset for the current page.
- Unknown keys omit the background and produce a visible warning/placeholder marker.
- Malformed invocations are ignored and produce a visible warning/placeholder marker.

## Macro: `{{pageNumber N}}`

**Type**: Page metadata / display

- Defines the starting page number `N` for the first rendered page in the document.
- Displayed page number for page index \(i\) (1-based) is: \(N + (i - 1)\).

## Macro: `{{footnote LABEL | CONTENT}}`

**Type**: Per-page footnote

- Inserts a footnote reference with visible label `LABEL`.
- Adds a footnote entry to the footnote list at the bottom of the same page.
- `CONTENT` is the footnote body text.
- Optional spaces around `|` are allowed (e.g. `{{footnote PART 2 | BORING STUFF}}`).
- **Rendering contract**: The reference MUST appear as a superscript-style marker in the output HTML; the Markdown renderer MUST NOT treat raw `<sup>` injected before Markdown rendering as trusted HTML (implementation uses a placeholder + post-pass where needed).

## Macro: `{{tocDepthH3}}`

**Type**: Generated content

- Inserts a table of contents at the macro location.
- The TOC is generated from document headings up to depth H3.
- Heading sources include Markdown headings.

## Macro: `{{readAloudNote TITEL | INHALT}}` (Alias: `{{vorlesenNote …}}`)

**Type**: Styled block (Vorlesen / Pergament)

- Rendert einen hellen Pergament-Kasten mit **zerrissenen Kanten** (Clip-Pfad), Schlagschatten, **fettem** Titel und **kursivem** Fließtext — angelehnt an Scriptorium-„Zum Vorlesen“-Boxen.
- **TITEL** steht links vom ersten `|`; **INHALT** ist Markdown (Absätze, Fettung, Listen, Links, …). Leerer Titel → Standard **„Zum Vorlesen oder Nacherzählen:“**.
- **Fußnoten** im INHALT: `{{footnote …}}` wird im Renderer **vor** dem Auslesen dieser Makros ersetzt (Platzhalter ohne `}}`), funktioniert damit im INHALT. **Nicht** im INHALT verwenden: wörtliches `}}`, das das Makro vorzeitig beendet (selten).

## Macro: `{{gmNote TITEL | INHALT}}` (Alias: `{{meisterNote …}}`)

**Type**: Styled block (Meisterinformation, dunkel)

- Rendert einen **dunklen** Kastel (weißer/heller Text) mit denselben zerrissenen Kanten — für SL-only Infos.
- Leerer TITEL → Standard **„Meisterinformation:“**.
- Dasselbe Parsing wie bei `readAloudNote` (Markdown im INHALT; `}}`-Hinweis wie oben).

## Macro: `{{roulbox TITEL | UNTERTITEL | INHALT}}`

**Type**: Styled block (Regel / Optional-Regel, DSA-ähnlicher Kasten)

- **Drei durch `|` getrennte Felder:** **TITEL** (groß, weiß im dunklen Kopfbalken), **UNTERTITEL** (kleiner, kursiv, weiß; optional leer: `TITEL | | INHALT`), **INHALT** = Markdown (Absätze, **Fett** als Zwischenüberschrift, Listen).
- Leerer TITEL → Standard **„Regel“**.
- **Aufzählungslisten** (`-` / `*`) im INHALT verwenden ein **stilisiertes Augen-Symbol** (grün / Lid-Farben) statt Standard-Bullets; nummerierte Listen bleiben normal.
- Derselbe `}}`-Hinweis wie bei `readAloudNote` (wörtliches `}}` im INHALT beendet das Makro vorzeitig).

## Macro: `{{npcBlock` … `{{/npcBlock}}`

**Type**: Styled block (NSC / Monster-Werte)

- **Ein- oder mehrzeilig:** Felder `schlüssel=wert` (Leerzeichen um `=` optional). Zeilen mit `#` am Anfang sind Kommentare.
- **Abschluss:** **`{{/npcBlock}}`** (optional Leerzeichen davor/innerhalb des Schließ-Tags).
- **Eine Zeile** mit mehreren Feldern ist erlaubt (z. B. `name=Monster / Person portrait=/dsa/n.png groesse=…`); der Parser erkennt bekannte Schlüssel am Wortanfang.
- **Mehrzeilig** weiterhin eine Zeile pro Feld möglich.
- **NSC-Vorlage**: **`media/npc-block-template.png`** (Porträt-Bereich mit Alpha; Loch in der Grafik) → von `web/scripts/copy-parchment-assets.mjs` nach **`web/public/dsa/npc-block-template.png`**. CSS-Prozente `--npc-p-*` müssen zum Porträt-Kreis in der Vorlage passen.
- **Portrait** (`portrait` / `bild` / `image`): **`https://…`** / **`http://…`**, **absoluter Pfad** ab **`/`** (z. B. `/dsa/nsc.png` unter `web/public/dsa/`), oder **nur Dateiname** wie `bild.png` → wird als **`/dsa/bild.png`** aufgelöst (Datei in `web/public/dsa/`). Entsprechend **`dsa/unterordner/x.png`** → **`/dsa/unterordner/x.png`**. Optional in Anführungszeichen oder **`<https://…>`**. Keine `javascript:`-/ `data:`-URLs; `..` wird abgewiesen. Ungültige Werte → Warnung und Platzhalter statt Bild.
- **Name** (`name` / `titel` / `title`), **Größe** (`groesse` / `size`), **Gewicht** (`gewicht` / `weight`).
- **Eigenschaften** (2–4 Buchstaben / Kurz): `mu`, `kl`, `in`, `ch`, `ff`, `ge`, `ko`, `kk`, `lep`, `ini`, `aw`, `rs`, `sk`, `zk`, `gs` — leere Werte werden als „—“ gerendert.
- **Optionale 4. Zelle** in der dritten Wertezeile (unter AW): `row3e=…` (freier Text ohne festes Label), falls die Vorlage dort etwas anzeigen soll.
- **Kampf:** `angriff1`, `angriff2`, `aktionen` (Aliase `attack1`, `attack2`, `actions`).
- **Text:** `sonderfertigkeiten`, `talente`.
- **Nicht** auf derselben Seite wie `{{impressumPage}}` verwenden (Impressum-Seite rendert keinen Fließtext-Makros).

## Anker-Links (Sprungmarken im Dokument)

**Type**: Standard-Markdown (kein eigenes Makro)

- Verlinkung mit **Fragment**: `[Anzeigetext](#ziel-id)` (gleiche Vorschau/Druck-HTML-Seite: alle Seiten stehen nacheinander im Preview).
- Überschriften erhalten automatisch **`id`-Attribute** (internes markdown-it-Plugin in `web/src/markdown-heading-anchor.ts`): Schema **`p{Seitennummer}-{slug}`**, wobei **`{Seitennummer}`** die **angezeigte** Seitenzahl ist (wie bei `{{pageNumber N}}`, Start `N`, dann +1 pro `\page`).
  - Beispiel: Auf der Seite mit Nummer **3** lautet eine Überschrift `## Orks im Nebel` typischerweise `id="p3-orks-im-nebel"` (Slug aus Text, ASCII, Bindestriche).
  - Link dorthin (von irgendeiner Stelle im Markdown): `[zu den Orks](#p3-orks-im-nebel)`.
- **Wichtig:** Raw-HTML (`<a id="…">`) wird aus Sicherheitsgründen nicht gerendert (`html: false`); Anker nur über Überschriften-IDs + Markdown-Links nutzen.
- Gleiche Überschrift mehrfach auf einer Seite: der Renderer vergibt bei Bedarf eindeutige IDs (z. B. Suffix `-1`, `-2`).

## Layout (preview + print)

- **Body text**: two columns (`column-count: 2`) for the main flow inside each page body (default).
- **Single-column page** (`\pageSingle` / `{{pageSingle}}`): the **following** page uses `column-count: 1` on `.page-body` (class `a4-page--single-column` on the page root). Tables, read-aloud / GM / roulbox / diff blocks use the **full** content width of that page. **NPC blocks** on such pages are **not** stretched to full width: `.dsa-npc-wrap` has a `max-width` roughly matching one column of the two-column layout.
- **Markdown tables** (`table.dsa-md-table`): on two-column pages, **one column** wide (no `column-span`); on a single-column page, `width: 100%` is the full page body width.
- **Full-width blocks**: warnings, TOC (`nav.toc`), headings H1–H3, the read-aloud / GM note wrappers (`.dsa-note-wrap`), NPC blocks (`.dsa-npc-wrap`), and the per-page footnote block SHOULD use full width (column-span), not split across columns.

## Safety Contract (non-negotiable)

- Raw HTML from Markdown input is stripped/removed and must not be rendered as HTML.
- Script execution must be impossible from user-provided input.
