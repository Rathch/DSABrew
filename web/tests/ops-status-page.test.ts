import { describe, expect, it } from "vitest";
import {
  basicAuthHeader,
  formatOpsStatusTableHtml,
  type OpsStatusPayload
} from "../src/ops-status-page";

describe("basicAuthHeader", () => {
  it("encodes ASCII credentials", () => {
    const h = basicAuthHeader("ops", "secret");
    expect(h.startsWith("Basic ")).toBe(true);
    expect(atob(h.slice(6))).toBe("ops:secret");
  });

  it("encodes non-ASCII password", () => {
    const h = basicAuthHeader("ops", "päss");
    expect(h.startsWith("Basic ")).toBe(true);
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(h.slice(6)), (c) => c.charCodeAt(0))
    );
    expect(decoded).toBe("ops:päss");
  });
});

describe("formatOpsStatusTableHtml", () => {
  it("rendert Tabelle ohne Roh-HTML in Werten", () => {
    const p: OpsStatusPayload = {
      generatedAt: "2026-01-01T00:00:00.000Z",
      sqlite: {
        path: "/tmp/<x>",
        sizeMib: 0,
        thresholdMib: 2048
      },
      documents: {
        total: 42,
        newInPreviousIsoWeek: 0
      },
      abuse: {
        maintenance: false,
        createsInWindow: 0,
        windowMs: 600000,
        maxCreates: 500
      }
    };
    const html = formatOpsStatusTableHtml(p);
    expect(html).not.toContain("<x>");
    expect(html).toContain("&lt;x&gt;");
  });
});
