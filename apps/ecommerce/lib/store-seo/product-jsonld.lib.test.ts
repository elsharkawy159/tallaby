import { describe, expect, it } from "vitest";
import type { Product } from "@/components/product-page/product-page.types";
import { productBreadcrumb, productInStock, productJsonLdInput } from "./product-jsonld.lib";

const product = (over: Record<string, unknown> = {}) =>
  ({
    id: "p1",
    title: "Mug",
    slug: "mug",
    description: "A mug",
    status: "active",
    trackStock: true,
    quantity: 3,
    price: { final: 80, list: 100 },
    images: ["a.jpg"],
    brand: null,
    category: { id: "c1", name: "Kitchen", nameAr: "مطبخ", slug: "kitchen" },
    productVariants: [],
    reviews: [],
    ...over,
  }) as unknown as Product;

describe("productInStock", () => {
  it("follows the product's stock, variant stock and untracked stock", () => {
    expect(productInStock(product())).toBe(true);
    expect(productInStock(product({ quantity: 0 }))).toBe(false);
    expect(productInStock(product({ quantity: 0, trackStock: false }))).toBe(true);
    expect(productInStock(product({ status: "draft" }))).toBe(false);
    expect(productInStock(product({ quantity: 9, productVariants: [{ id: "v1", stock: 0 }, { id: "v2", stock: 0 }] }))).toBe(false);
    expect(productInStock(product({ quantity: 0, productVariants: [{ id: "v1", stock: 0 }, { id: "v2", stock: 2 }] }))).toBe(true);
  });
});

describe("productJsonLdInput", () => {
  it("takes the shown price with its compare-at price and maps reviews", () => {
    const input = productJsonLdInput(
      product({
        reviews: [
          { rating: 5, source: "seller", reviewerName: "Shop", user: null },
          { rating: 4, source: "customer", user: { fullName: "Mona" }, comment: "Good", createdAt: "2026-10-01" },
        ],
      }),
      "ar",
    );
    expect(input.price).toMatchObject({ final: 80, list: 100 });
    expect(input.categoryName).toBe("مطبخ");
    expect(input.inStock).toBe(true);
    expect(input.reviews).toEqual([
      expect.objectContaining({ rating: 5, source: "seller" }),
      expect.objectContaining({ rating: 4, source: "customer", authorName: "Mona", body: "Good" }),
    ]);
  });
});

describe("productBreadcrumb", () => {
  const base = { home: "https://shop.com/en", homeLabel: "Home", productUrl: "https://shop.com/en/products/mug", productTitle: "Mug" };

  it("is Home › Category › Product when the product has a store category", () => {
    expect(productBreadcrumb({ ...base, category: { key: "s 1", name: "Summer" } })).toEqual([
      { name: "Home", url: "https://shop.com/en" },
      { name: "Summer", url: "https://shop.com/en/products?category=s%201" },
      { name: "Mug", url: "https://shop.com/en/products/mug" },
    ]);
  });

  it("is Home › Product without one", () => {
    expect(productBreadcrumb(base).map((c) => c.name)).toEqual(["Home", "Mug"]);
  });
});
