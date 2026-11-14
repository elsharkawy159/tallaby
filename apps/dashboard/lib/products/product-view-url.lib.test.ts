import { describe, expect, it } from "vitest";
import { isStoreSiteLive, productPageUrl, productViewUrl } from "./product-view-url.lib";

const live = { storeBaseUrl: "https://faster.tallaby.com", siteLive: true };

describe("productPageUrl", () => {
  it("puts the slug under /products, encoded", () => {
    expect(productPageUrl("https://faster-eg.com", "red shirt")).toBe("https://faster-eg.com/products/red%20shirt");
  });
});

describe("isStoreSiteLive", () => {
  it("needs an active store with a published site", () => {
    expect(isStoreSiteLive({ status: "active", siteStatus: "published" })).toBe(true);
    expect(isStoreSiteLive({ status: "active", siteStatus: "draft" })).toBe(false);
    expect(isStoreSiteLive({ status: "active", siteStatus: "unpublished" })).toBe(false);
    expect(isStoreSiteLive({ status: "suspended", siteStatus: "published" })).toBe(false);
    expect(isStoreSiteLive({ status: "archived", siteStatus: "published" })).toBe(false);
    expect(isStoreSiteLive({ status: null, siteStatus: null })).toBe(false);
  });
});

describe("productViewUrl", () => {
  it("links an active product on a live store", () => {
    expect(productViewUrl({ status: "active", slug: " red-shirt ", target: live })).toBe(
      "https://faster.tallaby.com/products/red-shirt",
    );
  });

  it("gives no link for a product a visitor can't open", () => {
    for (const status of ["draft", "pending", "rejected", null, undefined]) {
      expect(productViewUrl({ status, slug: "red-shirt", target: live })).toBeNull();
    }
  });

  it("gives no link without a slug or a live store", () => {
    expect(productViewUrl({ status: "active", slug: "  ", target: live })).toBeNull();
    expect(productViewUrl({ status: "active", slug: null, target: live })).toBeNull();
    expect(productViewUrl({ status: "active", slug: "red-shirt", target: { ...live, siteLive: false } })).toBeNull();
    expect(productViewUrl({ status: "active", slug: "red-shirt", target: null })).toBeNull();
  });
});
