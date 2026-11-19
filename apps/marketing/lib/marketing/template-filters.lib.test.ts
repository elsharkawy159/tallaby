import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  filterGalleryCards,
  hasActiveFilters,
  industryOptions,
  nicheOptions,
  parseGalleryFilters,
  pickNiche,
  toggleIndustry,
  writeGalleryFilters,
  type GalleryFilters,
} from "./template-filters.lib";
import type { GalleryNicheTab } from "./templates.lib";

const entry = (id: string, category: string, sortOrder: number, name = id) => ({ id, category, sortOrder, name });

const entries = [entry("classic", "ge", 1, "Tallaby Classic"), entry("hareer", "fa", 5, "Hareer"), entry("vella", "fa", 9, "Vella"), entry("glow", "be", 3, "Glow"), entry("volt", "el", 7, "Volt")];

const tabs: GalleryNicheTab[] = [
  { id: "abayas", category: "fa", name: "Abayas", looks: ["vella"], switched: true, edition: "abayas" },
  { id: "skincare", category: "be", name: "Skincare", looks: ["glow"], switched: true, edition: null },
  { id: "mixed", category: "fa", name: "Mixed", looks: ["hareer", "vella"] },
];

describe("parseGalleryFilters", () => {
  it("reads industries, niche and sort", () => {
    expect(parseGalleryFilters("?industry=be,fa,zz&sort=newest", tabs)).toEqual({ industries: ["fa", "be"], niche: null, sort: "newest" });
  });

  it("reads the old ?category= links", () => {
    expect(parseGalleryFilters("?category=fa", tabs)).toEqual({ ...EMPTY_FILTERS, industries: ["fa"] });
    expect(parseGalleryFilters("?category=fa&niche=abayas", tabs)).toEqual({ ...EMPTY_FILTERS, industries: ["fa"], niche: "abayas" });
  });

  it("drops a niche of another industry, and a niche alone pins its industry", () => {
    expect(parseGalleryFilters("?category=be&niche=abayas", tabs)).toEqual({ ...EMPTY_FILTERS, industries: ["be"] });
    expect(parseGalleryFilters("?niche=skincare", tabs)).toEqual({ ...EMPTY_FILTERS, industries: ["be"], niche: "skincare" });
    expect(parseGalleryFilters("?niche=nope&sort=bogus", tabs)).toEqual(EMPTY_FILTERS);
  });
});

describe("writeGalleryFilters", () => {
  it("writes industry, niche and sort, keeps other params and drops category", () => {
    const params = writeGalleryFilters({ industries: ["fa", "be"], niche: null, sort: "name" }, "?category=el&utm_source=x");
    expect(params.toString()).toBe("utm_source=x&industry=fa%2Cbe&sort=name");
    expect(writeGalleryFilters(EMPTY_FILTERS, "?industry=fa&niche=abayas").toString()).toBe("");
  });

  it("round-trips", () => {
    const filters: GalleryFilters = { industries: ["fa"], niche: "abayas", sort: "newest" };
    expect(parseGalleryFilters(writeGalleryFilters(filters), tabs)).toEqual(filters);
  });
});

describe("filter changes", () => {
  it("toggles industries in category order and clears the niche", () => {
    const withNiche: GalleryFilters = { industries: ["fa"], niche: "abayas", sort: "featured" };
    expect(toggleIndustry(withNiche, "el")).toEqual({ industries: ["fa", "el"], niche: null, sort: "featured" });
    expect(toggleIndustry(withNiche, "fa")).toEqual(EMPTY_FILTERS);
  });

  it("picks a niche with its industry", () => {
    expect(pickNiche({ ...EMPTY_FILTERS, industries: ["fa", "be"] }, tabs[1]!)).toEqual({ ...EMPTY_FILTERS, industries: ["be"], niche: "skincare" });
    expect(pickNiche({ ...EMPTY_FILTERS, industries: ["be"], niche: "skincare" }, null)).toEqual({ ...EMPTY_FILTERS, industries: ["be"] });
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sort: "name" })).toBe(false);
  });
});

describe("filterGalleryCards", () => {
  const ids = (filters: GalleryFilters) => filterGalleryCards(entries, tabs, filters, "en").map((card) => card.entry.id);

  it("lists everything with no filter, switched niches tagged", () => {
    const cards = filterGalleryCards(entries, tabs, EMPTY_FILTERS, "en");
    expect(cards.map((card) => card.entry.id)).toEqual(["classic", "hareer", "vella", "glow", "volt"]);
    expect(cards.find((card) => card.entry.id === "vella")).toMatchObject({ edition: "abayas", tag: "Abayas" });
  });

  it("joins industries in category order as each category tab listed them", () => {
    // fa: the switched niche's card (vella) first, then the rest.
    expect(ids({ ...EMPTY_FILTERS, industries: ["fa", "be"] })).toEqual(["vella", "hareer", "glow"]);
  });

  it("lists a niche's looks with its edition", () => {
    const cards = filterGalleryCards(entries, tabs, { ...EMPTY_FILTERS, industries: ["fa"], niche: "mixed" }, "en");
    expect(cards.map((card) => [card.entry.id, card.edition])).toEqual([
      ["hareer", "mixed"],
      ["vella", "mixed"],
    ]);
  });

  it("sorts by newest and by name", () => {
    expect(ids({ ...EMPTY_FILTERS, sort: "newest" })).toEqual(["vella", "volt", "hareer", "glow", "classic"]);
    expect(ids({ ...EMPTY_FILTERS, sort: "name" })).toEqual(["glow", "hareer", "classic", "vella", "volt"]);
  });
});

describe("options", () => {
  it("counts each industry with cards", () => {
    expect(industryOptions(entries, tabs)).toEqual([
      { code: "fa", count: 2 },
      { code: "el", count: 1 },
      { code: "be", count: 1 },
      { code: "ge", count: 1 },
    ]);
  });

  it("lists the niches of the picked industries", () => {
    expect(nicheOptions(tabs, []).map((option) => option.id)).toEqual(["abayas", "skincare", "mixed"]);
    expect(nicheOptions(tabs, ["be"])).toEqual([{ id: "skincare", name: "Skincare", category: "be", count: 1 }]);
  });
});
