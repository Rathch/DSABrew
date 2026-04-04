# DSABrew: Öffentliche Dokumente (API + Deployment)

Dieses Dokument ergänzt `specs/001-dsa-brew-renderer/contracts/public-documents.md` mit konkreter Betriebsanleitung für die **Node/TypeScript-Referenz-API** unter `server/`.

## Architektur

- **Frontend**: Vite-App in `web/` — **`/`** und **`/new`** sind gleichwertig: per `POST /api/documents` neues Dokument anlegen und per Redirect zur **Bearbeiten-URL** (`/d/{edit-slug}`) weiterleiten; **`/d/:token`** Editor+Vorschau. Der `token` ist der **View-** oder **Edit-Slug** (nicht erratbar). Es gibt **keine** eigene Startseite — ein direkter Aufruf der Basis-URL legt also sofort ein neues Dokument an (sofern die API erreichbar ist).
- **Backend**: Fastify + SQLite (`better-sqlite3`) in `server/`.
- **Kanonischer Standard-Markdown** für TTL-Vergleiche wird aus `web/src/default-markdown-demo.ts` beim Serverstart geladen (Referenzinhalt für neue Dokumente).

## Lokale Entwicklung

Zwei Prozesse:

```bash
# Terminal 1 — API (Port 3001)
cd server
npm install
npm run dev

# Terminal 2 — Web (Vite, typisch 5173)
cd web
npm install
npm run dev
```

Vite leitet Anfragen an **`/api`** per Proxy an `http://127.0.0.1:3001` weiter — die Web-App kann relative URLs (`/api/...`) verwenden.

Die Web-Oberfläche stylt den **App-Chrome** mit **reinem CSS** in `web/src/style.css` (Hell/Dunkel über **`html.dark`**, kein Tailwind). Theme-Persistenz: **`localStorage`**-Key **`dsabrew-theme`** (siehe `specs/002-modern-ui-darkmode/contracts/ui-shell.md`).

Optional: `VITE_PUBLIC_API_BASE=https://api.example.com` setzen, wenn Frontend und API auf **verschiedenen Origins** liegen; dann entfällt der Proxy und CORS muss auf der API passen (`@fastify/cors` ist aktiv).

## Umgebungsvariablen (Server)

Geheimnisse gehören **nicht** ins Git — nur die Vorlage **`.env.example`** im Repository anpassen; lokal **`cp .env.example .env`** und Werte setzen.

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3001` | Listen-Port |
| `SQLITE_PATH` | `server/data/dsabrew.db` (relativ zum Repo) | Pfad zur SQLite-Datei |
| `PUBLIC_ORIGIN` | — | z. B. `https://app.example.com` — wenn gesetzt, liefert `POST /api/documents` vollständige `viewUrl` / `editUrl` |
| `TRUST_PROXY` | — | `1` setzen, wenn die API hinter einem Reverse Proxy läuft und `X-Forwarded-For` für Rate Limits / Logs vertrauenswürdig ist |
| `RATE_POST_CREATE_PER_HOUR` | `10` | Rate Limit: neue Dokumente pro IP und Stunde |
| `RATE_PUT_PER_HOUR` | `120` | Zusätzlich: Schreibvorgänge pro IP und Stunde (In-Memory-Fenster) |
| `RATE_PUT_BURST_PER_MIN` | `60` | Burst: Autosaves pro Minute pro **IP+Edit-Token** (`@fastify/rate-limit`) |
| `DEFAULT_DOC_TTL_HOURS` | `24` | Aufbewahrung unveränderter Standard-Dokumente vor Löschung (**FR-023b**); siehe Abschnitt TTL unten |
| `OPS_ALERT_EMAIL` | — | Empfänger für Betriebsmails (SQLite-Größe, Wochenreport); bei mehreren kommagetrennt (**FR-031**–**FR-033**) |
| `OPS_WEEKLY_REPORT_EMAIL` | — | Optional: nur Wochenreport; wenn leer → `OPS_ALERT_EMAIL` (**FR-032**) |
| `SQLITE_SIZE_ALERT_BYTES` | `2147483648` (**2 GiB**) | Ab dieser Dateigröße der SQLite-Datei wird **einmalig** eine Warnmail ausgelöst, sobald die Schwelle **von unten nach oben** überschritten wird (**FR-031**) |
| `SQLITE_SIZE_CHECK_MS` | `3600000` | Intervall für Größenprüfung (Standard **1 h**) |
| `OPS_TIMEZONE` | `Europe/Berlin` | Zeitzone für den wöchentlichen Report (**FR-032**) |
| `WEEKLY_REPORT_WEEKDAY` / `WEEKLY_REPORT_HOUR` | `1` / `8` | **Montag**, **08:00** (lokale Uhrzeit laut `OPS_TIMEZONE`) — Wochenreport (**FR-032**) |
| `ABUSE_DOC_CREATE_MAX` | `500` | Globale Schwellzahl **neuer** Dokumente (`POST /api/documents`) im gleitenden Fenster (**FR-035**) |
| `ABUSE_DOC_CREATE_WINDOW_MS` | `600000` | Fenster **10 Minuten** (600 000 ms); bei Überschreiten → Wartungsmodus für **Neuanlage** (**FR-035**) |
| `ABUSE_MAINTENANCE_COOLDOWN_MS` | `900000` | Mindestabstand **15 Minuten** ohne erneute Auslösung, bevor automatisch entsperrt wird, wenn die Erstellungsrate im Fenster wieder unter die Hälfte der Schwelle fällt (siehe unten) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | — | SMTP für Betriebsmails (**FR-031**–**FR-033**); nur in Env/Secrets |
| `SMTP_SECURE` | — | `1` = TLS (Port oft 465); sonst STARTTLS (typisch Port **587**) |
| `LOG_DIR` | `server/logs` (relativ zum Repo) | Verzeichnis für rotierende Logdateien (**FR-030**) |
| `LOG_MAX_SIZE`, `LOG_MAX_FILES` | z. B. `10M`, `14` | Rotation: max. Dateigröße bzw. Anzahl alter Dateien (`rotating-file-stream`) (**FR-030**) |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / … (**FR-030**) |
| `LOG_TO_STDOUT` | (gesetzt) | `0` = nur Datei-Logs, kein Duplikat auf stdout |

**FR-035 (Missbrauchssperre):** Steht `ABUSE_DOC_CREATE_MAX` leer oder ist der Wert ungültig/`0`, verwendet der Server den Default **500** (`server/src/abuse-env.ts`). Ein leeres Feld wurde früher als **0** gelesen und löste nach dem ersten erfolgreichen `POST` den Wartungsmodus aus.

Hinweis: **Log-Ausgabe** darf **keine** Edit-/View-**Tokens** und **keine Client-IP-Adressen** enthalten (**FR-030**).

## HTTPS

In Produktion liegt die TLS-Terminierung typischerweise am **Reverse Proxy** (Apache, nginx, Caddy, Traefik). Die API selbst spricht nur HTTP auf localhost — nicht exponieren ohne Proxy.

Referenz-Apache-VirtualHosts (statisches `web/dist`, `/api` → `127.0.0.1:3001`) liegen im Repo unter **`sites-enabled/brew.rath-ulrich.de.conf`** und **`brew.rath-ulrich.de-le-ssl.conf`** — auf dem Server nach **`/etc/apache2/sites-available/`** kopieren, `a2ensite`, `DocumentRoot`/Zertifikatspfade prüfen, **`a2enmod ssl proxy proxy_http headers rewrite`**, dann `systemctl reload apache2`. Wenn parallel **nginx** auf demselben Host lauscht, nur **einen** Dienst auf Port **443** verwenden (sonst falsche VirtualHost-Auswahl).

## TTL / Löschen (FR-023, FR-023b, FR-027)

- Die Frist **„älter als X“** entspricht **`DEFAULT_DOC_TTL_HOURS`** (Standard **24** Stunden).
- **Lazy deletion**: Beim `GET /api/documents/:token` wird geprüft: Dokument nie abgewandelt (`ever_diverged`), Inhalt noch kanonischer Standard (SHA-256 nach Normalisierung), älter als die konfigurierte Frist → Zeile wird gelöscht, Antwort **404**.
- Sobald der Nutzer von der Vorlage abweicht, bleibt `ever_diverged = 1` — kein automatisches Löschen mehr.
- Optional: zusätzlich zeitgesteuerte SQL-Bereinigung (systemd timer, Plattform-Cron) — nicht zwingend, wenn Traffic für Lazy-Reinigung reicht.

## Lizenz

Der Projektroot enthält **`LICENSE`**: Kurz **Copyright (C) 2026 Christian Rath-Ulrich**, darunter der **vollständige GPL-3.0-Text**.

## Betriebs-E-Mail (SMTP)

- Versand erfolgt per **SMTP** (Zugangsdaten nur über Umgebungsvariablen).
- **SQLite-Größe**: E-Mail **einmal**, wenn die Datei **zum ersten Mal** über **`SQLITE_SIZE_ALERT_BYTES`** (Standard **2 GiB**) steigt; fällt sie später wieder darunter, kann beim nächsten Überschreiten erneut eine Mail gesendet werden (kein täglicher Reminder). Zustand dazu liegt in **`ops-mail-state.json`** neben der SQLite-Datei (gitignored).
- **Wöchentlicher Report**: Standard **Montag 08:00** (`OPS_TIMEZONE`, Standard **Europe/Berlin**), Inhalt: Anzahl **neu angelegter** Dokumente in der **vorherigen ISO-Kalenderwoche** (Montag–Sonntag). Doppelversand pro Woche wird über dieselbe **`ops-mail-state.json`** verhindert.

## Fehlerlogging (Dateien, Redaktion)

- Logs mit **Rotation** unter **`LOG_DIR`**; optional zusätzlich **stdout** (abschalten: **`LOG_TO_STDOUT=0`**).
- **Nicht** loggen: URL-/API-**Tokens**, **Client-IP-Adressen** (stattdessen anonymisierte Request-IDs o. Ä., falls nötig).

## Missbrauchssperre (Wartungsmodus)

**Voreinstellung (konservativ):** Gleitendes Fenster **10 Minuten**, Schwellwert **500** neue Dokumente **global** — das sind **~50/Minute** über alle IPs; legitimer Betrieb mit bestehendem **Rate-Limit pro IP** bleibt typischerweise darunter. Die Sperre adressiert **verteilte** oder automatisierte Massenanlage; die Sorge vor „1000 Dokumente in Sekunden“ ist bei **10/h pro IP** schon durch Rate-Limits begrenzt — die globale Sperre ist eine **zweite Linie**.

**Verhalten bei Auslösung:**

- **`POST /api/documents`** sowie **`/`** und **`/new`** (Neues Dokument anlegen) → **503** bzw. **Maintenance-Seite** im Frontend.
- **`GET` / `PUT`** mit gültigem View-/Edit-Token → **unverändert** (bestehende Nutzer werden nicht ausgesperrt).

**Entsperrung:** Automatisch, wenn im gleitenden Fenster die Zahl der Neuanlagen wieder unter **die Hälfte** von `ABUSE_DOC_CREATE_MAX` fällt und mindestens **`ABUSE_MAINTENANCE_COOLDOWN_MS`** (15 Min.) vergangen sind — optional kann ein Operator die Env-Werte anpassen oder den Prozess neu starten (Implementierungsdetail).

## Apache (Referenz im Repo)

Siehe **`sites-enabled/brew.rath-ulrich.de.conf`** (HTTP→HTTPS) und **`sites-enabled/brew.rath-ulrich.de-le-ssl.conf`** (`DocumentRoot` → gebautes **`web/dist`**, `ProxyPass` für **`/api/`**). Env auf dem Server: **`TRUST_PROXY=1`**, **`PUBLIC_ORIGIN=https://brew.rath-ulrich.de`** (Domain anpassen).

## Nginx (Skizze)

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3001/api/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
  root /var/www/dsabrew-web/dist;
  try_files $uri $uri/ /index.html;
}
```

## Sicherheit

- Edit-Tokens nicht in Logs ausgeben; **keine** Client-**IPs** in Logdateien (**FR-030**); Fehlermeldungen generisch halten.
- Rate Limits an Abuse anpassen (`research.md`); Missbrauchssperre siehe oben.
