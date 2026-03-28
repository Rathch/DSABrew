# Öffentliche Dokumente (Multimandant light, ohne Login)

**Status**: Anforderung / geplant  
**Datum**: 2026-03-28  
**Bezug**: Erweiterung zu `spec.md` (FR-020ff.), Umsetzung siehe `plan.md` Abschnitt „Öffentliche Dokumente“.

## Zielbild

Die Anwendung soll **öffentlich** betrieben werden können. **Webseitenbesucher** können **ohne Login** Dokumente anlegen und bearbeiten. Jedes Dokument ist über eine **eindeutige, nicht erratbare URL** erreichbar; der Inhalt hinter dieser URL ist **persistent** (gleiche URL → gleicher gespeicherter Stand).

**Mandant / Tenant:** Es gibt **keine** organisatorischen Mandanten im Sinne von Accounts. **Ein Dokument = ein „Tenant“** identifiziert durch den **öffentlichen Schlüssel** (Slug) in der URL.

## Funktionale Anforderungen

### URLs und Persistenz

- Jede Ressource wird durch einen **kryptografisch zufälligen** Slug identifiziert (z. B. 16–22 Zeichen, z. B. Base62 / `nanoid`-Stil), **nicht** sequentiell erratbar.
- **`GET /d/{slug}`** (oder vereinbarter Pfad) lädt den gespeicherten Markdown-Inhalt und rendert die bestehende DSABrew-Vorschau.
- Inhalt ist **serverseitig persistent**; nachladen der gleichen URL zeigt den zuletzt gespeicherten Stand.

### Autosave (kein manueller Speichern-Button als Pfad)

- **Kein** verpflichtender „Speichern“-Button und **keine** Nutzerpflicht für manuelle Requests: Änderungen im Editor werden **automatisch** gespeichert.
- **Umsetzung**: Debounce (z. B. 300–800 ms nach letzter Eingabe) plus **Flush** bei Verlassen der Seite (`beforeunload` / `sendBeacon` / `fetch` mit `keepalive`), damit der letzte Stand nicht verloren geht.
- Optional: Indikator „Gespeichert“ / „Speichert…“ nur als **Feedback**, nicht als Pflichtaktion.

### Zwei Links pro Dokument (Lesen vs. Bearbeiten)

- Pro Dokument existieren **zwei** unterschiedliche, nicht erratbare Token/Slugs:
  - **View (nur Lesen)**: URL lädt das Dokument **ohne** Editor oder mit **read-only** Editor; kein `PUT`/`PATCH` oder API lehnt Schreibzugriff ab.
  - **Edit**: URL lädt dieselbe Vorschau mit **bearbeitbarem** Markdown und löst Autosave aus.
- Speicherung: z. B. zwei Spalten `slug_view`, `slug_edit` in derselben Zeile **oder** ein gemeinsamer Dokument-ID-Key mit zwei gehashten Tokens (Implementierungsdetail).

### Neues Dokument

- Besucher kann **„+ Neues Dokument“** auslösen → öffnet einen **neuen Browser-Tab** mit Route **`/new`** (oder gleichwertig): dort wird `POST /api/documents` ausgeführt, der Server erzeugt Slugs (view + edit) und legt **Inhalt = kanonisches Standarddokument** an (mit `web/src/default-markdown-demo.ts` abgeglichen).
- Anschließend **Redirect** im neuen Tab zu **`/d/{edit-slug}`** (Bearbeiten).

### Teilen (Ansicht vs. Bearbeiten)

- Die Oberfläche bietet **„Teilen: Nur Ansicht“** (kopiert die **View-URL**) und — nur im **Bearbeiten**-Kontext — **„Teilen: Bearbeiten“** (kopiert die **Edit-URL**).
- **`GET /api/documents/:token`** liefert immer `slugView` zur Bildung der View-URL; **`slugEdit`** nur, wenn der Anfragende den **Edit-Slug** verwendet hat — so wird der Bearbeiten-Link nicht an Nutzer mit nur View-Token geleakt.

### Routen (Web-Client)

- **`/`** — Startseite (ohne Editor-Demo; nur Einstieg, z. B. „+ Neues Dokument“).
- **`/new`** — Erzeugung eines Dokuments und Weiterleitung zur Bearbeiten-URL (typisch in neuem Tab geöffnet).
- **`/d/{token}`** — Editor + Vorschau; `token` ist View- oder Edit-Slug.

### Aufräumen: Standard nach 24 h

- Dokumente, deren Inhalt **inhaltlich identisch** zum **kanonischen Standarddokument** bleibt (Hash-Vergleich nach Normalisierung) und **seit Erstellung / seit letzter Bestätigung** keine Abweichung hatte, werden **nach 24 Stunden** gelöscht.
- Sobald der Inhalt **von der Standardvorlage abweicht**, darf das Dokument **nicht** mehr durch diese Regel gelöscht werden (Flag `content_changed` oder Hash-Vergleich).

### Rate Limiting

- Schreib- und Erzeugungs-Endpunkte (`POST` neues Dokument, `PUT`/`PATCH` Autosave) sind **rate-limitiert** (z. B. nach Client-IP + optional nach `slug`), um Missbrauch zu begrenzen.
- Konkrete Zahlen (Requests/Minute) sind in der Implementierung festzulegen und hier nachzutragen.

### Speicher-Backend (kein Login)

- **SQLite** als einfache Datenbank **oder** **Markdown pro Dokument als Datei** in einem konfigurierbaren Verzeichnis (Dateiname = interne ID oder Hash des Slugs, nicht der Klartext-Slug).
- Implementierungssprache Backend: **TypeScript (Node)** **oder** **PHP** — je nach Hosting; die gleiche API-Oberfläche soll beschrieben werden (`contracts`-Ergänzung bei Festlegung).

### Alternativen zum klassischen Cron-Job (TTL / Löschen)

- **Cron** auf dem Server (z. B. `cron` + CLI-Skript) — zulässig, Referenzimplementierung.
- **Lazy Deletion**: Bei `GET`/`HEAD` eines Dokuments prüfen, ob Löschkriterium erfüllt ist → dann löschen oder markieren (reduziert separate Jobs, kann Last verlagern).
- **Geplante Aufgaben im Prozess**: `node-cron` / `Bull` / `pg-boss` im gleichen Prozess wie die API (nur sinnvoll bei stabil lang laufendem Prozess).
- **Managed Scheduler**: Vercel Cron, GitHub Actions (scheduled), Cloudflare Workers **scheduled** — wenn Hosting passt.
- **Anforderung**: Mindestens **ein** definiertes Verfahren muss die 24h-Regel zuverlässig umsetzen; Wahl dokumentieren.

## Nicht-Ziele (MVP)

- Keine Benutzerkonten, keine E-Mail-Verifikation (optional später).
- Keine Kollaboration in Echtzeit (kein WebSocket-Zwang), optional später.

## Sicherheit (Kurz)

- HTTPS; **Rate limits**; Slugs nicht erratbar; **Edit-Token** geheim halten (nicht in Logs); **View-URL** darf geteilt werden.

## Referenz: API-Skizze (nicht normativ)

| Methode | Pfad | Zweck |
|--------|------|--------|
| `POST` | `/api/documents` | Neues Dokument (Standardinhalt), liefert `slugView`, `slugEdit` und optional `viewUrl` / `editUrl` (wenn `PUBLIC_ORIGIN` gesetzt) |
| `GET` | `/api/documents/:token` | Markdown laden; Antwort enthält `markdown`, `mode`, `slugView`; **`slugEdit` nur bei `mode === "edit"`** (Anfrage mit Edit-Slug) |
| `PUT` | `/api/documents/:token` | Autosave nur wenn `token` der **Edit-Slug** ist; sonst `403` |

(Detaillierte OpenAPI kann in einer späteren Iteration ergänzt werden. Betrieb: `docs/hosting.md`.)
