import type { Database } from "better-sqlite3";
import { timingSafeEqual } from "node:crypto";
import { statSync } from "node:fs";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getMaintenanceSnapshot } from "./abuse-maintenance.js";
import { countAllDocuments } from "./db.js";
import { previousIsoWeekDocumentCount } from "./ops.js";

function safeEqualUtf8(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function verifyOpsStatusBasicAuth(
  req: FastifyRequest,
  reply: FastifyReply
): boolean {
  const password = process.env.OPS_STATUS_PASSWORD?.trim();
  if (!password) {
    void reply.code(503).send({ error: "ops_status_disabled" });
    return false;
  }
  const expectedUser = process.env.OPS_STATUS_USER?.trim() || "ops";
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Basic ")) {
    void reply
      .code(401)
      .header("WWW-Authenticate", 'Basic realm="DSABrew Ops"')
      .send({ error: "unauthorized" });
    return false;
  }
  let decoded: string;
  try {
    decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  } catch {
    void reply
      .code(401)
      .header("WWW-Authenticate", 'Basic realm="DSABrew Ops"')
      .send({ error: "unauthorized" });
    return false;
  }
  const colon = decoded.indexOf(":");
  const user = colon >= 0 ? decoded.slice(0, colon) : "";
  const pass = colon >= 0 ? decoded.slice(colon + 1) : decoded;
  if (!safeEqualUtf8(user, expectedUser) || !safeEqualUtf8(pass, password)) {
    void reply
      .code(401)
      .header("WWW-Authenticate", 'Basic realm="DSABrew Ops"')
      .send({ error: "unauthorized" });
    return false;
  }
  return true;
}

function bytesToMib(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

export type OpsStatusPayload = {
  generatedAt: string;
  sqlite: {
    path: string;
    /** Dateigröße in MiB (1024²) */
    sizeMib: number;
    /** Warnschwelle aus SQLITE_SIZE_ALERT_BYTES, in MiB */
    thresholdMib: number;
  };
  documents: {
    /** Alle Zeilen in `documents` */
    total: number;
    /** Neu angelegt in der vorherigen ISO-Kalenderwoche */
    newInPreviousIsoWeek: number;
  };
  abuse: {
    maintenance: boolean;
    createsInWindow: number;
    windowMs: number;
    maxCreates: number;
  };
};

export function buildOpsStatusPayload(db: Database, sqlitePath: string): OpsStatusPayload {
  const thresholdBytes = Number(process.env.SQLITE_SIZE_ALERT_BYTES ?? 2_147_483_648);
  const st = statSync(sqlitePath);
  const size = st.size;
  const prev = previousIsoWeekDocumentCount(db);
  const abuse = getMaintenanceSnapshot();
  return {
    generatedAt: new Date().toISOString(),
    sqlite: {
      path: sqlitePath,
      sizeMib: bytesToMib(size),
      thresholdMib: bytesToMib(thresholdBytes)
    },
    documents: {
      total: countAllDocuments(db),
      newInPreviousIsoWeek: prev.count
    },
    abuse: {
      maintenance: abuse.maintenance,
      createsInWindow: abuse.createsInWindow,
      windowMs: abuse.windowMs,
      maxCreates: abuse.maxCreates
    }
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderOpsStatusHtml(p: OpsStatusPayload): string {
  const rows: [string, string][] = [
    ["Zeitpunkt (UTC)", escapeHtml(p.generatedAt)],
    ["SQLite-Pfad", escapeHtml(p.sqlite.path)],
    ["SQLite-Datei (MiB)", String(p.sqlite.sizeMib)],
    ["Schwellwert (MiB)", String(p.sqlite.thresholdMib)],
    ["Neue Dokumente (Vorwoche)", String(p.documents.newInPreviousIsoWeek)],
    ["Dokumente gesamt", String(p.documents.total)],
    ["Wartungsmodus (Missbrauch)", p.abuse.maintenance ? "ja" : "nein"],
    ["Neuanlagen im Fenster", String(p.abuse.createsInWindow)],
    ["Fenster / Max (Missbrauch)", `${p.abuse.windowMs} ms / ${p.abuse.maxCreates}`]
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><th scope="row" style="text-align:left;padding:0.35rem 1rem 0.35rem 0;border-bottom:1px solid #ccc">${k}</th><td style="padding:0.35rem 0;border-bottom:1px solid #ccc">${v}</td></tr>`
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>DSABrew — Betrieb</title>
<style>
body{font-family:system-ui,sans-serif;max-width:52rem;margin:1.5rem auto;padding:0 1rem;line-height:1.45}
h1{font-size:1.25rem}
table{border-collapse:collapse;width:100%}
</style>
</head>
<body>
<h1>DSABrew — Betriebsstatus</h1>
<p>Passwortgeschützt; keine Secrets in dieser Ansicht.</p>
<table>${body}</table>
</body>
</html>`;
}
