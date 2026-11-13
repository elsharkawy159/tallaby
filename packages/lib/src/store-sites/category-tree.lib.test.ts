import { describe, expect, it } from "vitest";
import { MAX_CATEGORY_DEPTH, categoryParentChain, categoryWithChildren, flattenCategoryTree, type CategoryTreeItem } from "./category-tree.lib";

const item = (id: string, position: number, parentId: string | null = null): CategoryTreeItem => ({ id, parentId, position });
const ids = (items: CategoryTreeItem[]) => items.map((i) => i.id);

describe("flattenCategoryTree", () => {
  it("is the position order when nothing has a parent (today's stores)", () => {
    const list = [item("c", 2), item("a", 0), item("b", 1)];
    expect(ids(flattenCategoryTree(list))).toEqual(["a", "b", "c"]);
  });

  it("puts each main category before its children, both by position", () => {
    const list = [
      item("finish", 1),
      item("rough", 0),
      item("wires", 5, "rough"),
      item("pipes", 3, "rough"),
      item("paint", 4, "finish"),
      item("lamps", 2),
    ];
    expect(ids(flattenCategoryTree(list))).toEqual(["rough", "pipes", "wires", "finish", "paint", "lamps"]);
  });

  it("keeps the input order on equal positions (stable)", () => {
    const list = [item("x", 0), item("y", 0), item("y2", 0, "y"), item("y1", 0, "y")];
    expect(ids(flattenCategoryTree(list))).toEqual(["x", "y", "y2", "y1"]);
  });

  it("treats a child whose parent is missing as a main category", () => {
    const list = [item("orphan", 1, "gone"), item("a", 0)];
    expect(ids(flattenCategoryTree(list))).toEqual(["a", "orphan"]);
  });

  it("never drops an item, even a third level or a self-parent", () => {
    const list = [item("a", 0), item("b", 1, "a"), item("c", 2, "b"), item("self", 3, "self")];
    const flat = flattenCategoryTree(list);
    expect(flat).toHaveLength(4);
    expect(ids(flat)).toEqual(["a", "b", "c", "self"]);
  });

  it("does not mutate its input", () => {
    const list = [item("b", 1), item("a", 0)];
    flattenCategoryTree(list);
    expect(ids(list)).toEqual(["b", "a"]);
  });
});

describe("categoryWithChildren", () => {
  const list = [item("rough", 0), item("wires", 2, "rough"), item("pipes", 1, "rough"), item("paint", 3)];

  it("is the category then its children in tree order", () => {
    expect(categoryWithChildren("rough", list)).toEqual(["rough", "pipes", "wires"]);
  });

  it("is just the id for a child, a childless category or an unknown id", () => {
    expect(categoryWithChildren("wires", list)).toEqual(["wires"]);
    expect(categoryWithChildren("paint", list)).toEqual(["paint"]);
    expect(categoryWithChildren("nope", list)).toEqual(["nope"]);
  });
});

describe("categoryParentChain", () => {
  const list = [item("rough", 0), item("wires", 1, "rough"), item("orphan", 2, "gone")];

  it("is [id, parentId] for a sub-category and [id] otherwise", () => {
    expect(categoryParentChain("wires", list)).toEqual(["wires", "rough"]);
    expect(categoryParentChain("rough", list)).toEqual(["rough"]);
    expect(categoryParentChain("orphan", list)).toEqual(["orphan"]);
    expect(categoryParentChain("nope", list)).toEqual(["nope"]);
  });

  it("two levels", () => {
    expect(MAX_CATEGORY_DEPTH).toBe(2);
  });
});
