import { describe, expect, it } from "vitest";
import type { Product } from "@/components/product-page/product-page.types";
import { storeCategoryOf, toProductDetail } from "./product-detail.lib";

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

  it("takes a single image path as the gallery does", () => {
    const detail = toProductDetail({ ...base, images: "https://cdn.test/only.jpg", productVariants: [] } as unknown as Product, "en");
    expect(detail.images).toEqual(["https://cdn.test/only.jpg"]);
    expect(detail.image).toBe("https://cdn.test/only.jpg");
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

describe("breadcrumb category link", () => {
  const root = (key: string, categoryIds: string[]) => ({ key, name: "Fashion", nameAr: "أزياء", sellerCategoryId: null, sourceCategoryId: null, categoryIds });
  const own = (id: string, sourceCategoryId: string | null) => ({ key: id, name: "Summer", nameAr: "صيفي", sellerCategoryId: id, sourceCategoryId, categoryIds: [] });
  const storeCategories = [own("s-1", null), own("s-2", "c-2"), root("fashion", ["c-1"]), root("f3b1c2d4-0000-0000-0000-000000000000", ["c-9"])];
  const product = (sellerCategoryId: string | null, category: { id: string; slug: string | null; parentId: string | null } | null) => ({ sellerCategoryId, category });

  it("links the category to the store catalog filtered by its root", () => {
    const ref = storeCategoryOf(product(null, { id: "c-1", slug: "shirts", parentId: "root-1" }), storeCategories);
    expect(ref?.key).toBe("fashion");
    const detail = toProductDetail(base as unknown as Product, "en", { storeCategory: ref });
    expect(detail.category).toEqual({ id: "c-1", name: "Fashion", href: "/products?category=fashion" });
  });

  it("puts a product in its seller category, else the one picked from its Tallaby category", () => {
    expect(storeCategoryOf(product("s-1", { id: "c-1", slug: "shirts", parentId: "root-1" }), storeCategories)?.key).toBe("s-1");
    const picked = storeCategoryOf(product(null, { id: "c-2", slug: "dresses", parentId: "root-1" }), storeCategories);
    expect(picked?.key).toBe("s-2");
    expect(toProductDetail(base as unknown as Product, "ar", { storeCategory: picked }).category).toEqual({ id: "c-1", name: "صيفي", href: "/products?category=s-2" });
  });

  it("falls back to a root category's own slug, else its id; a sub-category outside the list has none", () => {
    expect(storeCategoryOf(product(null, { id: "r-1", slug: "home", parentId: null }), [])?.key).toBe("home");
    expect(storeCategoryOf(product(null, { id: "r-2", slug: null, parentId: null }), [])?.key).toBe("r-2");
    expect(storeCategoryOf(product(null, { id: "c-5", slug: "mugs", parentId: "r-1" }), storeCategories)).toBeNull();
    expect(storeCategoryOf(product(null, null), storeCategories)).toBeNull();
  });

  it("has no link without a key", () => {
    expect(toProductDetail(base as unknown as Product, "en").category).toEqual({ id: "c-1", name: "Shirts" });
  });
});
