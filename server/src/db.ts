import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type HostedRow = {
  id: string;
  slug_view: string;
  slug_edit: string;
  markdown: string;
  created_at: number;
  updated_at: number;
  ever_diverged: number;
};

export function openDb(sqlitePath: string): Database.Database {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = new Database(sqlitePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      slug_view TEXT NOT NULL UNIQUE,
      slug_edit TEXT NOT NULL UNIQUE,
      markdown TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ever_diverged INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export function findByAnySlug(db: Database.Database, token: string): HostedRow | undefined {
  const row = db
    .prepare(
      `SELECT id, slug_view, slug_edit, markdown, created_at, updated_at, ever_diverged
       FROM documents WHERE slug_view = ? OR slug_edit = ?`
    )
    .get(token, token) as HostedRow | undefined;
  return row;
}

export function deleteDocument(db: Database.Database, id: string): void {
  db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
}

export function insertDocument(
  db: Database.Database,
  row: Omit<HostedRow, "ever_diverged"> & { ever_diverged?: number }
): void {
  db.prepare(
    `INSERT INTO documents (id, slug_view, slug_edit, markdown, created_at, updated_at, ever_diverged)
     VALUES (@id, @slug_view, @slug_edit, @markdown, @created_at, @updated_at, @ever_diverged)`
  ).run({
    ...row,
    ever_diverged: row.ever_diverged ?? 0
  });
}

export function updateMarkdown(
  db: Database.Database,
  id: string,
  markdown: string,
  updatedAt: number,
  everDiverged: number
): void {
  db.prepare(
    `UPDATE documents SET markdown = ?, updated_at = ?, ever_diverged = ? WHERE id = ?`
  ).run(markdown, updatedAt, everDiverged, id);
}

/** `startMs` inklusiv, `endMsExclusive` exklusiv (Zeit in ms seit Epoch). */
export function countDocumentsCreatedBetween(
  db: Database.Database,
  startMs: number,
  endMsExclusive: number
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM documents WHERE created_at >= ? AND created_at < ?`
    )
    .get(startMs, endMsExclusive) as { c: number };
  return Number(row.c);
}
