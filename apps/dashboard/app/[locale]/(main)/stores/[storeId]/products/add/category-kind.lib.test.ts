import { describe, expect, it } from "vitest";
import { filterCategoryTreeByKind } from "@workspace/lib/products/category-kind";
import { flattenCategoryTree, suggestCategories } from "./add-product.lib";
import { categoryAfterKindChange } from "./category-kind.lib";
import { indexTallabyCategories, searchCategoryChoices } from "./category-search.lib";
import type { CategoryOption } from "./add-product.schema";

type Node = CategoryOption & { categories?: Node[] };

const node = (id: string, name: string, nameAr: string, level: number, productKind: string | undefined, categories: Node[] = []): Node => ({
  id,
  name,
  nameAr,
  slug: id,
  level,
  productKind,
  categories,
});

// A physical department (one row from before 0191 has no kind) and the digital pack.
const tree: Node[] = [
  node("books", "Books", "كتب", 1, "physical", [node("novels-print", "Novels", "روايات", 2, "physical"), node("other", "Other", "أخرى", 2, undefined)]),
  node("home", "Home", "المنزل", 1, "physical", [node("mugs", "Mugs", "أكواب", 2, "physical")]),
  node("digital-products", "Digital products", "منتجات رقمية", 1, "digital", [
    node("digital-ebooks", "E-books & guides", "كتب إلكترونية وأدلة", 2, "digital", [
      node("digital-ebooks-novels", "Novels & stories", "روايات وقصص", 3, "digital"),
    ]),
    node("digital-cutting-files", "Cutting & CNC files", "ملفات القص وCNC", 2, "digital", [
      node("digital-cutting-laser", "Laser cutting files (DXF, SVG)", "ملفات قص ليزر (DXF وSVG)", 3, "digital"),
    ]),
    node("digital-other", "Other digital files", "ملفات رقمية أخرى", 2, "digital"),
  ]),
];

const ids = (t: Node[]) => flattenCategoryTree(t).map((e) => e.category.id);

describe("category picker by product type (F-108e)", () => {
  const physical = filterCategoryTreeByKind(tree, "physical");
  const digital = filterCategoryTreeByKind(tree, "digital");

  it("a physical product never sees a digital category, and a digital one never a physical one", () => {
    expect(ids(physical).every((id) => !id.startsWith("digital-"))).toBe(true);
    expect(ids(physical)).toContain("other");
    expect(ids(digital).every((id) => id.startsWith("digital-"))).toBe(true);
  });

  it("search and suggestions follow the type", () => {
    const search = (t: Node[], query: string) =>
      searchCategoryChoices({ query, store: [], tallaby: indexTallabyCategories(t, "en"), suggested: [], locale: "en", allowNew: false })
        .filter((row) => row.kind === "tallaby")
        .map((row) => (row.kind === "tallaby" ? row.entry.category.id : ""));
    expect(search(physical, "novels")).toEqual(["novels-print"]);
    expect(search(digital, "novels")).toEqual(["digital-ebooks-novels"]);
    expect(suggestCategories(physical, { titles: ["Laser cutting files"] }).map((m) => m.category.id)).toEqual([]);
    expect(suggestCategories(digital, { titles: ["Laser cutting files"] })[0]?.category.id).toBe("digital-cutting-laser");
  });

  it("browsing the digital tree lists its main categories, not the one root", () => {
    const rows = searchCategoryChoices({ query: "", store: [], tallaby: indexTallabyCategories(digital, "en"), suggested: [], locale: "en", allowNew: false });
    expect(rows.map((row) => (row.kind === "tallaby" ? row.entry.category.id : ""))).toEqual([
      "digital-ebooks",
      "digital-cutting-files",
      "digital-other",
    ]);
    const physicalRows = searchCategoryChoices({ query: "", store: [], tallaby: indexTallabyCategories(physical, "en"), suggested: [], locale: "en", allowNew: false });
    expect(physicalRows.map((row) => (row.kind === "tallaby" ? row.entry.category.id : ""))).toEqual(["books", "home"]);
  });
});

describe("categoryAfterKindChange", () => {
  const allIds = new Set(ids(tree));
  const base = { allIds, storeCategoryName: null, titles: [], locale: "en" };

  it("keeps an empty, unknown or matching category", () => {
    const digital = filterCategoryTreeByKind(tree, "digital");
    expect(categoryAfterKindChange({ ...base, categoryId: "", kindTree: digital })).toBeUndefined();
    expect(categoryAfterKindChange({ ...base, categoryId: "gone", kindTree: digital })).toBeUndefined();
    expect(categoryAfterKindChange({ ...base, categoryId: "digital-other", kindTree: digital })).toBeUndefined();
  });

  it("clears a Tallaby category of the other kind", () => {
    expect(categoryAfterKindChange({ ...base, categoryId: "mugs", kindTree: filterCategoryTreeByKind(tree, "digital") })).toBeNull();
    expect(categoryAfterKindChange({ ...base, categoryId: "digital-ebooks-novels", kindTree: filterCategoryTreeByKind(tree, "physical") })).toBeNull();
  });

  it("matches the Tallaby category behind a store category again, else the catch-all", () => {
    const digital = filterCategoryTreeByKind(tree, "digital");
    expect(categoryAfterKindChange({ ...base, categoryId: "novels-print", kindTree: digital, storeCategoryName: "Novels" })).toBe("digital-ebooks-novels");
    expect(categoryAfterKindChange({ ...base, categoryId: "mugs", kindTree: digital, storeCategoryName: "Gifts" })).toBe("digital-other");
  });
});
