import { describe, expect, it } from "vitest";
import { toPreviewProductDetail, type PreviewProductRow, type PreviewVariantRow } from "./preview-product.lib";

const variant = (over: Partial<PreviewVariantRow>): PreviewVariantRow => ({
  id: "v",
  title: null,
  price: { final: 100 },
  stock: 0,
  imageUrl: null,
  images: null,
  isDefault: false,
  localized: null,
  option1: null,
  option2: null,
  option3: null,
  discountEndsAt: null,
  ...over,
});

const base: PreviewProductRow = {
  id: "p1",
  status: "active",
  images: ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
  price: { base: 300, list: 400, final: 300, discountType: "percent", discountValue: 25, discountEndsAt: "2027-01-01T00:00:00Z" },
  quantity: "7",
  averageRating: 4.5,
  reviewCount: 3,
  directCheckout: false,
  freeDelivery: false,
  productType: "physical",
  translation: { title: "قميص", description: "  ", content: '<p>نص</p><script>x()</script>', bulletPoints: ["أ", "", 3], slug: "shirt" },
  brandName: "ماركة",
  category: { id: "c1", name: "Shirts", nameAr: "قمصان" },
  seller: { displayName: "متجر", storeRating: 4.9, totalRatings: 10, freeDelivery: true },
  variants: [],
};

describe("toPreviewProductDetail", () => {
  it("maps the product as the storefront does", () => {
    const d = toPreviewProductDetail(base, "ar");
    expect(d).toMatchObject({
      id: "p1",
      slug: "shirt",
      href: "/products/shirt",
      title: "قميص",
      image: "https://cdn.test/a.jpg",
      price: 300,
      compareAtPrice: 400,
      discountPercent: 25,
      discountEndsAt: "2027-01-01T00:00:00Z",
      quantity: 7,
      inStock: true,
      description: null,
      bulletPoints: ["أ"],
      brand: "ماركة",
      category: { id: "c1", name: "قمصان" },
      seller: { name: "متجر", rating: 4.9, ratingCount: 10, freeDelivery: true },
    });
    expect(d.contentHtml).toBe("<p>نص</p>");
  });

  it("totals the variants' stock and maps their names, prices and colours", () => {
    const d = toPreviewProductDetail(
      {
        ...base,
        quantity: "0",
        variants: [
          variant({ id: "a", title: "Red", stock: 2, price: { final: 300 }, localized: { ar: { title: "أحمر", option1: "اللون: أحمر" }, optionMeta: [{ kind: "color", swatch: "#f00" }] } }),
          variant({ id: "b", title: "Blue", stock: 3, price: { final: 320, list: 500 }, images: ["https://cdn.test/v.jpg"] }),
        ],
      },
      "ar",
    );
    expect(d.quantity).toBe(5);
    expect(d.variants).toEqual([
      { id: "a", label: "أحمر", color: "#f00", image: null, price: 300, compareAtPrice: 400, quantity: 2 },
      { id: "b", label: "Blue", color: null, image: "https://cdn.test/v.jpg", price: 320, compareAtPrice: 500, quantity: 3 },
    ]);
  });

  it("has no content, discount or free delivery when there is none", () => {
    const d = toPreviewProductDetail(
      { ...base, price: { final: 100 }, productType: "digital", translation: { ...base.translation!, content: "<p> </p>" } },
      "en",
    );
    expect(d).toMatchObject({ compareAtPrice: null, discountPercent: null, discountEndsAt: null, contentHtml: null, category: { name: "Shirts" } });
    expect(d.seller.freeDelivery).toBe(false);
  });
});
