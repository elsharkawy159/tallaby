import { describe, expect, it } from "vitest";
import { shapeStoreCategoryGroups, type CategoryGroupRow } from "./category-groups.lib";

const NO_PARENT = {
  parentId: null,
  parentSourceCategoryId: null,
  parentName: null,
  parentNameAr: null,
  parentImage: null,
  parentPosition: null,
  parentCreatedAt: null,
};

const row = (id: string, position: number, products: string[], extra: Partial<CategoryGroupRow> = {}): CategoryGroupRow => ({
  key: id,
  sellerCategoryId: id,
  sourceCategoryId: null,
  name: id,
  nameAr: null,
  productCount: products.length,
  categoryIds: products.map((p) => `t-${p}`),
  productIds: products,
  ownImage: null,
  productImage: products.length ? `${id}.jpg` : null,
  position,
  createdAt: position,
  bestRating: null,
  bestCreatedAt: null,
  ...NO_PARENT,
  ...extra,
});

const root = (key: string, products: string[]): CategoryGroupRow => ({
  ...row(key, 0, products),
  sellerCategoryId: null,
  position: null,
  createdAt: null,
});

const keys = (groups: { key: string }[]) => groups.map((g) => g.key);

describe("shapeStoreCategoryGroups", () => {
  it("returns a store with no main categories as the SQL gave it, with empty tree fields", () => {
    const rows = [row("b", 0, ["p1"]), row("a", 1, ["p2", "p3"]), root("home", ["p4"])];
    const groups = shapeStoreCategoryGroups(rows);
    expect(keys(groups)).toEqual(["b", "a", "home"]);
    expect(groups.every((g) => g.parentKey === null && g.childKeys.length === 0)).toBe(true);
    expect(groups[1]).toEqual({
      key: "a",
      sellerCategoryId: "a",
      sourceCategoryId: null,
      name: "a",
      nameAr: null,
      productCount: 2,
      categoryIds: ["t-p2", "t-p3"],
      productIds: ["p2", "p3"],
      ownImage: null,
      productImage: "a.jpg",
      parentKey: null,
      childKeys: [],
    });
  });

  it("orders seller categories as a tree, then the Tallaby roots", () => {
    const rows = [
      row("lamps", 0, ["p1"]),
      row("rough", 1, ["p2"]),
      row("wires", 3, ["p3"], { parentId: "rough" }),
      row("pipes", 2, ["p4"], { parentId: "rough" }),
      root("home", ["p5"]),
    ];
    const groups = shapeStoreCategoryGroups(rows);
    expect(keys(groups)).toEqual(["lamps", "rough", "pipes", "wires", "home"]);
    const rough = groups.find((g) => g.key === "rough")!;
    expect(rough.childKeys).toEqual(["pipes", "wires"]);
    expect(rough.parentKey).toBeNull();
    expect(groups.find((g) => g.key === "wires")!.parentKey).toBe("rough");
  });

  it("rolls a main category's counts, products and Tallaby ids up from its sub-categories", () => {
    const rows = [row("rough", 0, ["p1"]), row("wires", 1, ["p2", "p3"], { parentId: "rough" })];
    const [rough, wires] = shapeStoreCategoryGroups(rows);
    expect(rough!.productCount).toBe(3);
    expect(rough!.productIds).toEqual(["p1", "p2", "p3"]);
    expect(rough!.categoryIds).toEqual(["t-p1", "t-p2", "t-p3"]);
    // The sub-category keeps only its own.
    expect(wires!.productIds).toEqual(["p2", "p3"]);
    // A product → group map built in list order ends on the product's own category.
    const groupOf = new Map([rough!, wires!].flatMap((g) => g.productIds.map((id) => [id, g.key] as const)));
    expect(groupOf.get("p2")).toBe("wires");
    expect(groupOf.get("p1")).toBe("rough");
  });

  it("keeps a main category whose products all sit in its sub-categories, in its own position", () => {
    const rows = [
      row("lamps", 0, ["p1"]),
      row("wires", 5, ["p2"], {
        parentId: "rough",
        parentName: "Rough-in",
        parentNameAr: "تأسيس",
        parentImage: " rough.jpg ",
        parentPosition: 1,
        parentCreatedAt: 1,
        parentSourceCategoryId: "t-root",
      }),
      row("switches", 6, ["p3"], { parentId: "finish", parentName: "Finishing", parentPosition: 2, parentCreatedAt: 2 }),
    ];
    const groups = shapeStoreCategoryGroups(rows);
    expect(keys(groups)).toEqual(["lamps", "rough", "wires", "finish", "switches"]);
    const rough = groups[1]!;
    expect(rough).toMatchObject({
      key: "rough",
      sellerCategoryId: "rough",
      sourceCategoryId: "t-root",
      name: "Rough-in",
      nameAr: "تأسيس",
      productCount: 1,
      productIds: ["p2"],
      ownImage: "rough.jpg",
      productImage: "wires.jpg",
      parentKey: null,
      childKeys: ["wires"],
    });
  });

  it("takes the best-rated product photo of the main category and its sub-categories", () => {
    const rows = [
      row("rough", 0, ["p1"], { bestRating: "3.5", bestCreatedAt: 10 }),
      row("wires", 1, ["p2"], { parentId: "rough", bestRating: "4.8", bestCreatedAt: 5 }),
      row("pipes", 2, ["p3"], { parentId: "rough", bestRating: null, bestCreatedAt: 50 }),
    ];
    expect(shapeStoreCategoryGroups(rows)[0]!.productImage).toBe("wires.jpg");
  });

  it("shows a sub-category whose main category is not known as a main category", () => {
    const groups = shapeStoreCategoryGroups([row("a", 0, ["p1"]), row("orphan", 1, ["p2"], { parentId: "gone" })]);
    expect(keys(groups)).toEqual(["a", "orphan"]);
    expect(groups[1]!.parentKey).toBeNull();
  });
});
