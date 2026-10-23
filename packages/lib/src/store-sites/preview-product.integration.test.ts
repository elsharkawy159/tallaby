import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { getStorePreviewProduct } from "./preview-product.server";

/**
 * The builder's preview product (template product page spec §5.5) against
 * the staging copy: ownership, the store's catalog and the newest default.
 * Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("getStorePreviewProduct (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  let w: IsolationWorld;
  let categoryId: string;
  const created: string[] = [];
  let olderId = "";

  async function addProduct(sellerId: string, title: string, opts: { status?: "active" | "draft"; createdAt?: string; quantity?: string } = {}) {
    const id = randomUUID();
    await db.insert(s.products).values({
      id,
      sellerId,
      categoryId,
      status: opts.status ?? "active",
      quantity: opts.quantity ?? "4",
      price: { base: 200, list: 250, final: 200 },
      images: ["p/a.jpg"],
      ...(opts.createdAt && { createdAt: opts.createdAt }),
    });
    await db.insert(s.productTranslations).values({
      productId: id,
      locale: "ar",
      title,
      slug: `${title}-${id.slice(0, 6)}`,
      content: `<p>${title}</p><script>alert(1)</script>`,
    });
    created.push(id);
    return id;
  }

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
  }, 60_000);

  afterAll(async () => {
    if (created.length) await db.delete(s.products).where(inArray(s.products.id, created));
    await w?.cleanup();
    await client.end();
  });

  it("no products returns null", async () => {
    expect(await getStorePreviewProduct(w.a.sellerId, w.a.a1, undefined, { q: db })).toBeNull();
  });

  it("getStorePreviewProduct rejects another seller's store", async () => {
    await addProduct(w.b.sellerId, "b-product");
    expect(await getStorePreviewProduct(w.a.sellerId, w.b.b1, undefined, { q: db })).toBeNull();
    expect(await getStorePreviewProduct(w.b.sellerId, w.b.b1, undefined, { q: db })).toMatchObject({ title: "b-product" });
  });

  it("foreign productId returns null", async () => {
    const foreign = await addProduct(w.b.sellerId, "b-other");
    expect(await getStorePreviewProduct(w.a.sellerId, w.a.a1, foreign, { q: db })).toBeNull();
    expect(await getStorePreviewProduct(w.a.sellerId, w.a.a1, "not-a-uuid", { q: db })).toBeNull();
  });

  it("picks the newest active product, maps it and sanitises its content", async () => {
    olderId = await addProduct(w.a.sellerId, "older", { createdAt: "2026-01-01T00:00:00Z" });
    const newest = await addProduct(w.a.sellerId, "newest", { createdAt: "2026-06-01T00:00:00Z", quantity: "0" });
    await addProduct(w.a.sellerId, "draft", { status: "draft", createdAt: "2026-09-01T00:00:00Z" });
    await db.insert(s.productVariants).values([
      { productId: newest, title: "S", price: { final: 200 }, stock: 2, position: 1 },
      { productId: newest, title: "M", price: { final: 220 }, stock: 3, position: 2 },
    ]);
    const detail = await getStorePreviewProduct(w.a.sellerId, w.a.a1, undefined, { q: db });
    expect(detail).toMatchObject({ id: newest, title: "newest", price: 200, compareAtPrice: 250, quantity: 5, inStock: true });
    expect(detail!.variants.map((v) => v.label)).toEqual(["S", "M"]);
    expect(detail!.contentHtml).toBe("<p>newest</p>");
  });

  it("in selected catalog mode only shows the store's picks", async () => {
    const picked = await addProduct(w.a.sellerId, "picked", { createdAt: "2025-01-01T00:00:00Z" });
    await db.update(s.stores).set({ catalogMode: "selected" }).where(eq(s.stores.id, w.a.a2));
    await db.insert(s.storeProducts).values({ storeId: w.a.a2, productId: picked });
    expect(await getStorePreviewProduct(w.a.sellerId, w.a.a2, undefined, { q: db })).toMatchObject({ id: picked });
    expect(await getStorePreviewProduct(w.a.sellerId, w.a.a2, olderId, { q: db })).toBeNull();
  });
});
