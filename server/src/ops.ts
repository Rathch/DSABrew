import type { Database } from "better-sqlite3";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import cron from "node-cron";
import { DateTime, Settings } from "luxon";
import type { ServerLogger } from "./logger-config.js";
import { countDocumentsCreatedBetween } from "./db.js";
import {
  getAlertRecipients,
  getWeeklyReportRecipients,
  isOpsStatusPageEnabled,
  isSmtpConfigured,
  sendSmtpMail
} from "./mail.js";

/** ISO-Woche: Montag als Wochenbeginn (Europe/Berlin); Wochenende Sa/So. */
Settings.defaultWeekSettings = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};

export type OpsState = {
  sqliteSizeAlertLatched?: boolean;
  lastWeeklyReportWeekKey?: string;
};

export function statePathForSqlite(sqlitePath: string): string {
  return join(dirname(sqlitePath), "ops-mail-state.json");
}

export function readOpsState(path: string): OpsState {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as OpsState;
  } catch {
    return {};
  }
}

function writeOpsState(path: string, state: OpsState): void {
  writeFileSync(path, `${JSON.stringify(state)}\n`, "utf8");
}

/** SQLite-Dateigröße: eine Mail pro Übergang unterhalb → oberhalb Schwelle (FR-031). */
export function startSqliteSizeWatch(
  sqlitePath: string,
  log: ServerLogger
): void {
  const threshold = Number(process.env.SQLITE_SIZE_ALERT_BYTES ?? 2_147_483_648);
  const intervalMs = Number(process.env.SQLITE_SIZE_CHECK_MS ?? 3_600_000);
  const pathState = statePathForSqlite(sqlitePath);

  const tick = (): void => {
    try {
      let state = readOpsState(pathState);
      const latched = Boolean(state.sqliteSizeAlertLatched);
      const st = statSync(sqlitePath);
      const size = st.size;

      if (size >= threshold) {
        if (!latched) {
          const recipients = getAlertRecipients();
          const smtpOk = isSmtpConfigured();
          const statusPage = isOpsStatusPageEnabled();
          if (recipients.length > 0 && smtpOk) {
            const text = [
              `Die SQLite-Datei hat die konfigurierte Schwelle erreicht oder überschritten.`,
              ``,
              `Aktuelle Größe: ${size} Bytes`,
              `Schwellwert: ${threshold} Bytes`,
              `Pfad (Server): ${sqlitePath}`,
              ``,
              `Diese Meldung wird nicht wiederholt, solange die Datei über der Schwelle bleibt.`,
              `Nach Unterschreiten der Schwelle kann bei erneutem Anstieg erneut eine Mail gesendet werden.`
            ].join("\n");
            void sendSmtpMail({
              to: recipients.join(", "),
              subject: "[DSABrew] SQLite-Datenbank: Größenwarnung",
              text
            })
              .then(() => {
                log.info({ sqliteSizeBytes: size }, "ops_sqlite_alert_mail_sent");
                writeOpsState(pathState, {
                  ...readOpsState(pathState),
                  sqliteSizeAlertLatched: true
                });
              })
              .catch((err: unknown) => {
                log.error({ err }, "ops_sqlite_alert_mail_failed");
              });
          } else if (statusPage) {
            log.info({ sqliteSizeBytes: size }, "ops_sqlite_alert_latched_status_page");
            writeOpsState(pathState, {
              ...readOpsState(pathState),
              sqliteSizeAlertLatched: true
            });
          } else if (recipients.length > 0 && !smtpOk) {
            log.warn("ops_sqlite_alert_skipped_smtp_not_configured");
          }
        }
      } else if (latched) {
        state = { ...state, sqliteSizeAlertLatched: false };
        writeOpsState(pathState, state);
      }
    } catch (err) {
      log.error({ err }, "ops_sqlite_size_check_failed");
    }
  };

  tick();
  setInterval(tick, intervalMs).unref();
}

export function previousIsoWeekDocumentCount(db: Database): {
  count: number;
  weekLabel: string;
  weekKey: string;
} {
  const zone = process.env.OPS_TIMEZONE ?? "Europe/Berlin";
  const now = DateTime.now().setZone(zone);
  const thisWeekStart = now.startOf("week");
  const prevWeekStart = thisWeekStart.minus({ weeks: 1 });
  const weekLabel = `${prevWeekStart.toISODate()}–${thisWeekStart.minus({ days: 1 }).toISODate()}`;
  const weekKey = `${prevWeekStart.weekYear}-W${String(prevWeekStart.weekNumber).padStart(2, "0")}`;
  const count = countDocumentsCreatedBetween(db, prevWeekStart.toMillis(), thisWeekStart.toMillis());
  return { count, weekLabel, weekKey };
}

/** Montag 08:00 Europe/Berlin (per Env änderbar) — Anzahl neuer Dokumente Vorwoche (FR-032). */
export function scheduleWeeklyReport(
  db: Database,
  log: ServerLogger,
  sqlitePath: string
): void {
  const recipients = getWeeklyReportRecipients();
  if (recipients.length === 0 || !isSmtpConfigured()) {
    if (recipients.length > 0 && !isSmtpConfigured()) {
      log.warn("ops_weekly_report_skipped_smtp_not_configured");
    }
    return;
  }

  const hour = Number(process.env.WEEKLY_REPORT_HOUR ?? 8);
  const weekday = Number(process.env.WEEKLY_REPORT_WEEKDAY ?? 1);
  const tz = process.env.OPS_TIMEZONE ?? "Europe/Berlin";
  const pathState = statePathForSqlite(sqlitePath);

  const expression = `0 ${hour} * * ${weekday}`;

  cron.schedule(
    expression,
    () => {
      try {
        const { count, weekLabel, weekKey } = previousIsoWeekDocumentCount(db);
        const state = readOpsState(pathState);
        if (state.lastWeeklyReportWeekKey === weekKey) {
          return;
        }
        const text = [
          `Wöchentlicher Report DSABrew`,
          ``,
          `Berichtszeitraum (Kalenderwoche, ${tz}): ${weekLabel}`,
          `Neu angelegte Dokumente in diesem Zeitraum: ${count}`,
          ``
        ].join("\n");
        void sendSmtpMail({
          to: recipients.join(", "),
          subject: `[DSABrew] Wöchentlicher Report (${weekLabel})`,
          text
        })
          .then(() => {
            writeOpsState(pathState, { ...readOpsState(pathState), lastWeeklyReportWeekKey: weekKey });
            log.info({ weekKey, newDocuments: count }, "ops_weekly_report_sent");
          })
          .catch((err: unknown) => {
            log.error({ err }, "ops_weekly_report_mail_failed");
          });
      } catch (err) {
        log.error({ err }, "ops_weekly_report_failed");
      }
    },
    { timezone: tz }
  );
}
