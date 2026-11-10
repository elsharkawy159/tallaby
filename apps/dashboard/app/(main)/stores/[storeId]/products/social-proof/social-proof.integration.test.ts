import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * saveProductSocialProof against the staging database (0111): seller-added
 * reviews are created, edited and removed, customer reviews are never
 * touched, the rating is recounted, no "review received" notification is
 * sent, and another seller can't write to the product. The seller session
 * and the cache broadcast are stubbed; every query is real.
 *
 * Runs only when TEST_DATABASE_URL is set (it becomes DATABASE_URL for
 * @workspace/db). TEST_SELLER_ID picks an existing seller (its user row is
 * reused for the one customer review). With KEEP_SOCIAL_PROOF_FIXTURE=1 the
 * product is left in place (active, live views on, two seller reviews) for
 * a storefront check; delete it afterwards.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const SELLER_ID = process.env.TEST_SELLER_ID ?? "";
const KEEP = process.env.KEEP_SOCIAL_PROOF_FIXTURE === "1";
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ sellerId: "" }));
vi.mock("@/lib/auth/require-seller.server", () => ({
  requireSeller: async () => ({ userId: session.sellerId, sellerId: session.sellerId, status: "approved", plan: "free", maxStoresOverride: null }),
  isAccessError: () => false,
}));
const invalidations = vi.hoisted(() => [] as { tags: string[] }[]);
vi.mock("@workspace/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/cache")>()),
  applyInvalidation: async (inv: { tags: string[] }) => {
    invalidations.push(inv);
  },
}));

describe.skipIf(!TEST_DATABASE_URL || !SELLER_ID)("product reviews and live views (integration)", { timeout: 60_000 }, () => {
  const productId = randomUUID();
  const slug = `qa-social-proof-${productId.slice(0, 8)}`;
  let customerReviewId = "";

  // Imported lazily so DATABASE_URL is set before @workspace/db connects.
  const load = async () => {
    const dbModule = await import("@workspace/db");
    const { saveProductSocialProof } = await import("./social-proof.server");
    const { loadProductSocialProof } = await import("./social-proof.data");
    return { ...dbModule, saveProductSocialProof, loadProductSocialProof };
  };

  beforeAll(async () => {
    const { db, products, productTranslations, reviews, categories } = await load();
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    await db.insert(products).values({
      id: productId,
      sellerId: SELLER_ID,
      categoryId: category!.id,
      status: "active",
      quantity: "10",
      price: { list: 450, final: 450, base: 450 },
      images: [],
    });
    await db.insert(productTranslations).values([
      { productId, locale: "ar", title: "منتج اختبار التقييمات", slug, description: "منتج لاختبار التقييمات والمشاهدات المباشرة." },
      { productId, locale: "en", title: "Reviews QA product", slug, description: "A product for the reviews and live views check." },
    ]);
    // A real customer review the save must never touch (status approved: it counts in the rating).
    const [customer] = await db
      .insert(reviews)
      .values({ productId, sellerId: SELLER_ID, userId: SELLER_ID, rating: 2, comment: "customer review", status: "approved", reviewType: "product" })
      .returning({ id: reviews.id });
    customerReviewId = customer!.id;
  });

  afterAll(async () => {
    const { db, eq, and, inArray, products, productTranslations, reviews, sellerNotifications } = await load();
    // Only the notifications this test's reviews created.
    const ids = (await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.productId, productId))).map((r) => `review_received:${r.id}`);
    if (ids.length) await db.delete(sellerNotifications).where(and(eq(sellerNotifications.sellerId, SELLER_ID), inArray(sellerNotifications.dedupeKey, ids)));
    if (KEEP) {
      await db.delete(reviews).where(eq(reviews.id, customerReviewId));
      const { syncProductRating } = await import("@workspace/db/reviews");
      await syncProductRating(productId);
      console.info(`[social-proof] kept product ${productId} slug ${slug}`);
      return;
    }
    await db.delete(reviews).where(eq(reviews.productId, productId));
    await db.delete(productTranslations).where(eq(productTranslations.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
  });

  it("adds seller reviews, turns live views on and recounts the rating", async () => {
    const { db, eq, and, products, reviews, saveProductSocialProof, loadProductSocialProof } = await load();
    session.sellerId = SELLER_ID;
    const result = await saveProductSocialProof(productId, {
      showLiveViews: true,
      reviews: [
        { reviewerName: "  Mona A. ", rating: 5, comment: "Great quality" },
        { reviewerName: "أحمد", rating: 4, comment: "" },
      ],
    });
    expect(result).toEqual({ success: true });

    const rows = await db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.source, "seller")));
    expect(rows.map((r) => [r.reviewerName, r.rating, r.comment, r.userId, r.status, r.isVerifiedPurchase]).sort()).toEqual(
      [
        ["Mona A.", 5, "Great quality", null, "approved", false],
        ["أحمد", 4, null, null, "approved", false],
      ].sort(),
    );
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    expect(product!.showLiveViews).toBe(true);
    // 5 + 4 (seller) + 2 (customer) over three approved reviews.
    expect(product!.reviewCount).toBe(3);
    expect(product!.averageRating).toBeCloseTo(11 / 3, 5);

    const loaded = await loadProductSocialProof(SELLER_ID, productId);
    expect(loaded.showLiveViews).toBe(true);
    expect(loaded.reviews.map((r) => r.reviewerName).sort()).toEqual(["Mona A.", "أحمد"].sort());
    // The page caches by slug: the product's slug tags are purged.
    expect(invalidations.at(-1)!.tags).toEqual(expect.arrayContaining([`product:slug:ar:${slug}`, `product:slug:en:${slug}`]));
  });

  it("sends no review notification for seller reviews (customer reviews still notify)", async () => {
    const { db, eq, and, like, sellerNotifications, reviews } = await load();
    const seller = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.source, "seller")));
    const notes = await db
      .select({ key: sellerNotifications.dedupeKey })
      .from(sellerNotifications)
      .where(and(eq(sellerNotifications.sellerId, SELLER_ID), like(sellerNotifications.dedupeKey, "review_received:%")));
    const keys = notes.map((n) => n.key);
    expect(keys).toContain(`review_received:${customerReviewId}`);
    for (const row of seller) expect(keys).not.toContain(`review_received:${row.id}`);
  });

  it("edits one review, removes another, adds one, and leaves the customer review alone", async () => {
    const { db, eq, and, products, reviews, saveProductSocialProof, loadProductSocialProof } = await load();
    const before = await loadProductSocialProof(SELLER_ID, productId);
    const mona = before.reviews.find((r) => r.reviewerName === "Mona A.")!;
    const result = await saveProductSocialProof(productId, {
      showLiveViews: true,
      reviews: [
        { id: mona.id, reviewerName: "Mona Ali", rating: 3, comment: "Good, slow delivery" },
        // An id that isn't one of this product's seller reviews (the customer review) is inserted as new, never updated.
        { id: customerReviewId, reviewerName: "Sara", rating: 5, comment: "" },
      ],
    });
    expect(result).toEqual({ success: true });

    const rows = await db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.source, "seller")));
    expect(rows).toHaveLength(2);
    const edited = rows.find((r) => r.id === mona.id)!;
    expect([edited.reviewerName, edited.rating, edited.comment]).toEqual(["Mona Ali", 3, "Good, slow delivery"]);
    expect(rows.some((r) => r.reviewerName === "أحمد")).toBe(false);
    expect(rows.find((r) => r.reviewerName === "Sara")!.id).not.toBe(customerReviewId);

    const [customer] = await db.select().from(reviews).where(eq(reviews.id, customerReviewId));
    expect([customer!.source, customer!.rating, customer!.comment, customer!.userId]).toEqual(["customer", 2, "customer review", SELLER_ID]);
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    expect(product!.reviewCount).toBe(3);
    expect(product!.averageRating).toBeCloseTo(10 / 3, 5);
  });

  it("refuses another seller's product and changes nothing", async () => {
    const { db, eq, and, products, reviews, saveProductSocialProof } = await load();
    session.sellerId = randomUUID();
    const result = await saveProductSocialProof(productId, { showLiveViews: false, reviews: [] });
    session.sellerId = SELLER_ID;
    expect(result).toEqual({ success: false, error: "notFound" });
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    expect(product!.showLiveViews).toBe(true);
    const rows = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.source, "seller")));
    expect(rows).toHaveLength(2);
  });

  it("rejects bad input and the database refuses a nameless seller review", async () => {
    const { db, reviews, saveProductSocialProof } = await load();
    expect(await saveProductSocialProof(productId, { showLiveViews: true, reviews: [{ reviewerName: " ", rating: 5 }] })).toEqual({ success: false, error: "invalidInput" });
    expect(await saveProductSocialProof(productId, { showLiveViews: true, reviews: [{ reviewerName: "X", rating: 6 }] })).toEqual({ success: false, error: "invalidInput" });
    await expect(db.insert(reviews).values({ productId, sellerId: SELLER_ID, source: "seller", rating: 5, status: "approved" })).rejects.toThrow();
    await expect(db.insert(reviews).values({ productId, sellerId: SELLER_ID, source: "customer", rating: 5, status: "approved" })).rejects.toThrow();
  });

  it("saves and loads the low-stock alert, and refuses a threshold out of range (0122)", async () => {
    const { db, eq, products, saveProductSocialProof, loadProductSocialProof } = await load();
    const current = await loadProductSocialProof(SELLER_ID, productId);
    const base = { showLiveViews: true, reviews: current.reviews };
    expect(await saveProductSocialProof(productId, { ...base, showLowStockBadge: true, lowStockThreshold: 3 })).toEqual({ success: true });
    expect(await loadProductSocialProof(SELLER_ID, productId)).toMatchObject({ showLowStockBadge: true, lowStockThreshold: 3 });
    for (const lowStockThreshold of [0, 100, 2.5]) {
      expect(await saveProductSocialProof(productId, { ...base, showLowStockBadge: true, lowStockThreshold })).toEqual({ success: false, error: "invalidInput" });
    }
    await expect(db.update(products).set({ lowStockThreshold: 0 }).where(eq(products.id, productId))).rejects.toThrow();
    // Another seller can't switch it off.
    session.sellerId = randomUUID();
    expect(await saveProductSocialProof(productId, { ...base, showLowStockBadge: false })).toEqual({ success: false, error: "notFound" });
    session.sellerId = SELLER_ID;
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    expect([product!.showLowStockBadge, product!.lowStockThreshold]).toEqual([true, 3]);
  });

  it("keeps the final state for the storefront check", async () => {
    const { saveProductSocialProof, loadProductSocialProof } = await load();
    const current = await loadProductSocialProof(SELLER_ID, productId);
    const result = await saveProductSocialProof(productId, { showLiveViews: true, reviews: current.reviews });
    expect(result).toEqual({ success: true });
  });
});
