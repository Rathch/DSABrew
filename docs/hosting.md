# DSABrew: Öffentliche Dokumente (API + Deployment)

Dieses Dokument ergänzt `specs/001-dsa-brew-renderer/contracts/public-documents.md` mit konkreter Betriebsanleitung für die **Node/TypeScript-Referenz-API** unter `server/`.

## Architektur

- **Frontend**: Vite-App in `web/` — **`/`** und **`/new`** sind gleichwertig: per `POST /api/documents` neues Dokument anlegen und per Redirect zur **Bearbeiten-URL** (`/d/{edit-slug}`) weiterleiten; **`/d/:token`** Editor+Vorschau. Der `token` ist der **View-** oder **Edit-Slug** (nicht erratbar). Es gibt **keine** eigene Startseite — ein direkter Aufruf der Basis-URL legt also sofort ein neues Dokument an (sofern die API erreichbar ist).
- **Backend**: Fastify + SQLite (`better-sqlite3`) in `server/`.
- **Kanonischer Standard-Markdown** für TTL-Vergleiche wird aus `web/src/default-markdown-demo.ts` beim Serverstart geladen (Referenzinhalt für neue Dokumente).

## Lokale Entwicklung

**Node.js:** Das Projekt ist auf **Node 24+** ausgelegt (`engines` in den `package.json`, **`.nvmrc`** / **`.node-version`**). Vor `npm install` im Root, `web/` oder `server/` die passende Version aktivieren, z. B. mit **nvm**: im Repository-Root `nvm install` und `nvm use` (liest `.nvmrc`). Mit einer älteren Node-Version schlagen u. a. native Module (**`better-sqlite3`**) fehl oder lassen sich nicht zuverlässig bauen. Im Root liegt **`engine-strict=true`** in **`.npmrc`** — `npm install` bricht bei falscher Node-Version mit einer klaren Meldung ab.

**Alles in einem Terminal (Repo-Root):** nach `npm install` im Root sowie in `web/` und `server/` genügt **`npm start`** (Alias **`npm run dev`**) — **`scripts/dev-both.mjs`** startet zuerst die **API**, wartet auf **`GET /api/health`** (verhindert `ECONNREFUSED` im Vite-Proxy), danach **Vite**. **Strg+C** beendet beide Prozesse. Abweichender API-Port: in **`.env`** oder **`PORT`** in der Shell (wie der Server).

Alternativ zwei getrennte Terminals:

```bash
# Terminal 1 — API (Port 3001)
cd server
npm install
npm run dev

```

**Hinweis `npm run dev` / `npm run start` (nur im Ordner `server/`):** Beide Befehle **beenden sich nicht von selbst** — die Shell wirkt „hängend“, bis du **Strg+C** drückst. Das ist beabsichtigt: der API-Prozess läuft im Vordergrund. Nach dem Start (bei `dev` nutzt **`tsx watch`**; die **erste Ladung** kann kurz dauern) erscheinen u. a. **`[dsabrew] Start mit Node …`**, Meldungen auf **stderr** (`Kanonischer Markdown geladen`, `SQLite-Pfad`, `SQLite geöffnet`) und **`dsabrew API listening on 0.0.0.0:3001`**. Ob die API antwortet, prüfst du in einem **zweiten** Terminal z. B. mit `curl -sS http://127.0.0.1:3001/api/health` (JSON mit `"ok":true`). `npm run start` im Ordner **`server/`** ist dasselbe ohne Datei-Watch (produktionsnaher Lauf).

**Strg+C** beendet den Prozess mit sauberem **Schließen von Fastify und SQLite** (Signal-Handler sind **sofort** beim Start registriert, nicht erst nach `listen`). Bei Dateiänderungen startet **`tsx watch`** den Prozess neu (nach **SIGTERM** muss der Server schnell beenden — dafür die Shutdown-Handler).

```bash
# Terminal 2 — Web (Vite, typisch 5173)
cd web
npm install
npm run dev
```

Vite leitet Anfragen an **`/api`** per Proxy an `http://127.0.0.1:3001` weiter — die Web-App kann relative URLs (`/api/...`) verwenden.

### Hänger bei „SQLite-Datei öffnen“ / kein `lsof`-Treffer

Wenn die Logs bei **`[dsabrew:db …] SQLite-Datei öffnen`** stehen bleiben und **`lsof`** auf die `.db` **leer** ist: der Prozess kann **innerhalb** von SQLite/`better-sqlite3` hängen, **bevor** die Datei wie erwartet als offener Deskriptor erscheint — das ist **kein** Beweis, dass alles in Ordnung ist.

**Schritte (lokal):**

1. **Test mit frischer DB:** In **`.env`** im Repo-Root **`DSABREW_USE_TEMP_SQLITE=1`** setzen (siehe **`.env.example`**), API neu starten. Wenn der Server dann hochkommt, liegt das Problem sehr wahrscheinlich an der **bisherigen Datei** `server/data/dsabrew.db` (oder den Hilfsdateien **`dsabrew.db-wal`** / **`dsabrew.db-shm`**). Temp-DB wieder auskommentieren, wenn du wieder die echte Datei nutzen willst.
2. **Hilfsdateien:** API beenden, **`dsabrew.db`** sichern (`mv` / Kopie), optional **`dsabrew.db-wal`** und **`dsabrew.db-shm`** löschen (nur wenn du die WAL-Daten nicht brauchst), erneut starten.
3. **Native Modul:** Im Ordner **`server/`**: **`npm rebuild better-sqlite3`**.

Die Web-Oberfläche stylt den **App-Chrome** mit **reinem CSS** in `web/src/style.css` (Hell/Dunkel über **`html.dark`**, kein Tailwind). Theme-Persistenz: **`localStorage`**-Key **`dsabrew-theme`** (siehe `specs/002-modern-ui-darkmode/contracts/ui-shell.md`).

Optional: `VITE_PUBLIC_API_BASE=https://api.example.com` setzen, wenn Frontend und API auf **verschiedenen Origins** liegen; dann entfällt der Proxy und CORS muss auf der API passen (`@fastify/cors` ist aktiv).

## Umgebungsvariablen (Server)

Geheimnisse gehören **nicht** ins Git — Vorlage **`.env.example`** im Repo-Root; lokal **`cp .env.example .env`** und Werte setzen. Beim Start lädt die API die Datei **`.env` im Repo-Root** automatisch: **`npm run start` / `npm run dev`** rufen Node mit **`--import ./src/load-dotenv.mjs`** auf (vor `tsx` und allen Modulen). Alternativ Variablen in der Shell / unter systemd setzen (dort kein Preload nötig, wenn die Variablen ohnehin gesetzt sind).

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3001` | Listen-Port |
| `SQLITE_PATH` | `server/data/dsabrew.db` (relativ zum Repo) | Pfad zur SQLite-Datei |
| `DSABREW_USE_TEMP_SQLITE` | — | `1` = Entwicklung: SQLite unter `/tmp/dsabrew-dev-{pid}.sqlite` (bei Hänger/Defekt der Projekt-DB testen) |
| `PUBLIC_ORIGIN` | — | z. B. `https://app.example.com` — wenn gesetzt, liefert `POST /api/documents` vollständige `viewUrl` / `editUrl` |
| `TRUST_PROXY` | — | `1` setzen, wenn die API hinter einem Reverse Proxy läuft und `X-Forwarded-For` für Rate Limits / Logs vertrauenswürdig ist |
| `RATE_POST_CREATE_PER_HOUR` | `10` | Rate Limit: neue Dokumente pro IP und Stunde |
| `RATE_PUT_PER_HOUR` | `120` | Zusätzlich: Schreibvorgänge pro IP und Stunde (In-Memory-Fenster) |
| `RATE_PUT_BURST_PER_MIN` | `60` | Burst: Autosaves pro Minute pro **IP+Edit-Token** (`@fastify/rate-limit`) |
| `DEFAULT_DOC_TTL_HOURS` | `24` | Aufbewahrung unveränderter Standard-Dokumente vor Löschung (**FR-023b**); siehe Abschnitt TTL unten |
| `OPS_ALERT_EMAIL` | — | Empfänger für Betriebsmails (SQLite-Größe, Wochenreport); bei mehreren kommagetrennt (**FR-031**–**FR-033**) |
| `OPS_WEEKLY_REPORT_EMAIL` | — | Optional: nur Wochenreport; wenn leer → `OPS_ALERT_EMAIL` (**FR-032**) |
| `OPS_STATUS_USER` | `ops` | Benutzername für **HTTP Basic Auth** auf der Betriebsstatusseite (nur wenn `OPS_STATUS_PASSWORD` gesetzt) |
| `OPS_STATUS_PASSWORD` | — | Wenn gesetzt: **`GET /api/ops/status`** liefert SQLite-/Missbrauchs-/Report-Kennzahlen (JSON oder HTML); **TLS am Proxy empfohlen** |
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

## Betriebsstatus (ohne SMTP)

- Ist **`OPS_STATUS_PASSWORD`** gesetzt, registriert die API **`GET /api/ops/status`** (nur mit **HTTP Basic Auth**, Benutzername **`OPS_STATUS_USER`** (Standard **`ops`**) und diesem Passwort).
- **Frontend**: dieselbe URL unter **`/ops`** (Vite-App) — Formular für Benutzername/Passwort, Abruf per `fetch` gegen **`/api/ops/status`**. Dafür muss die gebaute Web-App unter derselben Origin wie die API erreichbar sein (oder `VITE_PUBLIC_API_BASE` auf die API zeigen und CORS beachten).
- Antwort: **JSON** (Standard) oder **HTML** mit `?format=html` bzw. **`Accept: text/html`** — u. a. SQLite-Pfad und -größe (**MiB**), Schwellwert (**MiB**), Dokumentanzahl (gesamt / neu in der Vorwoche), Missbrauchssperre.
- **SQLite-Warnung**: Wenn **keine** Mail gesendet werden kann (kein SMTP) aber die Statusseite aktiv ist, wird der **Latch** trotzdem gesetzt (kein stündliches Log-Spam), analog zur erfolgreichen Warnmail.
- **Sicherheit**: Nur über **HTTPS** aufrufen (TLS am Reverse Proxy); Basic Auth ohne TLS ist unsicher.

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

## GitHub Actions / VPS-Deploy

Der Workflow **„Deploy (VPS)“** (`.github/workflows/deploy.yml`) führt auf dem Zielhost per SSH u. a. **`sudo -n systemctl restart …`** aus. **`sudo -n`** bedeutet **ohne Passwortabfrage**; schlägt die Authentifizierung fehl, erscheint **`sudo: a password is required`** und der Job bricht ab.

**Node 24 auf dem VPS:** Das Projekt verlangt **`engines.node >= 24`** (Root-`package.json`, **`engine-strict`** in **`.npmrc`**). **`npm ci`** im Deploy schlägt mit **`EBADENGINE`** fehl, wenn dort noch **Node 22** (oder älter) aus dem System-Pfad verwendet wird.

- **`nvm use` in einer normalen SSH-Session** gilt nur für **diese** Shell und lädt beim **Deploy-Job** oft **gar nicht**, weil SSH-Commands eine **nicht-interaktive** Shell ohne dein `~/.bashrc`-Setup nutzen.
- Auf dem Server einmal **`nvm install`** im Repo-Root (liest **`.nvmrc`**) und optional **`nvm alias default 24`** ausführen.
- Der Workflow **sourced** **`$HOME/.nvm/nvm.sh`** und ruft **`nvm install`** im **`DEPLOY_PATH`** auf, **bevor** `npm ci` läuft — damit gilt **Node 24** auch für den GitHub-Deploy. Dasselbe macht **`scripts/deploy-vps.sh`**.

Wenn **nvm** auf dem Server fehlt: [nvm installieren](https://github.com/nvm-sh/nvm#installing-and-updating), danach als Deploy-User **`nvm install 24`** im geklonten Repo. Alternativ Node 24 als System-Runtime (z. B. NodeSource/`nodesource`-Repo) — dann muss **`which node`** für den Deploy-User **v24** zeigen.

**Erforderlich auf dem Server:** Für den SSH-Benutzer (GitHub-Secret **`DEPLOY_USER`**) muss **passwortloses sudo nur für die nötigen `systemctl`-Aufrufe** erlaubt sein — nicht für beliebige Befehle. Unit-Name per GitHub-Variable **`DEPLOY_SYSTEMD_UNIT`** (Standard **`dsabrew-api`**).

Beispiel (als root, Pfad und Benutzer anpassen):

```text
# /etc/sudoers.d/dsabrew-deploy
Defaults!/usr/bin/systemctl !requiretty
deployuser ALL=(root) NOPASSWD: /usr/bin/systemctl restart dsabrew-api, /usr/bin/systemctl status dsabrew-api
```

Prüfen: Als derselbe User per SSH **`sudo -n systemctl status dsabrew-api`** — darf **kein** Passwort verlangen. Wenn `systemctl` woanders liegt: **`which systemctl`** auf dem VPS verwenden und die Pfade in der sudoers-Zeile exakt so setzen.

Siehe auch **`scripts/deploy-vps.sh`** (manuelles Deploy mit denselben Voraussetzungen).

## Sicherheit

- Edit-Tokens nicht in Logs ausgeben; **keine** Client-**IPs** in Logdateien (**FR-030**); Fehlermeldungen generisch halten.
- Rate Limits an Abuse anpassen (`research.md`); Missbrauchssperre siehe oben.
