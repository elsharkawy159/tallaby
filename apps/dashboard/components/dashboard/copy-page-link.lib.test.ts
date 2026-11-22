import { describe, expect, it } from "vitest";
import { formatPageLinkText } from "./copy-page-link.lib";

describe("formatPageLinkText", () => {
  const url = "https://dashboard.tallaby.com/website/edit";

  it("bolds each label, joins them with ← in Arabic and puts the URL on the next line", () => {
    expect(formatPageLinkText(["إعدادات المتجر", "طرق الدفع"], url, "ar")).toBe(`*إعدادات المتجر* ← *طرق الدفع*\n${url}`);
  });

  it("defaults to Arabic", () => {
    expect(formatPageLinkText(["إعدادات المتجر", "طرق الدفع"], url)).toBe(`*إعدادات المتجر* ← *طرق الدفع*\n${url}`);
  });

  it("uses → in English", () => {
    expect(formatPageLinkText(["Store settings", "Payments"], url, "en")).toBe(`*Store settings* → *Payments*\n${url}`);
  });

  it("handles a single top-level label", () => {
    expect(formatPageLinkText(["Home"], url, "en")).toBe(`*Home*\n${url}`);
  });

  it("falls back to the URL alone when there is no trail", () => {
    expect(formatPageLinkText([], url)).toBe(url);
  });
});
