# DSABrew: Öffentliche Dokumente (API + Deployment)

Dieses Dokument ergänzt `specs/001-dsa-brew-renderer/contracts/public-documents.md` mit konkreter Betriebsanleitung für die **Node/TypeScript-Referenz-API** unter `server/`.

## Architektur

- **Frontend**: Vite-App in `web/` — **`/`** Startseite, **`/new`** legt per `POST` ein Dokument an und leitet zur Bearbeiten-URL weiter, **`/d/:token`** Editor+Vorschau. Der `token` ist der **View-** oder **Edit-Slug** (nicht erratbar).
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

Optional: `VITE_PUBLIC_API_BASE=https://api.example.com` setzen, wenn Frontend und API auf **verschiedenen Origins** liegen; dann entfällt der Proxy und CORS muss auf der API passen (`@fastify/cors` ist aktiv).

## Umgebungsvariablen (Server)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3001` | Listen-Port |
| `SQLITE_PATH` | `server/data/dsabrew.db` (relativ zum Repo) | Pfad zur SQLite-Datei |
| `PUBLIC_ORIGIN` | — | z. B. `https://app.example.com` — wenn gesetzt, liefert `POST /api/documents` vollständige `viewUrl` / `editUrl` |
| `TRUST_PROXY` | — | `1` setzen, wenn die API hinter einem Reverse Proxy läuft und `X-Forwarded-For` für Rate Limits / Logs vertrauenswürdig ist |
| `RATE_POST_CREATE_PER_HOUR` | `10` | Rate Limit: neue Dokumente pro IP und Stunde |
| `RATE_PUT_PER_HOUR` | `120` | Zusätzlich: Schreibvorgänge pro IP und Stunde (In-Memory-Fenster) |
| `RATE_PUT_BURST_PER_MIN` | `60` | Burst: Autosaves pro Minute pro **IP+Edit-Token** (`@fastify/rate-limit`) |

## HTTPS

In Produktion liegt die TLS-Terminierung typischerweise am **Reverse Proxy** (nginx, Caddy, Traefik). Die API selbst spricht nur HTTP auf localhost — nicht exponieren ohne Proxy.

## TTL / Löschen (FR-023, FR-027)

- **Lazy deletion**: Beim `GET /api/documents/:token` wird geprüft: Dokument nie abgewandelt (`ever_diverged`), Inhalt noch kanonischer Standard (SHA-256 nach Normalisierung), älter als 24 h → Zeile wird gelöscht, Antwort **404**.
- Sobald der Nutzer von der Vorlage abweicht, bleibt `ever_diverged = 1` — kein automatisches Löschen mehr.
- Optional: zusätzlich zeitgesteuerte SQL-Bereinigung (systemd timer, Plattform-Cron) — nicht zwingend, wenn Traffic für Lazy-Reinigung reicht.

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

- Edit-Tokens nicht in Logs ausgeben; Fehlermeldungen generisch halten.
- Rate Limits an Abuse anpassen (`research.md`).
