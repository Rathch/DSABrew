#!/usr/bin/env node
/**
 * Startet zuerst die API (`server/`), wartet auf `/api/health`, dann `web` (Vite) —
 * vermeidet ECONNREFUSED im Vite-Proxy, wenn der Browser sofort `/api` anfragt.
 * Beendet beide bei Strg+C oder wenn einer mit Fehler endet.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = join(root, "server");
const webRoot = join(root, "web");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

/** Root `.env` PORT (wie `server/load-dotenv.mjs`), sonst Shell `PORT`, sonst 3001. */
function resolveApiPort() {
  const fromShell = process.env.PORT?.trim();
  if (fromShell !== undefined && fromShell !== "") {
    const n = Number(fromShell);
    if (Number.isInteger(n) && n >= 1 && n <= 65535) {
      return n;
    }
  }
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) {
        continue;
      }
      const eq = t.indexOf("=");
      const k = t.slice(0, eq).trim();
      if (k !== "PORT") {
        continue;
      }
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      const n = Number(v.trim());
      if (Number.isInteger(n) && n >= 1 && n <= 65535) {
        return n;
      }
    }
  } catch {
    /* keine .env */
  }
  return 3001;
}

const apiPort = resolveApiPort();

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];
let teardownScheduled = false;

function probeHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 2500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Wartet bis die API antwortet (Vite-Proxy sonst ECONNREFUSED). */
async function waitForApiReady(port, maxMs) {
  const t0 = Date.now();
  console.log(
    `[dev-both] Warte auf API http://127.0.0.1:${port}/api/health (max. ${Math.round(maxMs / 1000)}s) …`
  );
  let lastLog = 0;
  while (Date.now() - t0 < maxMs) {
    if (await probeHealth(port)) {
      console.log("[dev-both] API antwortet — starte Vite.");
      return true;
    }
    const now = Date.now();
    if (now - lastLog > 2500) {
      console.log(`[dev-both] … noch nicht erreichbar (${Math.round((now - t0) / 1000)}s)`);
      lastLog = now;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function killAll(code) {
  if (teardownScheduled) {
    return;
  }
  teardownScheduled = true;
  for (const c of children) {
    if (c.exitCode == null && c.signalCode == null) {
      c.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 500);
}

function runDev(label, cwd) {
  /* stdio inherit: keine Pipe — sonst kann stderr des Kindes blockgepuffert werden und Logs/Fehler erscheinen spät oder gar nicht. */
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd,
    env: process.env,
    shell: isWin,
    stdio: "inherit"
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGINT") {
      return;
    }
    const exitCode = code ?? 1;
    console.error(`[dev-both] ${label} beendet (code=${code}, signal=${signal ?? "—"}) — stoppe den anderen Prozess.`);
    killAll(exitCode);
  });
}

process.once("SIGINT", () => {
  console.error("\n[dev-both] SIGINT — beende api und web …");
  killAll(130);
});
process.once("SIGTERM", () => {
  killAll(143);
});

async function main() {
  console.log(`[dev-both] Starte api (server/) auf Port ${apiPort} …\n`);
  runDev("api", serverRoot);

  const ok = await waitForApiReady(apiPort, 90_000);
  if (!ok) {
    console.error(
      `[dev-both] API nicht erreichbar nach 90s — prüfe server-Logs (Node 24, SQLite, Port ${apiPort}). Beende.`
    );
    killAll(1);
    return;
  }

  console.log("[dev-both] Starte web (Vite) …\n");
  runDev("web", webRoot);
}

void main();
