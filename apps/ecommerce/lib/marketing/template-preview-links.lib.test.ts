import { describe, expect, it } from "vitest";
import { PREVIEW_CATALOG_SLUG, previewLinkTarget, withPreviewParams } from "./template-preview-links.lib";

const opts = { pageSlugs: new Set(["about", "contact", "product"]), productPageSlug: "product" };

describe("previewLinkTarget", () => {
  it("keeps home and the template's own pages", () => {
    expect(previewLinkTarget("/", opts)).toEqual({ params: {} });
    expect(previewLinkTarget("/about", opts)).toEqual({ slug: "about", params: {} });
  });

  it("opens the product page with the product clicked", () => {
    expect(previewLinkTarget("/products/black-skinny-jeans", opts)).toEqual({ slug: "product", params: { product: "black-skinny-jeans" } });
    expect(previewLinkTarget("/product", opts)).toEqual({ slug: "product", params: {} });
  });

  it("opens the catalog for all products, a category or a search", () => {
    expect(previewLinkTarget("/products", opts)).toEqual({ slug: PREVIEW_CATALOG_SLUG, params: {} });
    expect(previewLinkTarget("/products?category=c-jeans", opts)).toEqual({ slug: PREVIEW_CATALOG_SLUG, params: { category: "c-jeans" } });
    expect(previewLinkTarget(`/products?search=${encodeURIComponent("كلبس")}`, opts)).toEqual({ slug: PREVIEW_CATALOG_SLUG, params: { search: "كلبس" } });
  });

  it("leaves cart, account, anchors and other sites alone", () => {
    for (const href of ["/cart", "/account", "#", "https://instagram.com/x", "//evil.test", "/products/a/b"]) expect(previewLinkTarget(href, opts), href).toBeNull();
  });

  it("has no product page to open without one", () => {
    expect(previewLinkTarget("/products/x", { ...opts, productPageSlug: null })).toBeNull();
  });
});

describe("withPreviewParams", () => {
  it("adds after the edition, or as the first parameter", () => {
    expect(withPreviewParams("/template-preview/zay/product?edition=menswear", { product: "a b" })).toBe("/template-preview/zay/product?edition=menswear&product=a%20b");
    expect(withPreviewParams("/template-preview/zay/products", { category: "c1" })).toBe("/template-preview/zay/products?category=c1");
    expect(withPreviewParams("/template-preview/zay", {})).toBe("/template-preview/zay");
  });
});
