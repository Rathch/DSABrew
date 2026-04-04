import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAbuseEnv } from "./abuse-env.js";

test("parseAbuseEnv: leerer ABUSE_DOC_CREATE_MAX → Default 500 (nicht 0)", () => {
  const p = parseAbuseEnv({
    ABUSE_DOC_CREATE_MAX: "",
    ABUSE_DOC_CREATE_WINDOW_MS: "600000",
    ABUSE_MAINTENANCE_COOLDOWN_MS: "900000"
  });
  assert.equal(p.maxCreates, 500);
});

test("parseAbuseEnv: nur Whitespace bei MAX → Default", () => {
  const p = parseAbuseEnv({
    ABUSE_DOC_CREATE_MAX: "   ",
    ABUSE_DOC_CREATE_WINDOW_MS: "",
    ABUSE_MAINTENANCE_COOLDOWN_MS: ""
  });
  assert.equal(p.maxCreates, 500);
  assert.equal(p.windowMs, 600_000);
  assert.equal(p.cooldownMs, 900_000);
});

test("parseAbuseEnv: MAX=0 → Default (0 wäre sonst sofortige Sperre)", () => {
  const p = parseAbuseEnv({
    ABUSE_DOC_CREATE_MAX: "0"
  });
  assert.equal(p.maxCreates, 500);
});

test("parseAbuseEnv: MAX=500 gültig", () => {
  const p = parseAbuseEnv({ ABUSE_DOC_CREATE_MAX: "500" });
  assert.equal(p.maxCreates, 500);
});

test("parseAbuseEnv: NaN / Unsinn → Default", () => {
  assert.equal(parseAbuseEnv({ ABUSE_DOC_CREATE_MAX: "x" }).maxCreates, 500);
  assert.equal(parseAbuseEnv({ ABUSE_DOC_CREATE_WINDOW_MS: "nope" }).windowMs, 600_000);
});
