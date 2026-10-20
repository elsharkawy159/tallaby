import { describe, expect, it } from "vitest";
import {
  addTaxonomyItemSchema,
  productTaxonomySchema,
  reorderTaxonomySchema,
  updateTaxonomyItemSchema,
} from "./categories-brands.dto";
import {
  cleanTaxonomyName,
  escapeLike,
  isSellerTaxonomyImage,
  isUniqueViolation,
  sortTaxonomyByLabel,
  splitSellerTaxonomy,
  taxonomyLabel,
  taxonomyNameKey,
} from "./categories-brands.lib";

const ID = "33333333-3333-4333-8333-333333333333";

describe("names", () => {
  it("cleans whitespace and compares without case", () => {
    expect(cleanTaxonomyName("  Men's   Shoes ")).toBe("Men's Shoes");
    expect(taxonomyNameKey(" NIKE ")).toBe(taxonomyNameKey("nike"));
  });

  it("shows the Arabic name in the Arabic UI when there is one", () => {
    expect(taxonomyLabel({ name: "Shoes", nameAr: "أحذية" }, "ar")).toBe("أحذية");
    expect(taxonomyLabel({ name: "Shoes", nameAr: "أحذية" }, "en")).toBe("Shoes");
    expect(taxonomyLabel({ name: "Shoes", nameAr: " " }, "ar")).toBe("Shoes");
  });
});

describe("splitSellerTaxonomy", () => {
  it("keeps the product payload free of the seller's own fields and maps '' to null", () => {
    const { rest, taxonomy } = splitSellerTaxonomy({ categoryId: "c", sellerCategoryId: ID, sellerBrandId: "" });
    expect(rest).toEqual({ categoryId: "c" });
    expect(taxonomy).toEqual({ sellerCategoryId: ID, sellerBrandId: null });
  });
});

describe("escapeLike", () => {
  it("matches wildcards literally", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});

describe("isUniqueViolation", () => {
  it("finds the code directly or in a wrapped cause", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ message: "x", cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe("schemas", () => {
  it("adds either a pack item or an own name, not both", () => {
    expect(addTaxonomyItemSchema.safeParse({ sourceId: ID }).success).toBe(true);
    expect(addTaxonomyItemSchema.safeParse({ name: "Shoes", nameAr: "" }).data).toEqual({ name: "Shoes", nameAr: null });
    expect(addTaxonomyItemSchema.safeParse({ sourceId: ID, name: "Shoes" }).success).toBe(false);
    expect(addTaxonomyItemSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(addTaxonomyItemSchema.safeParse({ sourceId: "not-a-uuid" }).success).toBe(false);
  });

  it("caps name length and rejects extra fields", () => {
    expect(updateTaxonomyItemSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
    expect(updateTaxonomyItemSchema.safeParse({ name: "ok", sellerId: ID }).success).toBe(false);
  });

  it("lets a product clear its own category and brand", () => {
    expect(productTaxonomySchema.safeParse({ sellerCategoryId: null, sellerBrandId: ID }).success).toBe(true);
    expect(productTaxonomySchema.safeParse({ sellerCategoryId: "x", sellerBrandId: null }).success).toBe(false);
  });
});

describe("isSellerTaxonomyImage", () => {
  const base = "https://abc.supabase.co";
  const ok = `${base}/storage/v1/object/public/sellers/logos/1760000000000-shoes.png`;

  it("accepts a file in the seller uploads folder of this project", () => {
    expect(isSellerTaxonomyImage(ok, base)).toBe(true);
    expect(isSellerTaxonomyImage(ok, `${base}/`)).toBe(true);
    expect(isSellerTaxonomyImage(`${base}/storage/v1/object/public/sellers/logos/my%20logo.webp`, base)).toBe(true);
  });

  it("rejects other hosts, buckets, folders and path tricks", () => {
    expect(isSellerTaxonomyImage(ok.replace("abc", "evil"), base)).toBe(false);
    expect(isSellerTaxonomyImage(`${base}/storage/v1/object/public/products/x.png`, base)).toBe(false);
    expect(isSellerTaxonomyImage(`${base}/storage/v1/object/public/sellers/documents/x.png`, base)).toBe(false);
    expect(isSellerTaxonomyImage(`${base}/storage/v1/object/public/sellers/logos/../documents/x.png`, base)).toBe(false);
    expect(isSellerTaxonomyImage(`${base}/storage/v1/object/public/sellers/logos/`, base)).toBe(false);
    expect(isSellerTaxonomyImage(ok, undefined)).toBe(false);
  });
});

describe("sortTaxonomyByLabel", () => {
  const items = [
    { id: "1", name: "shoes", nameAr: "أحذية" },
    { id: "2", name: "Bags", nameAr: null },
    { id: "3", name: "accessories", nameAr: "إكسسوارات" },
  ];

  it("sorts by the label shown, ignoring case, without changing the input", () => {
    expect(sortTaxonomyByLabel(items, "en").map((i) => i.id)).toEqual(["3", "2", "1"]);
    expect(items.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("uses Arabic names in the Arabic UI (Arabic before Latin)", () => {
    expect(sortTaxonomyByLabel(items, "ar").map((i) => i.id)).toEqual(["1", "3", "2"]);
  });
});

describe("image and reorder schemas", () => {
  it("keeps the image when left out, clears it with null", () => {
    expect(updateTaxonomyItemSchema.parse({ name: "Shoes" }).image).toBeUndefined();
    expect(updateTaxonomyItemSchema.parse({ name: "Shoes", image: null }).image).toBeNull();
    expect(addTaxonomyItemSchema.safeParse({ name: "Shoes", image: "https://x/y.png" }).success).toBe(true);
    expect(addTaxonomyItemSchema.safeParse({ sourceId: ID, image: "https://x/y.png" }).success).toBe(false);
  });

  it("takes a list of distinct ids", () => {
    expect(reorderTaxonomySchema.safeParse([ID]).success).toBe(true);
    expect(reorderTaxonomySchema.safeParse([]).success).toBe(true);
    expect(reorderTaxonomySchema.safeParse([ID, ID]).success).toBe(false);
    expect(reorderTaxonomySchema.safeParse(["x"]).success).toBe(false);
  });
});
