import { createHash } from "node:crypto";

/** Aligns with specs/001-dsa-brew-renderer/research.md (Public hosting). */
export function normalizeMarkdown(s: string): string {
  const lf = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  return `${lf}\n`;
}

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}
