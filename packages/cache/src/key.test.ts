import { describe, expect, it } from "vitest";
import { stableKey } from "./key";

describe("stableKey", () => {
  it("is independent of object property order", () => {
    const a = stableKey({ category: "x", brand: "y", page: 1 });
    const b = stableKey({ brand: "y", page: 1, category: "x" });
    expect(a).toBe(b);
  });

  it("treats an explicit undefined the same as an absent key", () => {
    const withUndefined = stableKey({ a: 1, b: undefined });
    const withoutKey = stableKey({ a: 1 });
    expect(withUndefined).toBe(withoutKey);
  });

  it("preserves nested object and array structure order-independently", () => {
    const a = stableKey({
      filters: { category: "x", tags: ["b", "a"] },
      sort: "newest",
    });
    const b = stableKey({
      sort: "newest",
      filters: { tags: ["b", "a"], category: "x" },
    });
    expect(a).toBe(b);
  });

  it("does NOT collide different array orderings (arrays are ordered data)", () => {
    const a = stableKey({ tags: ["a", "b"] });
    const b = stableKey({ tags: ["b", "a"] });
    expect(a).not.toBe(b);
  });

  it("does not collide distinct filter sets", () => {
    const a = stableKey({ categoryId: "cat-1", page: 1 });
    const b = stableKey({ categoryId: "cat-2", page: 1 });
    expect(a).not.toBe(b);
  });

  it("distinguishes multiple positional arguments", () => {
    const a = stableKey("en", "shoes");
    const b = stableKey("ar", "shoes");
    expect(a).not.toBe(b);
  });

  it("serializes Date values deterministically", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    expect(stableKey({ since: d })).toBe(stableKey({ since: d }));
  });
});
