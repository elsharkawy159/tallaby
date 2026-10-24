import { describe, expect, it } from "vitest";
import { pageTemplates, parseTemplatesCategory, parseTemplatesPage, sortByIndustry } from "./templates.lib";

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
