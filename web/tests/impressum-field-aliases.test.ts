import { describe, expect, it } from "vitest";
import { resolveImpressumFieldKey } from "../src/impressum-field-aliases";

describe("resolveImpressumFieldKey", () => {
  it("maps German aliases to canonical ImpressumData keys", () => {
    expect(resolveImpressumFieldKey("version")).toBe("versionNumber");
    expect(resolveImpressumFieldKey("datum")).toBe("versionDate");
    expect(resolveImpressumFieldKey("kontakt")).toBe("contactValue");
    expect(resolveImpressumFieldKey("disclaimer")).toBe("disclaimerBody");
  });

  it("is case-insensitive for aliases", () => {
    expect(resolveImpressumFieldKey("KONTAKT")).toBe("contactValue");
    expect(resolveImpressumFieldKey("  Version  ")).toBe("versionNumber");
  });

  it("accepts canonical keys with different casing", () => {
    expect(resolveImpressumFieldKey("projectTitle")).toBe("projectTitle");
    expect(resolveImpressumFieldKey("AUTHORVALUE")).toBe("authorValue");
  });

  it("returns null for unknown keys", () => {
    expect(resolveImpressumFieldKey("no-such-field")).toBeNull();
  });
});
