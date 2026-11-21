import { describe, expect, it } from "vitest";
import { formatPageLinkText } from "./copy-page-link.lib";

describe("formatPageLinkText", () => {
  const url = "https://dashboard.tallaby.com/website/edit";

  it("quotes each label, joins them with > and puts the URL on the next line", () => {
    expect(formatPageLinkText(["المتجر الإلكتروني", "تعديل الموقع"], url)).toBe(
      `"المتجر الإلكتروني" > "تعديل الموقع"\n${url}`,
    );
  });

  it("handles a single top-level label", () => {
    expect(formatPageLinkText(["Home"], url)).toBe(`"Home"\n${url}`);
  });

  it("falls back to the URL alone when there is no trail", () => {
    expect(formatPageLinkText([], url)).toBe(url);
  });
});
