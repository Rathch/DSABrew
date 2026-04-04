import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Database } from "better-sqlite3";
import type { FastifyReply, FastifyRequest } from "fastify";
import { buildOpsStatusPayload, verifyOpsStatusBasicAuth } from "./ops-status.js";

test("buildOpsStatusPayload liefert erwartete Felder", () => {
  const dir = mkdtempSync(join(tmpdir(), "dsabrew-ops-"));
  try {
    const dbPath = join(dir, "t.db");
    writeFileSync(dbPath, "");
    const mockDb = {
      prepare() {
        return {
          get() {
            return { c: 0 };
          }
        };
      }
    } as unknown as Database;
    const p = buildOpsStatusPayload(mockDb, dbPath);
    assert.match(p.generatedAt, /^\d{4}-/);
    assert.equal(p.sqlite.sizeMib, 0);
    assert.equal(p.documents.total, 0);
    assert.equal(p.documents.newInPreviousIsoWeek, 0);
    assert.equal(typeof p.abuse.maintenance, "boolean");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyOpsStatusBasicAuth akzeptiert gültiges Basic-Auth", () => {
  process.env.OPS_STATUS_PASSWORD = "test-secret";
  process.env.OPS_STATUS_USER = "ops";
  const auth = `Basic ${Buffer.from("ops:test-secret").toString("base64")}`;
  const req = { headers: { authorization: auth } } as FastifyRequest;
  let sendBody: unknown;
  const reply = {
    code() {
      return this;
    },
    header() {
      return this;
    },
    send(body?: unknown) {
      sendBody = body;
      return this;
    }
  } as unknown as FastifyReply;
  const ok = verifyOpsStatusBasicAuth(req, reply);
  assert.equal(ok, true);
  assert.equal(sendBody, undefined);
});

test("verifyOpsStatusBasicAuth lehnt falsches Passwort ab", () => {
  process.env.OPS_STATUS_PASSWORD = "test-secret";
  process.env.OPS_STATUS_USER = "ops";
  const auth = `Basic ${Buffer.from("ops:wrong").toString("base64")}`;
  const req = { headers: { authorization: auth } } as FastifyRequest;
  let code = 0;
  const reply = {
    code(n: number) {
      code = n;
      return this;
    },
    header() {
      return this;
    },
    send() {
      return this;
    }
  } as unknown as FastifyReply;
  const ok = verifyOpsStatusBasicAuth(req, reply);
  assert.equal(ok, false);
  assert.equal(code, 401);
});
