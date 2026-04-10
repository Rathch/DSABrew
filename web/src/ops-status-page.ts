/** Betriebsstatus unter `/ops`: `GET /api/ops/status` mit HTTP Basic (vom Nutzer eingegeben). */
import { apiUrl, escapeHtml, staticHostedPageShellHtml } from "./main-helpers";

/** Entspricht `OpsStatusPayload` der API (`server/src/ops-status.ts`). */
export type OpsStatusPayload = {
  generatedAt: string;
  sqlite: {
    path: string;
    sizeMib: number;
    thresholdMib: number;
  };
  documents: {
    total: number;
    newInPreviousIsoWeek: number;
  };
  abuse: {
    maintenance: boolean;
    createsInWindow: number;
    windowMs: number;
    maxCreates: number;
  };
};

/** UTF-8-sicherer Basic-Auth-Header (Passwort darf Nicht-ASCII enthalten). */
export function basicAuthHeader(user: string, password: string): string {
  const s = `${user}:${password}`;
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return `Basic ${btoa(binary)}`;
}

export function formatOpsStatusTableHtml(p: OpsStatusPayload): string {
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
        `<tr><th scope="row">${k}</th><td>${v}</td></tr>`
    )
    .join("");
  return `<div class="ops-status-meta">Stand: ${escapeHtml(p.generatedAt)}</div>
<div class="ops-status-table-wrap">
<table class="ops-status-table" aria-label="Betriebskennzahlen">${body}</table>
</div>`;
}

export function buildOpsStatusPageLayout(): string {
  return staticHostedPageShellHtml(
    "Betrieb",
    `<div class="legal-prose legal-prose-flow ops-status-page-root">
      <form id="ops-status-form" class="ops-status-form" autocomplete="on">
        <label>
          Benutzername
          <input name="user" type="text" required autocomplete="username" spellcheck="false" />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required autocomplete="current-password" />
        </label>
        <button type="submit" id="ops-status-submit" class="ui-toolbar-btn ui-toolbar-btn--primary ops-status-submit">
          Status laden
        </button>
      </form>
      <div id="ops-status-error" class="ops-status-err" hidden></div>
      <div id="ops-status-result" class="ops-status-result" hidden></div>
    </div>`
  );
}

export function wireOpsStatusPage(
  container: HTMLElement,
  publicApiBase: string | undefined
): void {
  const form = container.querySelector<HTMLFormElement>("#ops-status-form");
  const errEl = container.querySelector<HTMLElement>("#ops-status-error");
  const resultEl = container.querySelector<HTMLElement>("#ops-status-result");
  const submitBtn = container.querySelector<HTMLButtonElement>("#ops-status-submit");
  if (!form || !errEl || !resultEl || !submitBtn) {
    return;
  }

  const showErr = (msg: string): void => {
    errEl.textContent = msg;
    errEl.removeAttribute("hidden");
    resultEl.setAttribute("hidden", "");
    resultEl.innerHTML = "";
  };

  const hideErr = (): void => {
    errEl.textContent = "";
    errEl.setAttribute("hidden", "");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    hideErr();
    const fd = new FormData(form);
    const user = String(fd.get("user") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!user || !password) {
      showErr("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    submitBtn.disabled = true;
    const prev = submitBtn.textContent;
    submitBtn.textContent = "Lade…";

    const url = apiUrl("/api/ops/status", publicApiBase);
    void (async () => {
      try {
        const r = await fetch(url, {
          headers: { Authorization: basicAuthHeader(user, password) },
          credentials: "omit"
        });
        if (r.status === 404) {
          showErr(
            "Endpoint nicht aktiv: In der .env im Repo-Root OPS_STATUS_PASSWORD setzen, API neu starten."
          );
          return;
        }
        if (r.status === 401) {
          showErr("Anmeldung fehlgeschlagen (Benutzername oder Passwort falsch).");
          return;
        }
        if (!r.ok) {
          showErr(`HTTP ${r.status}: ${r.statusText || "Fehler"}`);
          return;
        }
        const data = (await r.json()) as OpsStatusPayload;
        resultEl.innerHTML = formatOpsStatusTableHtml(data);
        resultEl.removeAttribute("hidden");
      } catch {
        showErr("API nicht erreichbar oder Netzwerkfehler.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = prev ?? "Status laden";
      }
    })();
  });
}
