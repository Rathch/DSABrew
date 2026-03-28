import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { nanoid } from "nanoid";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deleteDocument,
  findByAnySlug,
  insertDocument,
  openDb,
  updateMarkdown
} from "./db.js";
import { normalizeMarkdown, sha256Hex } from "./normalize.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "../..");

const PORT = Number(process.env.PORT ?? "3001");
const SQLITE_PATH = process.env.SQLITE_PATH ?? join(repoRoot, "server", "data", "dsabrew.db");
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN ?? "").replace(/\/$/, "");

const TTL_MS = 24 * 60 * 60 * 1000;

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

async function loadCanonical(): Promise<void> {
  const mod = await import("../../web/src/default-markdown-demo.ts");
  canonicalMarkdown = mod.DEFAULT_MARKDOWN_DEMO;
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
  await loadCanonical();

  const db = openDb(SQLITE_PATH);
  const app = Fastify({
    logger: true,
    trustProxy: process.env.TRUST_PROXY === "1"
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    global: false
  });

  app.get("/api/health", async () => ({ ok: true }));

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
  app.log.info({ SQLITE_PATH }, "dsabrew public API listening");
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
