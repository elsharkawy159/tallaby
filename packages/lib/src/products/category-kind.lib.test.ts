import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CATEGORY_KIND_MISMATCH,
  PRODUCT_KINDS,
  categoryMatchesProductType,
  filterCategoryTreeByKind,
  toProductKind,
} from "./category-kind.lib";

describe("category kind (F-108e)", () => {
  it("reads anything but digital as physical", () => {
    expect(PRODUCT_KINDS).toEqual(["physical", "digital"]);
    expect(toProductKind("digital")).toBe("digital");
    for (const value of ["physical", undefined, null, "", "DIGITAL", 1]) expect(toProductKind(value)).toBe("physical");
    expect(CATEGORY_KIND_MISMATCH).toBe("category_kind_mismatch");
  });

  it("matches a category to a product of its own type only", () => {
    expect(categoryMatchesProductType("physical", "physical")).toBe(true);
    expect(categoryMatchesProductType("digital", "digital")).toBe(true);
    expect(categoryMatchesProductType("digital", "physical")).toBe(false);
    expect(categoryMatchesProductType("physical", "digital")).toBe(false);
    // A category from before 0191 (no kind) is physical.
    expect(categoryMatchesProductType(undefined, undefined)).toBe(true);
    expect(categoryMatchesProductType(null, "digital")).toBe(false);
  });

  const tree = [
    { id: "fashion", productKind: "physical", categories: [{ id: "shirts", productKind: "physical", categories: [] }] },
    { id: "old" }, // no kind: physical
    {
      id: "digital",
      productKind: "digital",
      categories: [
        { id: "ebooks", productKind: "digital", categories: [{ id: "novels", productKind: "digital" }, { id: "stray", productKind: "physical" }] },
      ],
    },
  ];

  it("keeps only the branches of the product's type", () => {
    expect(filterCategoryTreeByKind(tree, "physical").map((n) => n.id)).toEqual(["fashion", "old"]);
    const digital = filterCategoryTreeByKind(tree, "digital");
    expect(digital.map((n) => n.id)).toEqual(["digital"]);
    // A child of the other kind is dropped too.
    expect(digital[0]!.categories![0]!.categories!.map((n) => n.id)).toEqual(["novels"]);
    expect(filterCategoryTreeByKind(tree, undefined)).toEqual(filterCategoryTreeByKind(tree, "physical"));
    // The input is left as it was.
    expect(tree[2]!.categories![0]!.categories).toHaveLength(2);
  });
});

describe("0191 digital category seed", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../db/migrations/0191_category_product_kind.sql", import.meta.url)), "utf8");
  const rows = [...sql.matchAll(/^\s*\((\d+), '([^']+)', (NULL|'[^']+'), (\d), '((?:[^']|'')+)', '((?:[^']|'')+)'\)[,;]/gm)].map((m) => ({
    slug: m[2]!,
    parent: m[3] === "NULL" ? null : m[3]!.slice(1, -1),
    level: Number(m[4]),
    name: m[5]!,
    nameAr: m[6]!,
  }));

  it("seeds a digital-only pack with unique digital- slugs", () => {
    expect(rows.length).toBeGreaterThan(60);
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^digital-[a-z0-9-]+$/);
  });

  it("has one root, and every other row's parent one level up, listed before it", () => {
    const bySlug = new Map(rows.map((r, index) => [r.slug, { ...r, index }]));
    expect(rows.filter((r) => r.parent === null).map((r) => r.slug)).toEqual(["digital-products"]);
    rows.forEach((row, index) => {
      if (row.parent === null) return expect(row.level).toBe(1);
      const parent = bySlug.get(row.parent);
      expect(parent, row.slug).toBeDefined();
      expect(parent!.level).toBe(row.level - 1);
      expect(parent!.index).toBeLessThan(index);
    });
  });

  it("names every row in both languages, with no Shopify", () => {
    for (const row of rows) {
      expect(row.name.trim()).not.toBe("");
      expect(row.nameAr).toMatch(/[؀-ۿ]/);
      expect(`${row.name} ${row.nameAr}`).not.toMatch(/shopify/i);
    }
    expect(rows.some((r) => r.slug === "digital-other" && /other/i.test(r.name))).toBe(true);
  });
});
