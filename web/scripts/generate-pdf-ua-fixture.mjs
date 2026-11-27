/**
 * Writes tests/fixtures/pdf-ua/reference.pdf via Vitest (needs Gentium font).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
execSync("npm run test -- tests/pdf-ua-export.test.ts -t StructTreeRoot", {
  cwd: webRoot,
  stdio: "inherit",
  env: { ...process.env, WRITE_PDF_UA_FIXTURE: "1" }
});
