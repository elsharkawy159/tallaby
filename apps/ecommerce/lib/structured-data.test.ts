import { describe, expect, it } from "vitest";
import { generateProductStructuredData, type ProductJsonLdInput } from "./structured-data";

const product: ProductJsonLdInput = {
  id: "1",
  title: "Bag",
  slug: "bag",
  description: "A bag",
  price: { final: 100 },
  images: [],
  inStock: true,
  reviews: [],
};
const store = { home: "https://sara.tallaby.com/en", sellerName: "Sara", currency: "EGP" };

describe("store product structured data", () => {
  it("points at the store and names it as the seller", () => {
    const data = generateProductStructuredData(product, store);
    expect(data.url).toBe("https://sara.tallaby.com/en/products/bag");
    expect(data.offers.url).toBe("https://sara.tallaby.com/en/products/bag");
    expect(data.offers.seller.name).toBe("Sara");
  });

  it("claims no delivery cost or return policy without data, and no empty brand or image", () => {
    const data = generateProductStructuredData(product, store);
    expect(data.offers).not.toHaveProperty("shippingDetails");
    expect(data.offers).not.toHaveProperty("hasMerchantReturnPolicy");
    expect(data).not.toHaveProperty("brand");
    expect(data).not.toHaveProperty("image");
    expect(JSON.stringify(data)).not.toContain("Tallaby");
  });

  it("never emits the non-standard stock count", () => {
    expect(JSON.stringify(generateProductStructuredData(product, store))).not.toContain("Stock Count");
  });

  it("rates only customer reviews and lists named ones", () => {
    const data = generateProductStructuredData(
      {
        ...product,
        reviews: [
          { rating: 5, source: "seller", authorName: "Shop" },
          { rating: 4, source: "customer", authorName: "Mona", body: "Nice", createdAt: "2026-10-01T10:00:00Z" },
          { rating: 2, source: "customer", authorName: "Ali", isAnonymous: true },
        ],
      },
      store,
    );
    expect(data.aggregateRating).toMatchObject({ ratingValue: 3, reviewCount: 2, bestRating: 5, worstRating: 1 });
    expect(data.review).toEqual([
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Mona" },
        reviewRating: { "@type": "Rating", ratingValue: 4, bestRating: 5, worstRating: 1 },
        reviewBody: "Nice",
        datePublished: "2026-10-01",
      },
    ]);
  });

  it("has no rating when every review was added by the seller", () => {
    const data = generateProductStructuredData(
      { ...product, reviews: [{ rating: 5, source: "seller", authorName: "Shop" }] },
      store,
    );
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
  });

  it("adds the compare-at price as a strikethrough price in the store currency", () => {
    const data = generateProductStructuredData(
      { ...product, price: { final: 80, list: 120, validUntil: "2026-12-01" } },
      { ...store, currency: "SAR" },
    );
    expect(data.offers.price).toBe(80);
    expect(data.offers.priceCurrency).toBe("SAR");
    expect(data.offers.priceValidUntil).toBe("2026-12-01");
    expect(data.offers.priceSpecification).toEqual({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/StrikethroughPrice",
      price: 120,
      priceCurrency: "SAR",
    });
    expect(generateProductStructuredData({ ...product, price: { final: 80, list: 80 } }, store).offers).not.toHaveProperty(
      "priceSpecification",
    );
  });

  it("maps stock to availability and passes shipping details through", () => {
    expect(generateProductStructuredData(product, store).offers.availability).toBe("https://schema.org/InStock");
    expect(generateProductStructuredData({ ...product, inStock: false }, store).offers.availability).toBe(
      "https://schema.org/OutOfStock",
    );
    const shippingDetails = [{ "@type": "OfferShippingDetails" }];
    expect(generateProductStructuredData({ ...product, shippingDetails }, store).offers.shippingDetails).toBe(shippingDetails);
  });
});
