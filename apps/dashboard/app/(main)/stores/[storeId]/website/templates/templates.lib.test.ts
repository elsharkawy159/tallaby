import { describe, expect, it } from "vitest";
import { categoryOrder, pageTemplates, parseTemplatesCategory, parseTemplatesPage, sortByIndustry } from "./templates.lib";

const rows = [
  { key: "classic", category: "general" },
  { key: "mode", category: "fashion" },
  { key: "techhub", category: "electronics" },
  { key: "kasr", category: "fashion" },
  { key: "volt", category: "electronics" },
];

describe("sortByIndustry", () => {
  it("puts the industry's templates first and keeps each group's order", () => {
    expect(sortByIndustry(rows, "electronics").map((r) => r.key)).toEqual(["techhub", "volt", "classic", "mode", "kasr"]);
  });

  it("keeps the order when the store has no industry or none of its templates", () => {
    expect(sortByIndustry(rows, null).map((r) => r.key)).toEqual(rows.map((r) => r.key));
    expect(sortByIndustry(rows, "pets").map((r) => r.key)).toEqual(rows.map((r) => r.key));
  });
});

describe("pageTemplates", () => {
  it("sorts by industry, then pages, and lists every category", () => {
    const first = pageTemplates(rows, { page: 1, category: "all", industryId: "electronics", pageSize: 2 });
    expect(first.items.map((r) => r.key)).toEqual(["techhub", "volt"]);
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 5, categories: ["electronics", "general", "fashion"] });
    expect(pageTemplates(rows, { page: 3, category: "all", industryId: "electronics", pageSize: 2 }).items.map((r) => r.key)).toEqual(["kasr"]);
  });

  it("filters by category before paging", () => {
    const fashion = pageTemplates(rows, { page: 1, category: "fashion", pageSize: 1 });
    expect(fashion.items.map((r) => r.key)).toEqual(["mode"]);
    expect(fashion).toMatchObject({ pageCount: 2, total: 2 });
    expect(fashion.categories).toEqual(["general", "fashion", "electronics"]);
  });

  it("clamps the page to the last one and handles an empty filter", () => {
    expect(pageTemplates(rows, { page: 9, category: "all", pageSize: 2 })).toMatchObject({ page: 3, pageCount: 3 });
    expect(pageTemplates(rows, { page: 2, category: "pets", pageSize: 2 })).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});

describe("URL parsing", () => {
  it("reads ?page= as a 1-based page", () => {
    expect(parseTemplatesPage("3")).toBe(3);
    for (const value of [null, "", "0", "-1", "1.5", "abc", "1e400"]) expect(parseTemplatesPage(value)).toBe(1);
  });

  it("reads ?category= as an id or all", () => {
    expect(parseTemplatesCategory("fashion")).toBe("fashion");
    for (const value of [null, "", "<script>", "a".repeat(65)]) expect(parseTemplatesCategory(value)).toBe("all");
  });
});

describe("sortByIndustry with a store seed", () => {
  const many = [
    { key: "classic", category: "general" },
    ...["a", "b", "c", "d", "e", "f"].map((k) => ({ key: `fashion-${k}`, category: "fashion" })),
    ...["a", "b", "c"].map((k) => ({ key: `jewel-${k}`, category: "jewelry" })),
    ...["a", "b", "c"].map((k) => ({ key: `tech-${k}`, category: "electronics" })),
  ];

  it("puts the store's industry, then related industries, first", () => {
    const sorted = sortByIndustry(many, "fashion", "store-1");
    expect(sorted.slice(0, 6).every((r) => r.category === "fashion")).toBe(true);
    expect(sorted.slice(6, 9).every((r) => r.category === "jewelry")).toBe(true);
    expect(categoryOrder(many.map((r) => r.category), "fashion")).toEqual(["fashion", "jewelry", "general", "electronics"]);
  });

  it("is stable for one store and keeps every template", () => {
    const a = sortByIndustry(many, "fashion", "store-1").map((r) => r.key);
    expect(sortByIndustry(many, "fashion", "store-1").map((r) => r.key)).toEqual(a);
    expect([...a].sort()).toEqual(many.map((r) => r.key).sort());
  });

  it("gives different stores different orders inside a category", () => {
    const firsts = new Set(Array.from({ length: 20 }, (_, i) => sortByIndustry(many, "fashion", `store-${i}`)[0]!.key));
    expect(firsts.size).toBeGreaterThan(2);
  });

  it("pages without repeats", () => {
    const seen = [1, 2, 3, 4].flatMap((page) => pageTemplates(many, { page, category: "all", industryId: "fashion", seed: "s", pageSize: 4 }).items.map((r) => r.key));
    expect(new Set(seen).size).toBe(many.length);
  });
});
