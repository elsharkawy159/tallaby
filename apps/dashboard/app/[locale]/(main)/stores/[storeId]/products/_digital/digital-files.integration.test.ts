import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * saveProductDigital against the staging database (F-108a): saving a product
 * as digital creates its digital_products row and files, stops counting
 * stock, replaces the files on the next save, refuses foreign paths and
 * products with options, and saving it back as physical deletes the rows and
 * asks storage to remove the files. The seller session, the store guard, the
 * storage client and the cache broadcast are stubbed; every query is real.
 *
 * Runs only when TEST_DATABASE_URL is set (it becomes DATABASE_URL for
 * @workspace/db). TEST_SELLER_ID picks an existing seller.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const SELLER_ID = (process.env.TEST_SELLER_ID ?? "").toLowerCase();
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const STORE_ID = "00000000-0000-4000-8000-000000000000";
const session = vi.hoisted(() => ({ sellerId: "" }));
vi.mock("@/lib/auth/require-seller.server", () => ({
  requireSeller: async () => ({ userId: session.sellerId, sellerId: session.sellerId, status: "approved", plan: "free", maxStoresOverride: null }),
  isAccessError: () => false,
}));
// The store guard (F-87c) is covered elsewhere; here it passes the session seller with no store filter.
vi.mock("@/lib/products/product-store.server", async () => {
  const { sql } = await import("drizzle-orm");
  return {
    requireProductStore: async () => ({
      seller: { userId: session.sellerId, sellerId: session.sellerId, status: "approved", plan: "free", maxStoresOverride: null },
      store: { id: STORE_ID },
      catalogSplit: false,
      inStore: sql`true`,
    }),
  };
});
// Storage: every path "exists" with a fixed size, except ones marked missing; removals are recorded.
const storage = vi.hoisted(() => ({ removed: [] as string[], missing: new Set<string>() }));
vi.mock("@workspace/db/supabase/service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/db/supabase/service")>()),
  getServiceClient: () => ({
    storage: {
      from: () => ({
        info: async (path: string) =>
          storage.missing.has(path) ? { data: null, error: new Error("not found") } : { data: { size: 2048, contentType: "application/pdf" }, error: null },
        remove: async (paths: string[]) => {
          storage.removed.push(...paths);
          return { data: [], error: null };
        },
        createSignedUploadUrl: async (path: string) => ({ data: { token: "t", path }, error: null }),
      }),
    },
  }),
}));
vi.mock("@workspace/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/cache")>()),
  applyInvalidation: async () => {},
}));

// Named columns only: products.is_bundle (0188) may not exist on the test database yet.
const PRODUCT_COLUMNS = (p: typeof import("@workspace/db").products) => ({
  productType: p.productType,
  trackStock: p.trackStock,
  preorderEnabled: p.preorderEnabled,
  status: p.status,
});

describe.skipIf(!TEST_DATABASE_URL || !SELLER_ID)("digital products in the seller form (integration)", { timeout: 60_000 }, () => {
  const productId = randomUUID();
  const slug = `qa-digital-${productId.slice(0, 8)}`;
  const path = (name: string) => `${SELLER_ID}/${STORE_ID}/${randomUUID()}-${name}`;
  const first = path("book.pdf");
  const second = path("pattern.dxf");

  const load = async () => {
    const dbModule = await import("@workspace/db");
    const { saveProductDigital } = await import("./digital-files.server");
    const { loadProductDigital } = await import("./digital-files.data");
    return { ...dbModule, saveProductDigital, loadProductDigital };
  };

  const digitalRows = async () => {
    const { db, eq, digitalProducts, digitalFiles, asc } = await load();
    const owners = await db.select().from(digitalProducts).where(eq(digitalProducts.productId, productId));
    const files = owners[0]
      ? await db.select().from(digitalFiles).where(eq(digitalFiles.digitalProductId, owners[0].id)).orderBy(asc(digitalFiles.sortOrder))
      : [];
    return { owners, files };
  };

  beforeAll(async () => {
    const { db, products, productTranslations, categories } = await load();
    session.sellerId = SELLER_ID;
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    await db.insert(products).values({
      id: productId,
      sellerId: SELLER_ID,
      categoryId: category!.id,
      status: "active",
      quantity: "10",
      trackStock: true,
      price: { list: 150, final: 120.5, base: 150 },
      images: ["x.jpg"],
    });
    await db.insert(productTranslations).values([
      { productId, locale: "ar", title: "منتج رقمي للاختبار", slug, description: "منتج لاختبار الملفات الرقمية." },
      { productId, locale: "en", title: "Digital QA product", slug, description: "A product for the digital files check." },
    ]);
  });

  afterAll(async () => {
    const { db, eq, products, productTranslations, digitalProducts } = await load();
    await db.delete(digitalProducts).where(eq(digitalProducts.productId, productId));
    await db.delete(productTranslations).where(eq(productTranslations.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
  });

  it("saves a product as digital with its files", async () => {
    const { db, eq, products, saveProductDigital, loadProductDigital } = await load();
    const result = await saveProductDigital(STORE_ID, productId, {
      productType: "digital",
      files: [
        { path: first, name: "My book.pdf" },
        { path: second, name: "Pattern.dxf" },
      ],
    });
    expect(result).toEqual({ success: true, unpublished: false });

    const [product] = await db.select(PRODUCT_COLUMNS(products)).from(products).where(eq(products.id, productId));
    expect([product!.productType, product!.trackStock, product!.preorderEnabled, product!.status]).toEqual(["digital", false, false, "active"]);
    const { owners, files } = await digitalRows();
    expect(owners).toHaveLength(1);
    expect([owners[0]!.sellerId, owners[0]!.price, owners[0]!.status, owners[0]!.deliveryMethod, owners[0]!.digitalType]).toEqual([
      SELLER_ID,
      "120.50",
      "active",
      "automatic",
      "digital_download",
    ]);
    expect(files.map((f) => [f.fileUrl, f.fileName, f.fileSize, f.sortOrder])).toEqual([
      [first, "My book.pdf", 2048, 0],
      [second, "Pattern.dxf", 2048, 1],
    ]);

    const loaded = await loadProductDigital(SELLER_ID, productId, sql`true`);
    expect(loaded.productType).toBe("digital");
    expect(loaded.files.map((f) => f.path)).toEqual([first, second]);
  });

  it("replaces the files and removes the dropped one from storage", async () => {
    const { saveProductDigital } = await load();
    const third = path("song.mp3");
    storage.removed = [];
    const result = await saveProductDigital(STORE_ID, productId, {
      productType: "digital",
      files: [
        { path: third, name: "Song.mp3" },
        { path: second, name: "Pattern v2.dxf" },
      ],
    });
    expect(result).toEqual({ success: true, unpublished: false });
    const { owners, files } = await digitalRows();
    expect(owners).toHaveLength(1);
    expect(files.map((f) => [f.fileUrl, f.fileName])).toEqual([
      [third, "Song.mp3"],
      [second, "Pattern v2.dxf"],
    ]);
    expect(storage.removed).toEqual([first]);
  });

  it("refuses another seller's or store's path, a missing upload, and changes nothing", async () => {
    const { saveProductDigital } = await load();
    const before = await digitalRows();
    const foreign = `${randomUUID()}/${STORE_ID}/${randomUUID()}-a.pdf`;
    const otherStore = `${SELLER_ID}/${randomUUID()}/${randomUUID()}-a.pdf`;
    expect(await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [{ path: foreign, name: "a.pdf" }] })).toEqual({ success: false, error: "badFile" });
    expect(await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [{ path: otherStore, name: "a.pdf" }] })).toEqual({ success: false, error: "badFile" });
    const missing = path("gone.zip");
    storage.missing.add(missing);
    expect(await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [{ path: missing, name: "gone.zip" }] })).toEqual({ success: false, error: "missingFile" });
    expect((await digitalRows()).files.map((f) => f.fileUrl)).toEqual(before.files.map((f) => f.fileUrl));
  });

  it("refuses another seller's product", async () => {
    const { saveProductDigital } = await load();
    session.sellerId = randomUUID();
    const result = await saveProductDigital(STORE_ID, productId, { productType: "physical", files: [] });
    session.sellerId = SELLER_ID;
    expect(result).toEqual({ success: false, error: "notFound" });
    expect((await digitalRows()).owners).toHaveLength(1);
  });

  it("puts a live digital product with no files back to draft", async () => {
    const { db, eq, products, saveProductDigital } = await load();
    expect(await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [] })).toEqual({ success: true, unpublished: true });
    const [product] = await db.select(PRODUCT_COLUMNS(products)).from(products).where(eq(products.id, productId));
    expect(product!.status).toBe("draft");
    expect((await digitalRows()).owners[0]!.status).toBe("draft");
  });

  it("saving back as physical deletes the digital rows and their files", async () => {
    const { db, eq, products, saveProductDigital, loadProductDigital } = await load();
    await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [{ path: second, name: "Pattern.dxf" }] });
    storage.removed = [];
    expect(await saveProductDigital(STORE_ID, productId, { productType: "physical", files: [{ path: second, name: "Pattern.dxf" }] })).toEqual({
      success: true,
      unpublished: false,
    });
    const [product] = await db.select(PRODUCT_COLUMNS(products)).from(products).where(eq(products.id, productId));
    expect(product!.productType).toBe("physical");
    expect((await digitalRows()).owners).toHaveLength(0);
    expect(storage.removed).toEqual([second]);
    expect(await loadProductDigital(SELLER_ID, productId, sql`true`)).toEqual({ productType: "physical", files: [] });
  });

  it("refuses to make a product with options digital", async () => {
    const { db, eq, productVariants, saveProductDigital } = await load();
    await db.insert(productVariants).values({ productId, title: "Red", sku: `qa-${productId.slice(0, 8)}-red`, price: { list: 150, final: 150 }, stock: 1 });
    try {
      expect(await saveProductDigital(STORE_ID, productId, { productType: "digital", files: [{ path: second, name: "Pattern.dxf" }] })).toEqual({
        success: false,
        error: "hasVariants",
      });
    } finally {
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
    }
  });
});
