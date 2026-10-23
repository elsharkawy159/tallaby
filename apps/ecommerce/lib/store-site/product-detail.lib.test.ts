import { describe, expect, it } from "vitest";
import type { Product } from "@/components/product-page/product-page.types";
import { toProductDetail } from "./product-detail.lib";

const base = {
  id: "p-1",
  slug: "linen-shirt",
  title: "Linen shirt",
  description: "A light shirt.",
  content: '<p>Soft linen.</p><script>alert(1)</script><img src="https://cdn.test/a.jpg" onerror="alert(2)">',
  bulletPoints: ["Material: linen", "  ", 7],
  images: ["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"],
  price: { base: 500, final: 400, list: 500, discountEndsAt: "2099-01-01T00:00:00.000Z" },
  quantity: "9",
  status: "active",
  directCheckout: true,
  averageRating: 4.5,
  reviewCount: 12,
  brand: { name: "Nile" },
  category: { id: "c-1", name: "Shirts", nameAr: "قمصان" },
  seller: { id: "s-1", displayName: "Faster", storeRating: 4.8, totalRatings: 30, freeDelivery: true },
} as unknown as Product;

describe("toProductDetail", () => {
  it("toProductDetail maps price, variants, images, sanitised content", () => {
    const product = {
      ...base,
      productVariants: [
        {
          id: "v-1",
          title: "Red",
          option1: "Color: Red",
          price: { final: 380, list: 450 },
          stock: 2,
          imageUrl: "https://cdn.test/red.jpg",
        },
        { id: "v-2", title: "Blue", option1: "Color: Blue", price: { final: 400 }, stock: 0, images: [] },
      ],
    } as unknown as Product;

    const detail = toProductDetail(product, "en");

    expect(detail).toMatchObject({
      id: "p-1",
      slug: "linen-shirt",
      href: "/products/linen-shirt",
      title: "Linen shirt",
      description: "A light shirt.",
      price: 400,
      compareAtPrice: 500,
      discountPercent: 20,
      discountEndsAt: "2099-01-01T00:00:00.000Z",
      images: ["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"],
      image: "https://cdn.test/1.jpg",
      bulletPoints: ["Material: linen"],
      rating: 4.5,
      reviewCount: 12,
      directCheckout: true,
      brand: "Nile",
      category: { id: "c-1", name: "Shirts" },
      seller: { name: "Faster", rating: 4.8, ratingCount: 30, freeDelivery: true },
    });
    expect(detail.variants).toEqual([
      { id: "v-1", label: "Red", color: expect.stringMatching(/^#/), image: "https://cdn.test/red.jpg", price: 380, compareAtPrice: 450, quantity: 2 },
      { id: "v-2", label: "Blue", color: expect.stringMatching(/^#/), image: null, price: 400, compareAtPrice: 500, quantity: 0 },
    ]);
    // Total stock: what the variants hold, not the product's own count.
    expect(detail.quantity).toBe(2);
    expect(detail.inStock).toBe(true);
    // Sanitised on the server, as today's ProductContent does.
    expect(detail.contentHtml).toContain("<p>Soft linen.</p>");
    expect(detail.contentHtml).not.toContain("<script");
    expect(detail.contentHtml).not.toContain("onerror");
  });

  it("toProductDetail product without variants has []", () => {
    const detail = toProductDetail({ ...base, productVariants: [] } as unknown as Product, "ar");
    expect(detail.variants).toEqual([]);
    expect(detail.quantity).toBe(9);
    expect(detail.category).toEqual({ id: "c-1", name: "قمصان" });
  });

  it("has no content, brand, category or seller rating when the product has none", () => {
    const detail = toProductDetail(
      { ...base, content: "<p> </p>", brand: null, category: null, seller: null, quantity: null, images: null } as unknown as Product,
      "en",
    );
    expect(detail.contentHtml).toBeNull();
    expect(detail.brand).toBeNull();
    expect(detail.category).toBeNull();
    expect(detail.seller).toEqual({ name: "", rating: null, ratingCount: 0, freeDelivery: false });
    expect(detail.quantity).toBe(0);
    expect(detail.inStock).toBe(false);
    expect(detail.images).toEqual([]);
    expect(detail.image).toBeNull();
  });
});
