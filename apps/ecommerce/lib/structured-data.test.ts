import { describe, expect, it } from "vitest";
import { generateProductStructuredData } from "./structured-data";

const product = {
  id: "1",
  title: "Bag",
  slug: "bag",
  description: "A bag",
  price: { final: 100 },
  images: [],
  averageRating: 0,
  reviewCount: 0,
  status: "active",
} as unknown as Parameters<typeof generateProductStructuredData>[0];
const store = { home: "https://sara.tallaby.com/en", sellerName: "Sara" };

describe("store product structured data", () => {
  it("points at the store and names it as the seller", () => {
    const data = generateProductStructuredData(product, store);
    expect(data.url).toBe("https://sara.tallaby.com/en/products/bag");
    expect(data.offers.url).toBe("https://sara.tallaby.com/en/products/bag");
    expect(data.offers.seller.name).toBe("Sara");
  });

  it("claims no delivery cost or return policy, and no empty brand or image", () => {
    const data = generateProductStructuredData(product, store);
    expect(data.offers).not.toHaveProperty("shippingDetails");
    expect(data.offers).not.toHaveProperty("hasMerchantReturnPolicy");
    expect(data).not.toHaveProperty("brand");
    expect(data).not.toHaveProperty("image");
    expect(JSON.stringify(data)).not.toContain("Tallaby");
  });
});
