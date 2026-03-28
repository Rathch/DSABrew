# DSABrew

DSABrew ist ein Web-Tool, das Markdown in ein mehrseitiges A4-Layout rendert und den Export als **herunterladbare PDF-Datei** aus der Vorschau ermoeglicht (eine PDF-Seite pro Vorschau-Seite). Oeffentlicher Betrieb nutzt die **API** unter `server/` (Dokumente unter `/d/:token`). Die **Basis-URL** **`/`** legt wie **`/new`** sofort ein neues Dokument an und leitet zur Bearbeiten-URL weiter; **„+ Neues Dokument“** oeffnet **`/new`** in einem **neuen Tab**. Optional: Drucken ueber den Browser (`Strg+P`) mit Print-CSS.

## Funktionen

- Markdown-Editor mit Live-Preview (Vorschau scrollt bei langem Dokument; Textfeld scrollt nur bei viel Eingabetext)
- Mehrseitiges A4-Layout mit `\page` oder `{{page}}` als Seitenumbruch
- Ziel-Layout: **Fliesstext zweispaltig** (Ueberschriften, TOC, Warnungen, Fussnoten ueber volle Breite)
- Typografie nach Scriptorium-Vorlage: **Andalus** (Kapitel/Einband) und **Gentium Book Plus** (Fliesstext/Abschnitte) — siehe `specs/001-dsa-brew-renderer/contracts/typography.md`
- Sicherheitsfokus fuer untrusted Input:
  - Raw-HTML wird nicht als HTML gerendert
  - `javascript:`-Links werden blockiert
- Makros:
  - `\map{KEY}` und `\rauten{KEY}` fuer Layout-/Hintergrundsteuerung (Inhaltsseiten ohne `\map`: automatisch gerade/ungerade Hintergrund je nach Seitennummer)
  - `{{pageNumber N}}` fuer Start-Seitennummer
  - `{{footnote LABEL | CONTENT}}` fuer Fussnoten pro Seite
  - `{{tocDepthH3}}` fuer ein automatisch erzeugtes Inhaltsverzeichnis
- Standarddokument mit 5 Seiten beim Start:
  - Einband
  - Impressum (Daten in `web/src/impressum-config.ts`)
  - Inhaltsseite gerade / ungerade
  - Rueckseite

## Projektstruktur

- `web/` - Web-App (Vite + TypeScript)
- `web/src/` - Renderer, UI und Styles
- `web/tests/` - Sicherheits- und Funktionstests
- `web/public/dsa/` - lokale DSA-Assets fuer Hintergruende
- `server/` - optionale **REST-API** (Fastify + SQLite) fuer oeffentlich gehostete Dokumente (`/api/documents`, UI unter `/d/:token`); siehe `docs/hosting.md`
- `specs/` - Spezifikation, Plan, Vertraege (`contracts/`), Checklisten, Tasks

### Impressum anpassen

- **Im Dokument (empfohlen):** `{{impressumField key=value}}` für einzelne Felder, danach `{{impressumPage}}` — siehe `contracts/macros.md`.
- **Projekt-Defaults:** `web/src/impressum-config.ts` (`DEFAULT_IMPRESSUM_DATA`).
- **Hintergrund:** wie bei normalen Inhaltsseiten (automatisch gerade/ungerade); kein eigener Impressum-Hintergrund.

## Lokale Entwicklung starten

Voraussetzungen:

- Node.js **18 oder neuer** (siehe `web/package.json` → `engines`)
- npm

**Web + API** (empfohlen): Zwei Terminals — (1) `cd server && npm install && npm run dev` (Port 3001), (2) `cd web && npm install && npm run dev` (Vite, typisch 5173). Im Browser `http://localhost:5173/` — sofortige Anlage eines Dokuments und Weiterleitung zur Bearbeiten-URL; **„+ Neues Dokument“** oeffnet `/new` in einem **neuen Tab**. Details: `docs/hosting.md`, `specs/.../quickstart.md`.

Nur **Web** ohne API: `cd web`, `npm install`, `npm run dev` — ohne laufende API schlaegt die Anlage unter **`/`** fehl (Fehlermeldung mit **Erneut versuchen**); vollstaendige Nutzung erfordert den API-Prozess.

`npm install` unter `web` startet `postinstall` (Assets u. a. `image16.png` aus `media/image16.tiff` mit **sharp**).

Optional: Banner manuell neu erzeugen mit `npm run prepare-assets` im Ordner `web/`.

### Hinweis: Vite-Version und Node.js

Das Projekt nutzt **Vite 5**, damit der Dev-Server auch unter **Node 18** laeuft. Wenn du frueher **Vite 7** installiert hattest, kann es zu Fehlern wie `crypto.hash is not a function` kommen (Vite 7 verlangt **Node 20.19+ oder 22.12+**).

Nach einem Wechsel der Vite-Major-Version am besten neu installieren:

- `rm -rf node_modules package-lock.json`
- `npm install`

**Alternative:** Node.js auf **20.19+** (oder **22.12+**) aktualisieren und dann ggf. neuere Tooling-Versionen verwenden.

## Tests ausfuehren

Im Verzeichnis `web/`:

- `npm run test`

## Build fuer Produktion

Im Verzeichnis `web/`:

- `npm run build`
- `npm run preview`
