import { describe, expect, it } from "vitest";
import { NPC_TEMPLATE_PX } from "../src/npc-template-dimensions";

describe("NPC_TEMPLATE_PX", () => {
  it("matches the parchment NPC block template size", () => {
    expect(NPC_TEMPLATE_PX.w).toBe(555);
    expect(NPC_TEMPLATE_PX.h).toBe(614);
  });
});
