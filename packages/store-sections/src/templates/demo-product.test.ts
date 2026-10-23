import { describe, expect, it } from "vitest";
import { DEMO_PRODUCT } from "../core/demo-product";
import { getCodeTemplate } from "./catalog";
import { templateDemoProduct } from "./demo-product";
import type { TemplateDemo } from "./types";

describe("templateDemoProduct", () => {
  it("builds the product from the template's own demo catalog", () => {
    const demo = getCodeTemplate("mode")!.demo;
    const first = demo.products.find((p) => p.image)!;
    const product = templateDemoProduct(demo, { locale: "en" });
    expect(product.title).toBe(first.title.en);
    expect(product.title).not.toBe(DEMO_PRODUCT.title);
    expect(product.slug).toBe(first.slug);
    expect(product.image).toBe(first.image);
    expect(product.images[0]).toBe(first.image);
    expect(product.images.length).toBeGreaterThan(1);
    expect(product.images.length).toBeLessThanOrEqual(3);
    expect(new Set(product.images).size).toBe(product.images.length);
    expect(product.price).toBe(first.price);
    expect(product.seller.name).toBe(demo.store.name.en);
    expect(product.variants).toEqual([]);
  });

  it("uses the given store name and the Arabic copy by default", () => {
    const demo = getCodeTemplate("mode")!.demo;
    const product = templateDemoProduct(demo, { storeName: "My shop" });
    expect(product.seller.name).toBe("My shop");
    expect(product.title).toBe((demo.products.find((p) => p.image) ?? demo.products[0]!).title.ar);
  });

  it("derives the discount from the compare-at price", () => {
    const demo: TemplateDemo = {
      store: { name: { ar: "م", en: "S" }, description: { ar: "", en: "" } },
      categories: [],
      products: [
        { id: "p1", title: { ar: "أ", en: "A" }, slug: "a", image: "x.jpg", price: 75, compareAtPrice: 100, isFeatured: true, categoryId: "c", inStock: true, createdAt: "2026-01-01", rating: 4.5, sold90: 0, sold14: 0 },
      ],
    };
    const product = templateDemoProduct(demo);
    expect(product.discountPercent).toBe(25);
    expect(product.compareAtPrice).toBe(100);
    expect(product.images).toEqual(["x.jpg"]);
  });

  it("falls back to the generic demo product for an empty catalog", () => {
    const product = templateDemoProduct({ store: { name: { ar: "م", en: "S" }, description: { ar: "", en: "" } }, categories: [], products: [] });
    expect(product.title).toBe(DEMO_PRODUCT.title);
    expect(product.seller.name).toBe("م");
  });
});
