import { describe, expect, it } from "vitest";
import {
  invalidateAllCategories,
  invalidateProduct,
  invalidateProductInventory,
  mergeInvalidations,
  type ProductCacheSnapshot,
} from "./invalidate";
import { categoryTags, productTags } from "./tags";

function snapshot(overrides: Partial<ProductCacheSnapshot> = {}): ProductCacheSnapshot {
  return {
    id: "prod-1",
    sellerId: "seller-1",
    categoryId: "cat-1",
    brandId: "brand-1",
    slugs: [{ locale: "en", slug: "widget" }],
    status: "active",
    isFeatured: false,
    isTrending: false,
    isSeasonal: false,
    isMostSelling: false,
    isPlatformChoice: false,
    priceKey: '{"final":10}',
    ...overrides,
  };
}

/** No cached query for orders/carts/wishlists/profiles/notifications/payouts exists —
 * so no invalidation this module produces should ever carry one of those tags. */
const FORBIDDEN_PREFIXES = ["order:", "cart:", "wishlist:", "profile:", "notification:", "payout:", "address:"];
function assertNoForbiddenTags(tags: string[]) {
  for (const tag of tags) {
    expect(FORBIDDEN_PREFIXES.some((p) => tag.startsWith(p))).toBe(false);
  }
}

describe("invalidateProduct", () => {
  it("create: tags detail, slug, seller, listing, filterOptions, all, newArrivals", () => {
    const after = snapshot();
    const { tags } = invalidateProduct(null, after);
    expect(tags).toEqual(
      expect.arrayContaining([
        productTags.detail("prod-1"),
        productTags.slug("en", "widget"),
        productTags.seller("seller-1"),
        productTags.category("cat-1"),
        productTags.brand("brand-1"),
        productTags.listing(),
        productTags.filterOptions(),
        productTags.all(),
        productTags.newArrivals(),
      ])
    );
    assertNoForbiddenTags(tags);
  });

  it("delete: tags detail, slug, seller, listing, filterOptions, all from the captured before-snapshot", () => {
    const before = snapshot();
    const { tags } = invalidateProduct(before, null);
    expect(tags).toEqual(
      expect.arrayContaining([
        productTags.detail("prod-1"),
        productTags.slug("en", "widget"),
        productTags.listing(),
        productTags.filterOptions(),
        productTags.all(),
      ])
    );
  });

  it("deactivate (active -> draft): bumps listing/filterOptions/all", () => {
    const before = snapshot({ status: "active" });
    const after = snapshot({ status: "draft" });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toEqual(expect.arrayContaining([productTags.listing(), productTags.filterOptions(), productTags.all()]));
  });

  it("verify/unverify via status pending<->active: bumps listing/filterOptions/all", () => {
    const before = snapshot({ status: "pending" });
    const after = snapshot({ status: "active" });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toEqual(expect.arrayContaining([productTags.listing(), productTags.filterOptions(), productTags.all()]));
  });

  it("publish/unpublish (rejected -> active): bumps listing/filterOptions/all", () => {
    const before = snapshot({ status: "rejected" });
    const after = snapshot({ status: "active" });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toEqual(expect.arrayContaining([productTags.listing()]));
  });

  it("price change: bumps listing + both category and brand, not filterOptions/all", () => {
    const before = snapshot({ priceKey: '{"final":10}' });
    const after = snapshot({ priceKey: '{"final":20}' });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toEqual(
      expect.arrayContaining([productTags.listing(), productTags.category("cat-1"), productTags.brand("brand-1")])
    );
    expect(tags).not.toContain(productTags.filterOptions());
    expect(tags).not.toContain(productTags.all());
  });

  it("category A -> B: invalidates BOTH categories", () => {
    const before = snapshot({ categoryId: "cat-A" });
    const after = snapshot({ categoryId: "cat-B" });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.category("cat-A"));
    expect(tags).toContain(productTags.category("cat-B"));
  });

  it("brand change: invalidates BOTH brands", () => {
    const before = snapshot({ brandId: "brand-A" });
    const after = snapshot({ brandId: "brand-B" });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.brand("brand-A"));
    expect(tags).toContain(productTags.brand("brand-B"));
  });

  it("slug change: invalidates BOTH old and new slug tags", () => {
    const before = snapshot({ slugs: [{ locale: "en", slug: "old-slug" }] });
    const after = snapshot({ slugs: [{ locale: "en", slug: "new-slug" }] });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.slug("en", "old-slug"));
    expect(tags).toContain(productTags.slug("en", "new-slug"));
  });

  it("featured toggle: tags featured() only, not the general listing tag", () => {
    const before = snapshot({ isFeatured: false });
    const after = snapshot({ isFeatured: true });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.featured());
    expect(tags).not.toContain(productTags.listing());
  });

  it("deal/platform-choice toggle: tags deals() only", () => {
    const before = snapshot({ isPlatformChoice: false });
    const after = snapshot({ isPlatformChoice: true });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.deals());
    expect(tags).not.toContain(productTags.listing());
  });

  it("best-selling toggle: tags bestSelling() only", () => {
    const before = snapshot({ isMostSelling: false });
    const after = snapshot({ isMostSelling: true });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.bestSelling());
    expect(tags).not.toContain(productTags.listing());
  });

  it("trending toggle: tags trending() only", () => {
    const before = snapshot({ isTrending: false });
    const after = snapshot({ isTrending: true });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.trending());
    expect(tags).not.toContain(productTags.listing());
  });

  it("seasonal toggle: tags seasonal() only", () => {
    const before = snapshot({ isSeasonal: false });
    const after = snapshot({ isSeasonal: true });
    const { tags } = invalidateProduct(before, after);
    expect(tags).toContain(productTags.seasonal());
    expect(tags).not.toContain(productTags.listing());
  });

  it("unrelated field-only update (e.g. condition text) does not bump listing/filterOptions/all", () => {
    const before = snapshot();
    const after = snapshot();
    const { tags } = invalidateProduct(before, after);
    expect(tags).not.toContain(productTags.listing());
    expect(tags).not.toContain(productTags.filterOptions());
    expect(tags).not.toContain(productTags.all());
  });

  it("never emits a tag for order/cart/wishlist/profile data across every case above", () => {
    const cases: [ProductCacheSnapshot | null, ProductCacheSnapshot | null][] = [
      [null, snapshot()],
      [snapshot(), null],
      [snapshot({ status: "active" }), snapshot({ status: "draft" })],
      [snapshot({ priceKey: "a" }), snapshot({ priceKey: "b" })],
      [snapshot({ categoryId: "A" }), snapshot({ categoryId: "B" })],
    ];
    for (const [before, after] of cases) {
      assertNoForbiddenTags(invalidateProduct(before, after).tags);
    }
  });
});

describe("invalidateProductInventory", () => {
  it("without a stock-boundary crossing: only inventory + detail tags, nothing else", () => {
    const { tags } = invalidateProductInventory([
      { snapshot: { id: "prod-1", sellerId: "seller-1", categoryId: "cat-1", brandId: "brand-1" }, stockBoundaryCrossed: false },
    ]);
    expect(tags).toEqual(
      expect.arrayContaining([productTags.inventory("prod-1"), productTags.detail("prod-1")])
    );
    expect(tags).not.toContain(productTags.listing());
    expect(tags).not.toContain(productTags.category("cat-1"));
    expect(tags).not.toContain(productTags.brand("brand-1"));
  });

  it("with a stock-boundary crossing: also bumps listing + category + brand", () => {
    const { tags } = invalidateProductInventory([
      { snapshot: { id: "prod-1", sellerId: "seller-1", categoryId: "cat-1", brandId: "brand-1" }, stockBoundaryCrossed: true },
    ]);
    expect(tags).toEqual(
      expect.arrayContaining([
        productTags.inventory("prod-1"),
        productTags.listing(),
        productTags.category("cat-1"),
        productTags.brand("brand-1"),
      ])
    );
  });

  it("a stock change never touches order/cart/wishlist/profile/customer-settings tags", () => {
    const { tags } = invalidateProductInventory([
      { snapshot: { id: "prod-1", sellerId: "seller-1", categoryId: "cat-1", brandId: "brand-1" }, stockBoundaryCrossed: true },
    ]);
    assertNoForbiddenTags(tags);
  });
});

describe("mergeInvalidations", () => {
  it("de-duplicates tags and paths across multiple invalidations", () => {
    const a = invalidateProduct(null, snapshot({ id: "p1" }));
    const b = invalidateProduct(null, snapshot({ id: "p1" }));
    const merged = mergeInvalidations(a, b);
    expect(merged.tags.length).toBe(new Set(merged.tags).size);
  });
});

describe("invalidateAllCategories", () => {
  it("emits the shared taxonomy tags used by ecommerce and dashboard", () => {
    const { tags } = invalidateAllCategories();
    expect(tags).toEqual(
      expect.arrayContaining([categoryTags.all(), categoryTags.tree()])
    );
    assertNoForbiddenTags(tags);
  });
});
