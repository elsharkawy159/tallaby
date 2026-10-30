import { describe, expect, it } from "vitest";
import { builderCategorySortBy, storefrontSortBy } from "./featured-sort.lib";

const CAT = "11111111-1111-4111-8111-111111111111";

describe("storefrontSortBy", () => {
  it("opens a seller category on its manual order, everything else on most popular", () => {
    expect(storefrontSortBy(undefined, CAT)).toBe("featured");
    expect(storefrontSortBy("", CAT)).toBe("featured");
    expect(storefrontSortBy(undefined, null)).toBe("popular");
    expect(storefrontSortBy(undefined, undefined)).toBe("popular");
  });

  it("keeps every sort the shopper picks", () => {
    expect(storefrontSortBy("price-low", CAT)).toBe("price_asc");
    expect(storefrontSortBy("price-high", CAT)).toBe("price_desc");
    expect(storefrontSortBy("rating", CAT)).toBe("rating");
    expect(storefrontSortBy("newest", CAT)).toBe("newest");
    expect(storefrontSortBy("popularity", CAT)).toBe("popular");
  });

  it("treats Featured outside a seller category as newest, and an unknown sort as the default", () => {
    expect(storefrontSortBy("featured", CAT)).toBe("featured");
    expect(storefrontSortBy("featured", null)).toBe("newest");
    expect(storefrontSortBy("bogus", CAT)).toBe("featured");
    expect(storefrontSortBy("bogus", null)).toBe("popular");
  });
});

describe("builderCategorySortBy", () => {
  it("uses the manual order only for a category list on its default sort", () => {
    expect(builderCategorySortBy("category", undefined, undefined)).toBe("featured");
    expect(builderCategorySortBy("category", "default", undefined)).toBe("featured");
    expect(builderCategorySortBy("category", "price-asc", "price_asc")).toBe("price_asc");
    expect(builderCategorySortBy("featured", undefined, undefined)).toBeUndefined();
    expect(builderCategorySortBy("discounted", "default", undefined)).toBeUndefined();
    expect(builderCategorySortBy("selected", undefined, undefined)).toBeUndefined();
  });
});
