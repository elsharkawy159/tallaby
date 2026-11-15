import { describe, expect, it } from "vitest";
import { relevanceRank, sortByRelevance, templateIndustry } from "./template-relevance.lib";

const tpl = (key: string, category: string) => ({ key, category });
const keys = (list: readonly { key: string }[]) => list.map((template) => template.key);

// Real keys where the code data matters: streetwear is the tshirts niche's template (fashion);
// kasr sits in the fashion category but serves womens-shoes, a shoes-bags niche.
const LIST = [
  tpl("home-1", "home"),
  tpl("beauty-1", "beauty"),
  tpl("kasr", "fashion"),
  tpl("fashion-1", "fashion"),
  tpl("jewelry-1", "jewelry"),
  tpl("shoes-1", "shoes-bags"),
  tpl("streetwear", "fashion"),
  tpl("fashion-2", "fashion"),
  tpl("classic", "general"),
];

describe("sortByRelevance", () => {
  it("orders by tier: the niche's template, same industry, related industries in order, the rest", () => {
    // fashion's related industries: shoes-bags, jewelry, beauty, handmade.
    expect(keys(sortByRelevance(LIST, { industryId: "fashion", nicheId: "tshirts" }))).toEqual([
      "streetwear",
      "fashion-1",
      "fashion-2",
      "kasr",
      "shoes-1",
      "jewelry-1",
      "beauty-1",
      "home-1",
      "classic",
    ]);
  });

  it("puts templates with the niche's edition next when the niche has no ready template", () => {
    const rank = relevanceRank({ industryId: "fashion", nicheId: "tshirts", nicheTemplates: [] });
    expect(rank(tpl("streetwear", "fashion"))).toBe(1);
    expect(rank(tpl("fashion-1", "fashion"))).toBe(2);
  });

  it("reads a niche template's industry from its niche, not its category", () => {
    expect(templateIndustry(tpl("kasr", "fashion"))).toBe("shoes-bags");
    expect(templateIndustry(tpl("fashion-1", "fashion"))).toBe("fashion");
    // A shoes-bags store sees kasr with its own industry; the fashion templates are related.
    expect(keys(sortByRelevance(LIST, { industryId: "shoes-bags" })).slice(0, 2)).toEqual(["kasr", "shoes-1"]);
    // The womens-shoes niche: kasr is its own template.
    expect(keys(sortByRelevance(LIST, { industryId: "shoes-bags", nicheId: "womens-shoes" }))[0]).toBe("kasr");
  });

  it("follows RELATED_INDUSTRIES order for related industries", () => {
    // beauty's related industries: health, fashion, jewelry, handmade.
    const list = [tpl("j", "jewelry"), tpl("f", "fashion"), tpl("h", "health"), tpl("b", "beauty")];
    expect(keys(sortByRelevance(list, { industryId: "beauty" }))).toEqual(["b", "h", "f", "j"]);
  });

  it("is stable: one tier keeps the input order", () => {
    const list = [tpl("f3", "fashion"), tpl("x", "home"), tpl("f1", "fashion"), tpl("f2", "fashion")];
    expect(keys(sortByRelevance(list, { industryId: "fashion" }))).toEqual(["f3", "f1", "f2", "x"]);
  });

  it("returns the list unchanged with no industry and no niche", () => {
    expect(keys(sortByRelevance(LIST))).toEqual(keys(LIST));
    expect(keys(sortByRelevance(LIST, { industryId: null, nicheId: null }))).toEqual(keys(LIST));
  });

  it("treats an unknown niche as none, so only the industry counts", () => {
    expect(keys(sortByRelevance(LIST, { industryId: "fashion", nicheId: "no-such-niche" }))).toEqual(keys(sortByRelevance(LIST, { industryId: "fashion" })));
  });

  it("takes the industry from the niche when none is given", () => {
    expect(keys(sortByRelevance(LIST, { nicheId: "tshirts" }))).toEqual(keys(sortByRelevance(LIST, { industryId: "fashion", nicheId: "tshirts" })));
  });

  it("does not change the input", () => {
    const list = [...LIST];
    sortByRelevance(list, { industryId: "fashion" });
    expect(list).toEqual(LIST);
  });
});
