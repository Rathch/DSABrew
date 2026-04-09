import { repoRoot } from "./env-bootstrap.js";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance, type preHandlerHookHandler } from "fastify";
import { nanoid } from "nanoid";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  evaluateUnlock,
  isMaintenanceMode,
  recordDocumentCreation,
  getMaintenanceSnapshot
} from "./abuse-maintenance.js";
import {
  deleteDocument,
  findByAnySlug,
  insertDocument,
  openDb,
  updateMarkdown
} from "./db.js";
import { createServerLogger, resolveLogDir } from "./logger-config.js";
import { isOpsStatusPageEnabled } from "./mail.js";
import { normalizeMarkdown, sha256Hex } from "./normalize.js";
import {
  buildOpsStatusPayload,
  renderOpsStatusHtml,
  verifyOpsStatusBasicAuth
} from "./ops-status.js";
import { scheduleWeeklyReport, startSqliteSizeWatch } from "./ops.js";
import { getSharedDefaultMarkdown } from "./shared-default-markdown.js";

/** `@fastify/rate-limit` decorates the instance with `rateLimit()` (not in core Fastify types). */
type FastifyWithRateLimit = FastifyInstance & {
  rateLimit: (opts: {
    max: number;
    timeWindow: string;
    keyGenerator: (req: import("fastify").FastifyRequest) => string;
  }) => preHandlerHookHandler;
};

function isAbsolutePath(p: string): boolean {
  return p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
}

/**
 * Relativ zum Repo-Root wie in `docs/hosting.md` (nicht relativ zu `cwd`).
 * `DSABREW_USE_TEMP_SQLITE=1`: frische Datei unter /tmp pro Prozess — um Hänger durch defekte/gesperrte `server/data/dsabrew.db` zu umgehen.
 */
function resolveSqlitePath(): string {
  if (process.env.DSABREW_USE_TEMP_SQLITE?.trim() === "1") {
    return join(tmpdir(), `dsabrew-dev-${process.pid}.sqlite`);
  }
  const raw = process.env.SQLITE_PATH?.trim();
  if (raw === undefined || raw === "") {
    return join(repoRoot, "server", "data", "dsabrew.db");
  }
  if (isAbsolutePath(raw)) {
    return raw;
  }
  return join(repoRoot, raw);
}

/** Leeres `PORT=` in der Shell ist nicht nullish → `Number("") === 0` (Zufallsport). Explizit normalisieren. */
const PORT = ((): number => {
  const raw = process.env.PORT;
  if (raw === undefined || raw.trim() === "") {
    return 3001;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Ungültiger PORT (1–65535): ${JSON.stringify(raw)}`);
  }
  return n;
})();
const SQLITE_PATH = resolveSqlitePath();
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN ?? "").replace(/\/$/, "");

const TTL_HOURS = Number(process.env.DEFAULT_DOC_TTL_HOURS ?? 24);
const TTL_MS = (Number.isFinite(TTL_HOURS) && TTL_HOURS > 0 ? TTL_HOURS : 24) * 60 * 60 * 1000;

/** Sliding window (~1 h) per IP for PUT — complements @fastify/rate-limit burst per IP+token. */
const putHourlyHits = new Map<string, number[]>();

function allowHourlyPut(ip: string, maxPerHour: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const prev = (putHourlyHits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= maxPerHour) {
    return false;
  }
  prev.push(now);
  putHourlyHits.set(ip, prev);
  return true;
}

let canonicalMarkdown = "";
let canonicalHash = "";

function loadCanonical(): void {
  canonicalMarkdown = getSharedDefaultMarkdown();
  canonicalHash = sha256Hex(normalizeMarkdown(canonicalMarkdown));
}

function isStillDefaultBody(markdown: string): boolean {
  return sha256Hex(normalizeMarkdown(markdown)) === canonicalHash;
}

function publicUrl(path: string): string | undefined {
  if (!PUBLIC_ORIGIN) {
    return undefined;
  }
  return `${PUBLIC_ORIGIN}${path}`;
}

async function main(): Promise<void> {
  /* Für SIGINT/SIGTERM auch vor app.listen() (sonst blockiert z. B. tsx-Elternprozess beim Beenden). */
  const shutdownRefs: {
    sqlite?: ReturnType<typeof openDb>;
    app?: FastifyInstance;
  } = {};
  let stopRequested = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (stopRequested) {
      return;
    }
    stopRequested = true;
    console.log(`\n[dsabrew] ${signal} — Server wird beendet …`);
    const code = signal === "SIGINT" ? 130 : 143;
    try {
      if (shutdownRefs.app) {
        await shutdownRefs.app.close();
      }
    } catch (err) {
      shutdownRefs.app?.log.error({ err }, "fastify_close_failed");
    }
    try {
      shutdownRefs.sqlite?.close();
    } catch (err) {
      shutdownRefs.app?.log.error({ err }, "sqlite_close_failed");
    }
    process.exit(code);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));

  console.log(`[dsabrew] Start mit Node ${process.version} …`);

  loadCanonical();
  console.error("[dsabrew] Kanonischer Markdown geladen.");

  console.error("[dsabrew] SQLite-Pfad:", SQLITE_PATH);
  let db: ReturnType<typeof openDb>;
  try {
    db = openDb(SQLITE_PATH);
  } catch (err) {
    console.error("[dsabrew] SQLite konnte nicht geöffnet werden (anderer Server läuft? Dateirechte?):", err);
    throw err;
  }
  shutdownRefs.sqlite = db;
  console.error("[dsabrew] SQLite geöffnet.");

  console.error("[dsabrew] Datei-Logger initialisieren …");
  const logDir = resolveLogDir(repoRoot);
  const rootLogger = createServerLogger(logDir);
  console.error("[dsabrew] Datei-Logger fertig.");

  const app = Fastify({
    // Fastify 5: fertige Pino-Instanz → loggerInstance, nicht logger (nur Konfig-Objekt)
    loggerInstance: rootLogger,
    trustProxy: process.env.TRUST_PROXY === "1"
  });
  shutdownRefs.app = app as unknown as FastifyInstance;

  await app.register(cors, {
    origin: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  });
  await app.register(rateLimit, {
    global: false
  });
  console.error("[dsabrew] Fastify-Plugins registriert, binde Port …");

  app.get("/api/health", async () => {
    const m = getMaintenanceSnapshot();
    return {
      ok: true,
      maintenance: m.maintenance,
      abuseCreatesInWindow: m.createsInWindow
    };
  });

  if (isOpsStatusPageEnabled()) {
    /* Explicit preHandler: CodeQL js/missing-rate-limiting does not treat config.rateLimit as sufficient. */
    const opsStatusRateLimitPreHandler = (app as unknown as FastifyWithRateLimit).rateLimit({
      max: 30,
      timeWindow: "1 minute",
      keyGenerator: (req) => (req.ip ? String(req.ip) : "unknown")
    });
    app.get(
      "/api/ops/status",
      { preHandler: opsStatusRateLimitPreHandler },
      async (req, reply) => {
        if (!verifyOpsStatusBasicAuth(req, reply)) {
          return;
        }
        const payload = buildOpsStatusPayload(db, SQLITE_PATH);
        const q = req.query as { format?: string };
        const accept = req.headers.accept ?? "";
        if (q.format === "html" || accept.includes("text/html")) {
          reply.type("text/html; charset=utf-8");
          return renderOpsStatusHtml(payload);
        }
        return payload;
      }
    );
  }

  setInterval(() => {
    evaluateUnlock();
  }, 30_000).unref();

  startSqliteSizeWatch(SQLITE_PATH, rootLogger);
  scheduleWeeklyReport(db, rootLogger, SQLITE_PATH);

  app.post(
    "/api/documents",
    {
      config: {
        rateLimit: {
          max: Number(process.env.RATE_POST_CREATE_PER_HOUR ?? 10),
          timeWindow: "1 hour",
          keyGenerator: (req) => (req.ip ? String(req.ip) : "unknown")
        }
      }
    },
    async (_req, reply) => {
      if (isMaintenanceMode()) {
        return reply.code(503).send({
          error: "maintenance",
          message: "Neue Dokumente vorübergehend nicht möglich. Bitte später erneut versuchen."
        });
      }
      const id = nanoid();
      const slugView = nanoid(21);
      const slugEdit = nanoid(21);
      const now = Date.now();
      insertDocument(db, {
        id,
        slug_view: slugView,
        slug_edit: slugEdit,
        markdown: canonicalMarkdown,
        created_at: now,
        updated_at: now
      });
      recordDocumentCreation();
      reply.code(201);
      return {
        slugView,
        slugEdit,
        viewUrl: publicUrl(`/d/${slugView}`),
        editUrl: publicUrl(`/d/${slugEdit}`)
      };
    }
  );

  app.get("/api/documents/:token", async (req, reply) => {
    const token = (req.params as { token: string }).token;
    const row = findByAnySlug(db, token);
    if (!row) {
      return reply.code(404).send({ error: "not_found" });
    }

    if (
      row.ever_diverged === 0 &&
      isStillDefaultBody(row.markdown) &&
      Date.now() - row.created_at > TTL_MS
    ) {
      deleteDocument(db, row.id);
      return reply.code(404).send({ error: "gone" });
    }

    const mode = row.slug_edit === token ? "edit" : "view";
    const payload: {
      markdown: string;
      mode: "view" | "edit";
      updatedAt: number;
      slugView: string;
      slugEdit?: string;
    } = {
      markdown: row.markdown,
      mode,
      updatedAt: row.updated_at,
      slugView: row.slug_view
    };
    if (mode === "edit") {
      payload.slugEdit = row.slug_edit;
    }
    return payload;
  });

  app.put(
    "/api/documents/:token",
    {
      config: {
        rateLimit: {
          max: Number(process.env.RATE_PUT_BURST_PER_MIN ?? 60),
          timeWindow: "1 minute",
          keyGenerator: (req) => {
            const ip = req.ip ? String(req.ip) : "unknown";
            const tok = (req.params as { token: string }).token;
            return `${ip}:${tok}`;
          }
        }
      }
    },
    async (req, reply) => {
      const ip = req.ip ? String(req.ip) : "unknown";
      const hourlyMax = Number(process.env.RATE_PUT_PER_HOUR ?? 120);
      if (!allowHourlyPut(ip, hourlyMax)) {
        return reply.code(429).send({ error: "rate_limited" });
      }
      const token = (req.params as { token: string }).token;
      const row = findByAnySlug(db, token);
      if (!row) {
        return reply.code(404).send({ error: "not_found" });
      }
      if (row.slug_edit !== token) {
        return reply.code(403).send({ error: "read_only" });
      }
      const body = req.body as { markdown?: string };
      if (typeof body?.markdown !== "string") {
        return reply.code(400).send({ error: "invalid_body" });
      }
      const now = Date.now();
      const diverged =
        row.ever_diverged === 1 || !isStillDefaultBody(body.markdown) ? 1 : 0;
      updateMarkdown(db, row.id, body.markdown, now, diverged);
      return { ok: true, updatedAt: now };
    }
  );

  await app.listen({ port: PORT, host: "0.0.0.0" });
  const bound = app.server.address();
  const listenPort = typeof bound === "object" && bound ? bound.port : PORT;
  const opsStatus = isOpsStatusPageEnabled() ? " GET /api/ops/status (Basic Auth)" : "";
  console.log(`dsabrew API listening on 0.0.0.0:${listenPort} — GET /api/health${opsStatus}`);
  app.log.info({ SQLITE_PATH, logDir, ttlHours: TTL_MS / (60 * 60 * 1000) }, "dsabrew public API listening");
}

void main().catch((e) => {
  console.error(e);
  const code = e && typeof e === "object" && "code" in e ? String((e as { code?: unknown }).code) : "";
  const message = e instanceof Error ? e.message : String(e);
  if (
    code === "ERR_DLOPEN_FAILED" ||
    message.includes("NODE_MODULE_VERSION") ||
    message.includes("better_sqlite3.node")
  ) {
    console.error(
      "\n[dsabrew] Native Modul passt nicht zur Node-Version (typisch: better-sqlite3).\n" +
        "  • Gleiche Node-Version wie bei der Installation nutzen (Projekt: Node 24+, siehe .nvmrc).\n" +
        "  • Danach im Ordner server/: npm rebuild better-sqlite3   oder   rm -rf node_modules && npm install\n"
    );
  }
  if (code === "EADDRINUSE") {
    console.error(
      "\n[dsabrew] Port bereits belegt (EADDRINUSE). Anderen Prozess beenden oder PORT in der Umgebung setzen.\n"
    );
  }
  process.exit(1);
});
