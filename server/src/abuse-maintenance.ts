/**
 * Globale Erstellungsrate: gleitendes Fenster + Wartungsmodus bei Erstellungsflut (FR-035).
 * Keine Tokens/IPs — nur Zeitstempel erfolgreicher POST /api/documents.
 */

const WINDOW_MS = Number(process.env.ABUSE_DOC_CREATE_WINDOW_MS ?? 600_000);
const MAX_CREATES = Number(process.env.ABUSE_DOC_CREATE_MAX ?? 500);
const COOLDOWN_MS = Number(process.env.ABUSE_MAINTENANCE_COOLDOWN_MS ?? 900_000);

/** Mindestens 1, sonst Entsperrung unmöglich */
const HALF_MAX = Math.max(1, Math.floor(MAX_CREATES / 2));

const creationTimes: number[] = [];

let maintenanceActive = false;
let cooldownStartedAt: number | null = null;

function prune(now: number): void {
  const cutoff = now - WINDOW_MS;
  while (creationTimes.length > 0 && creationTimes[0]! < cutoff) {
    creationTimes.shift();
  }
}

function countInWindow(now: number): number {
  prune(now);
  return creationTimes.length;
}

/** Nach erfolgreichem Anlegen eines Dokuments aufrufen. */
export function recordDocumentCreation(): void {
  const now = Date.now();
  prune(now);
  creationTimes.push(now);
  if (creationTimes.length >= MAX_CREATES) {
    maintenanceActive = true;
    cooldownStartedAt = null;
  }
}

/**
 * Entsperrung: unter halber Schwelle im Fenster + mindestens COOLDOWN_MS „Ruhe“
 * (Zeitzähler startet, sobald die Rate unter die Hälfte fällt).
 */
export function evaluateUnlock(now: number = Date.now()): void {
  prune(now);
  if (!maintenanceActive) {
    return;
  }
  const n = creationTimes.length;
  if (n >= HALF_MAX) {
    cooldownStartedAt = null;
    return;
  }
  if (cooldownStartedAt === null) {
    cooldownStartedAt = now;
    return;
  }
  if (now - cooldownStartedAt >= COOLDOWN_MS) {
    maintenanceActive = false;
    cooldownStartedAt = null;
  }
}

export function isMaintenanceMode(): boolean {
  evaluateUnlock();
  return maintenanceActive;
}

export function getMaintenanceSnapshot(): {
  maintenance: boolean;
  createsInWindow: number;
  windowMs: number;
  maxCreates: number;
  halfMax: number;
} {
  const now = Date.now();
  evaluateUnlock(now);
  return {
    maintenance: maintenanceActive,
    createsInWindow: countInWindow(now),
    windowMs: WINDOW_MS,
    maxCreates: MAX_CREATES,
    halfMax: HALF_MAX
  };
}
