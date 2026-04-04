import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";
import { createStream } from "rotating-file-stream";

/**
 * URL-Log: keine Dokumenten-Tokens (FR-030).
 * IPs werden nicht über req.url geloggt; req-Serializer unten enthält keine IP.
 */
export function redactRequestUrl(url: string | undefined): string {
  if (!url) {
    return "";
  }
  return url.replace(/(\/api\/documents\/)([^/?#]+)/g, "$1:redacted");
}

export type ServerLogger = pino.Logger;

/** rotating-file-stream erwartet B/K/M/G groß; `.env`-Typo `10m` würde sonst „Unknown unit: m“ werfen. */
function normalizeRotatingSize(raw: string): string {
  const t = raw.trim();
  const m = /^(\d+)\s*([bkmg])$/i.exec(t);
  if (m) {
    return `${m[1]}${m[2]!.toUpperCase()}`;
  }
  return t;
}

export function createServerLogger(logDir: string): ServerLogger {
  mkdirSync(logDir, { recursive: true });
  const maxSize = normalizeRotatingSize(process.env.LOG_MAX_SIZE ?? "10M");
  const maxFiles = Number(process.env.LOG_MAX_FILES ?? 14);
  const level = (process.env.LOG_LEVEL ?? "info") as pino.LevelWithSilent;

  const fileStream = createStream("dsabrew.log", {
    path: logDir,
    size: maxSize,
    maxFiles: Number.isFinite(maxFiles) ? maxFiles : 14
  });

  const streams = [
    { level, stream: fileStream },
    ...(process.env.LOG_TO_STDOUT !== "0"
      ? ([{ level, stream: process.stdout }] as const)
      : [])
  ];

  const multi = pino.multistream(streams);

  return pino(
    {
      level,
      serializers: {
        req(req: { method?: string; url?: string; id?: string }) {
          return {
            method: req.method,
            url: redactRequestUrl(req.url),
            id: req.id
          };
        },
        res(res: { statusCode?: number }) {
          return { statusCode: res.statusCode };
        }
      }
    },
    multi
  );
}

/** `LOG_DIR` relativ zum Repo-Root oder absolut. */
export function resolveLogDir(repoRoot: string): string {
  const raw = process.env.LOG_DIR ?? join("server", "logs");
  if (raw.startsWith("/") || /^[A-Za-z]:[\\/]/.test(raw)) {
    return raw;
  }
  return join(repoRoot, raw);
}
