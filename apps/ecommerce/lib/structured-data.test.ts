import { describe, expect, it } from "vitest";
import {
  generateProductGroupStructuredData,
  generateProductStructuredData,
  generateStoreProductStructuredData,
  type ProductJsonLdInput,
} from "./structured-data";

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

describe("store product with variants at different prices", () => {
  const grouped: ProductJsonLdInput = {
    ...product,
    images: ["https://img/bag.jpg"],
    reviews: [{ rating: 4, source: "customer", authorName: "Mona" }],
    variants: [
      { id: "v1", label: "Red / S", sku: "BAG-R-S", images: ["https://img/red.jpg", "https://img/bag.jpg"], price: { final: 100, list: 120 }, inStock: true, color: "Red", size: "S", shippingDetails: [{ "@type": "OfferShippingDetails" }] },
      { id: "v2", label: "Blue / L", images: [], price: { final: 140 }, inStock: false, color: "Blue", size: "L" },
    ],
  };

  it("is a ProductGroup with one Product and Offer per variant, linked as the feed links them", () => {
    const data = generateStoreProductStructuredData(grouped, store) as ReturnType<typeof generateProductGroupStructuredData>;
    expect(data).toMatchObject({
      "@type": "ProductGroup",
      name: "Bag",
      url: "https://sara.tallaby.com/en/products/bag",
      productGroupID: "1",
      variesBy: ["https://schema.org/color", "https://schema.org/size"],
      aggregateRating: { ratingValue: 4, reviewCount: 1 },
    });
    expect(data).not.toHaveProperty("offers");
    const [red, blue] = data.hasVariant;
    expect(red).toMatchObject({
      "@type": "Product",
      name: "Bag - Red / S",
      sku: "BAG-R-S",
      color: "Red",
      size: "S",
      image: ["https://img/red.jpg", "https://img/bag.jpg"],
      url: "https://sara.tallaby.com/en/products/bag?variant=v1",
      offers: {
        "@type": "Offer",
        price: 100,
        priceCurrency: "EGP",
        priceSpecification: { priceType: "https://schema.org/StrikethroughPrice", price: 120 },
        availability: "https://schema.org/InStock",
        url: "https://sara.tallaby.com/en/products/bag?variant=v1",
        shippingDetails: [{ "@type": "OfferShippingDetails" }],
        seller: { "@type": "Organization", name: "Sara" },
      },
    });
    expect(blue?.offers).toMatchObject({ price: 140, availability: "https://schema.org/OutOfStock" });
    expect(blue).not.toHaveProperty("sku");
    expect(blue).not.toHaveProperty("image");
    expect(blue?.offers).not.toHaveProperty("shippingDetails");
  });

  it("keeps one Offer on a Product without variants, and no variesBy for options that aren't colour or size", () => {
    expect(generateStoreProductStructuredData(product, store)).toMatchObject({ "@type": "Product", offers: { "@type": "Offer", price: 100 } });
    const plain = generateProductGroupStructuredData(
      { ...grouped, variants: grouped.variants!.map((v) => ({ ...v, color: null, size: null })) },
      store,
    );
    expect(plain).not.toHaveProperty("variesBy");
  });
});
