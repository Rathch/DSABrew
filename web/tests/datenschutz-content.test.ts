import { describe, expect, it } from "vitest";
import { DATENSCHUTZ_BODY_HTML } from "../src/datenschutz-content";

describe("DATENSCHUTZ_BODY_HTML", () => {
  it("contains expected structure and product name", () => {
    expect(DATENSCHUTZ_BODY_HTML).toContain("DSABrew");
    expect(DATENSCHUTZ_BODY_HTML).toContain("Verantwortlicher");
    expect(DATENSCHUTZ_BODY_HTML).toContain("legal-prose");
    expect(DATENSCHUTZ_BODY_HTML).toContain("kontakt@rath-ulrich.de");
  });
});
