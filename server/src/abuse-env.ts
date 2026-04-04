/**
 * Env für FR-035: leere Strings und Unsinn (z. B. 0) dürfen nicht zu MAX=0 führen —
 * das würde nach jedem ersten POST den Wartungsmodus auslösen (length >= 0).
 */

export type AbuseEnvParsed = {
  windowMs: number;
  maxCreates: number;
  cooldownMs: number;
};

function readPositiveInt(
  raw: string | undefined,
  defaultVal: number,
  minInclusive: number
): number {
  if (raw === undefined || String(raw).trim() === "") {
    return defaultVal;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < minInclusive) {
    return defaultVal;
  }
  return Math.floor(n);
}

function readNonNegativeInt(
  raw: string | undefined,
  defaultVal: number
): number {
  if (raw === undefined || String(raw).trim() === "") {
    return defaultVal;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return defaultVal;
  }
  return Math.floor(n);
}

/** Fenster mindestens 1 ms; praktisch sinnvoll ist deutlich mehr. */
export function parseAbuseEnv(env: NodeJS.ProcessEnv): AbuseEnvParsed {
  const defWindow = 600_000;
  const defMax = 500;
  const defCooldown = 900_000;

  return {
    windowMs: readPositiveInt(env.ABUSE_DOC_CREATE_WINDOW_MS, defWindow, 1),
    maxCreates: readPositiveInt(env.ABUSE_DOC_CREATE_MAX, defMax, 1),
    cooldownMs: readNonNegativeInt(env.ABUSE_MAINTENANCE_COOLDOWN_MS, defCooldown)
  };
}
