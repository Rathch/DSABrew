import assert from "node:assert/strict";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeRotatingSize,
  redactRequestUrl,
  resolveLogDir
} from "./logger-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function withLogDir<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env.LOG_DIR;
  if (value === undefined) {
    delete process.env.LOG_DIR;
  } else {
    process.env.LOG_DIR = value;
  }
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete process.env.LOG_DIR;
    } else {
      process.env.LOG_DIR = prev;
    }
  }
}

test("redactRequestUrl: undefined / leer", () => {
  assert.equal(redactRequestUrl(undefined), "");
  assert.equal(redactRequestUrl(""), "");
});

test("redactRequestUrl: ersetzt Token unter /api/documents/", () => {
  assert.equal(
    redactRequestUrl("/api/documents/abc123xyz"),
    "/api/documents/:redacted"
  );
  assert.equal(
    redactRequestUrl("/api/documents/tok_en/edit?x=1"),
    "/api/documents/:redacted/edit?x=1"
  );
});

test("redactRequestUrl: Pfade ohne Dokument-ID bleiben unverändert", () => {
  assert.equal(redactRequestUrl("/api/health"), "/api/health");
  assert.equal(redactRequestUrl("/"), "/");
});

test("normalizeRotatingSize: trim + Einheit groß", () => {
  assert.equal(normalizeRotatingSize("  10m  "), "10M");
  assert.equal(normalizeRotatingSize("2k"), "2K");
});

test("normalizeRotatingSize: unbekanntes Format durchreichen", () => {
  assert.equal(normalizeRotatingSize("10MB"), "10MB");
});

test("resolveLogDir: Default server/logs relativ zum Repo-Root", () => {
  withLogDir(undefined, () => {
    assert.equal(resolveLogDir(repoRoot), join(repoRoot, "server", "logs"));
  });
});

test("resolveLogDir: LOG_DIR absolut", () => {
  withLogDir("/var/log/dsabrew", () => {
    assert.equal(resolveLogDir(repoRoot), "/var/log/dsabrew");
  });
});

test("resolveLogDir: LOG_DIR relativ", () => {
  withLogDir("custom-logs", () => {
    assert.equal(resolveLogDir(repoRoot), join(repoRoot, "custom-logs"));
  });
});
