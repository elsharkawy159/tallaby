import { describe, expect, it } from "vitest";
import { cardEdition, templatePreviewPageUrl } from "./template-edition.lib";

describe("cardEdition", () => {
  const tpl = { editions: [{ id: "tshirts" }] };
  it("uses the niche tab's edition only when the template has it", () => {
    expect(cardEdition(tpl, "tshirts")).toBe("tshirts");
    expect(cardEdition(tpl, "dresses")).toBeNull();
    expect(cardEdition({}, "tshirts")).toBeNull();
    expect(cardEdition(tpl, null)).toBeNull();
  });
  it("keeps a niche card's own edition on every tab", () => {
    expect(cardEdition(tpl, null, { niche: "bags", name: { ar: "", en: "" }, edition: "bags" })).toBe("bags");
    expect(cardEdition(tpl, "tshirts", { niche: "bags", name: { ar: "", en: "" }, edition: null })).toBeNull();
  });
});

describe("templatePreviewPageUrl", () => {
  it("builds the tallaby.com preview link with the edition and the locale prefix", () => {
    expect(templatePreviewPageUrl("https://tallaby.com", "ar", "fashion-luxe", "tshirts")).toBe("https://tallaby.com/template-preview/fashion-luxe?edition=tshirts");
    expect(templatePreviewPageUrl("https://tallaby.com", "en", "fashion-luxe", null)).toBe("https://tallaby.com/en/template-preview/fashion-luxe");
  });
});
