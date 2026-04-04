import { describe, expect, it } from "vitest";
import {
  FAN_PRODUKT_LOGO_SRC,
  ULISSES_MARKEN_HINWEIS,
  fanProductNoticeHtml
} from "../src/fan-product-notice";

describe("fanProductNoticeHtml", () => {
  it("renders Markenhinweis-Block mit escaped URLs und Trademark-Text", () => {
    const html = fanProductNoticeHtml();
    expect(html).toContain("fan-notice");
    expect(html).toContain("fan-notice__img");
    expect(html).toContain(FAN_PRODUKT_LOGO_SRC.replace(/&/g, "&amp;"));
    expect(html).toContain(ULISSES_MARKEN_HINWEIS.split(" ")[0]);
    expect(html).toContain("The Homebrewery");
    expect(html).not.toContain("<script");
  });
});
