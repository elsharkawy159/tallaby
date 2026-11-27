"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateProduct, invalidateProductInventory, mergeInvalidations, type ProductCacheSnapshot } from "@workspace/cache";
import {
  and,
  asc,
  db,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  productBundleItems,
  products,
  productTranslations,
  productVariants,
  sql,
} from "@workspace/db";
import { BUNDLE_MAX_ITEMS, bundleAvailability, validateBundleItems } from "@workspace/lib/products/bundles";
import { getLocale } from "next-intl/server";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { STORE_PRODUCTS_PATTERN } from "@/lib/products/product-routes.lib";
import { requireStoreProduct } from "@/lib/products/product-store.server";
import { bundleBlockedReason, bundleCheckError, bundleItemProblem, type BundleBlockedReason, type BundleSaveError } from "./bundle.lib";

/**
 * "This product is a bundle" on the product edit page (ROADMAP.md F-07f;
 * docs/plans/bundles.md §4). Every call names the page's store (CLAUDE.md
 * rule 5): it must be the session seller's and the product must be in it
 * (`requireStoreProduct`, scope `managed`), and every item is read back with
 * the seller, the bundle's own `store_id` and the store condition, so an id
 * from the client never reaches another store's product. The 0188 guard
 * triggers check the same again inside the transaction.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEARCH_LIMIT = 20;

export type BundleVariantOption = { id: string; title: string; stock: number | null };

export type BundleItemRow = {
  productId: string;
  variantId: string | null;
  quantity: number;
  title: string;
  sku: string | null;
  image: string | null;
  variantTitle: string | null;
  /** False: the item never runs out (unlimited stock). */
  trackStock: boolean;
  /** The chosen variant's stock, else the product's own. */
  stock: number | null;
  trashed: boolean;
  /** Became a pre-order or digital after it was added (0188 checks only on add): the bundle can't be sold. */
  preorder: boolean;
  digital: boolean;
  variants: BundleVariantOption[];
};

export type BundleState = {
  isBundle: boolean;
  /** Why it can't become a bundle; null = it can (or already is one). */
  blocked: BundleBlockedReason | null;
  items: BundleItemRow[];
  /** Bundles that can be sold now; null = unlimited. */
  available: number | null;
};

export type BundleItemOption = {
  id: string;
  title: string;
  sku: string | null;
  image: string | null;
  trackStock: boolean;
  stock: number;
  variants: BundleVariantOption[];
};

export type SaveBundleResult = { success: true; state: BundleState } | { success: false; error: BundleSaveError };

const EMPTY: BundleState = { isBundle: false, blocked: null, items: [], available: 0 };

/** The product's title in this language first; nested so drizzle keeps the outer table name. */
const titleField = (locale: string) =>
  sql<string | null>`${sql`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} ORDER BY (t.locale = ${locale}) DESC LIMIT 1)`}`;

async function loadVariants(productIds: string[]): Promise<Map<string, BundleVariantOption[]>> {
  const byProduct = new Map<string, BundleVariantOption[]>();
  if (productIds.length === 0) return byProduct;
  const rows = await db
    .select({ id: productVariants.id, productId: productVariants.productId, title: productVariants.title, stock: productVariants.stock })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .orderBy(asc(productVariants.position), asc(productVariants.createdAt));
  for (const row of rows) {
    if (!row.productId) continue;
    const list = byProduct.get(row.productId) ?? [];
    list.push({ id: row.id, title: row.title ?? "", stock: row.stock });
    byProduct.set(row.productId, list);
  }
  return byProduct;
}

/** The product's bundle setting, its items with their stock, and what can be sold. A store or product outside the session's seller reads as not a bundle. */
export async function loadBundle(storeId: string, productId: string): Promise<BundleState> {
  if (!UUID.test(String(productId))) return EMPTY;
  let ctx: Awaited<ReturnType<typeof requireStoreProduct>>;
  try {
    ctx = await requireStoreProduct(storeId, productId, { read: true });
  } catch (error) {
    if (isAccessError(error)) return EMPTY;
    throw error;
  }
  const { sellerId } = ctx.seller;
  const [product] = await db
    .select({
      isBundle: products.isBundle,
      hasVariants: sql<boolean>`${sql`EXISTS (SELECT 1 FROM ${productVariants} v WHERE v.product_id = ${products.id})`}`,
      isItemOfBundle: sql<boolean>`${sql`EXISTS (SELECT 1 FROM ${productBundleItems} b WHERE b.item_product_id = ${products.id})`}`,
      productType: products.productType,
    })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), ctx.inStore))
    .limit(1);
  if (!product) return EMPTY;

  const rows = await db
    .select({ itemProductId: productBundleItems.itemProductId, itemVariantId: productBundleItems.itemVariantId, quantity: productBundleItems.quantity })
    .from(productBundleItems)
    .where(and(eq(productBundleItems.bundleProductId, productId), eq(productBundleItems.sellerId, sellerId)))
    .orderBy(asc(productBundleItems.position), asc(productBundleItems.createdAt));

  const ids = [...new Set(rows.map((row) => row.itemProductId))];
  const locale = await getLocale();
  const [details, variants] = await Promise.all([
    ids.length
      ? db
          .select({
            id: products.id,
            sku: products.sku,
            image: sql<string | null>`${products.images}->>0`,
            trackStock: products.trackStock,
            quantity: products.quantity,
            deletedAt: products.deletedAt,
            purgedAt: products.purgedAt,
            preorderEnabled: products.preorderEnabled,
            productType: products.productType,
            title: titleField(locale),
          })
          .from(products)
          .where(and(inArray(products.id, ids), eq(products.sellerId, sellerId)))
      : Promise.resolve([]),
    loadVariants(ids),
  ]);
  const byId = new Map(details.map((row) => [row.id, row]));

  const items: BundleItemRow[] = rows.flatMap((row) => {
    const item = byId.get(row.itemProductId);
    if (!item) return [];
    const own = variants.get(item.id) ?? [];
    const variant = row.itemVariantId ? own.find((option) => option.id === row.itemVariantId) : undefined;
    return [
      {
        productId: item.id,
        variantId: row.itemVariantId,
        quantity: row.quantity,
        title: item.title ?? "",
        sku: item.sku,
        image: item.image,
        variantTitle: variant?.title ?? null,
        trackStock: item.trackStock,
        stock: row.itemVariantId ? (variant?.stock ?? null) : Number(item.quantity) || 0,
        trashed: item.deletedAt != null || item.purgedAt != null,
        preorder: item.preorderEnabled === true,
        digital: item.productType === "digital",
        variants: own,
      },
    ];
  });

  return {
    isBundle: product.isBundle,
    blocked: product.isBundle ? null : bundleBlockedReason(product),
    items,
    available: product.isBundle
      ? bundleAvailability(
          items.map((item) => ({
            quantity: item.quantity,
            trackStock: item.trackStock,
            stock: item.stock,
            trashed: item.trashed,
            hasVariants: item.variants.length > 0,
            variantId: item.variantId,
            preorder: item.preorder,
            digital: item.digital,
          })),
        )
      : 0,
  };
}

/**
 * Products of this store that can go in a bundle, by name or SKU: not this
 * product, not a bundle, not in Trash, not a pre-order, not digital.
 */
export async function searchBundleItems(input: { storeId: string; productId: string; query: string }): Promise<BundleItemOption[]> {
  const productId = String(input?.productId ?? "");
  const text = String(input?.query ?? "").trim().slice(0, 100);
  if (!UUID.test(productId) || text.length === 0) return [];
  let ctx: Awaited<ReturnType<typeof requireStoreProduct>>;
  try {
    ctx = await requireStoreProduct(input?.storeId, productId, { read: true });
  } catch (error) {
    if (isAccessError(error)) return [];
    throw error;
  }
  const { sellerId } = ctx.seller;
  const locale = await getLocale();
  const pattern = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      image: sql<string | null>`${products.images}->>0`,
      trackStock: products.trackStock,
      quantity: products.quantity,
      title: titleField(locale),
    })
    .from(products)
    .where(
      and(
        eq(products.sellerId, sellerId),
        ctx.inStore,
        ne(products.id, productId),
        isNull(products.deletedAt),
        isNull(products.purgedAt),
        eq(products.isBundle, false),
        eq(products.preorderEnabled, false),
        sql`coalesce(${products.productType}::text, 'physical') <> 'digital'`,
        or(
          ilike(products.sku, pattern),
          exists(
            db
              .select({ one: sql`1` })
              .from(productTranslations)
              .where(and(eq(productTranslations.productId, products.id), ilike(productTranslations.title, pattern))),
          ),
        ),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(SEARCH_LIMIT);
  const variants = await loadVariants(rows.map((row) => row.id));
  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? "",
    sku: row.sku,
    image: row.image,
    trackStock: row.trackStock,
    stock: Number(row.quantity) || 0,
    variants: variants.get(row.id) ?? [],
  }));
}

/** Storefront caches of this product: its page, its stock and the store's lists (keys carry the seller id, rule 8). */
async function invalidateBundleProduct(sellerId: string, productId: string): Promise<void> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.sellerId, sellerId)),
    columns: {
      id: true,
      sellerId: true,
      storeId: true,
      categoryId: true,
      brandId: true,
      status: true,
      isFeatured: true,
      isTrending: true,
      isSeasonal: true,
      isMostSelling: true,
      isPlatformChoice: true,
      sponsored: true,
      price: true,
    },
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });
  if (!row) return;
  const snapshot: ProductCacheSnapshot = {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: row.status ?? "draft",
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(row.price ?? null),
  };
  // Same snapshot on both sides: nothing moved between lists, but the page and its stock did change.
  await applyInvalidation(
    mergeInvalidations(invalidateProduct(snapshot, snapshot), invalidateProductInventory([{ snapshot, stockBoundaryCrossed: true }])),
    { from: "dashboard", mode: "action" },
  );
}

/**
 * Turns the bundle on with these items, or off. One transaction: on sets
 * `is_bundle` then replaces the items; off deletes the items first, since the
 * 0188 guard refuses turning it off while items exist.
 */
export async function saveBundle(input: { storeId: string; productId: string; isBundle: boolean; items: unknown }): Promise<SaveBundleResult> {
  try {
    const productId = String(input?.productId ?? "");
    if (!UUID.test(productId)) return { success: false, error: "notFound" };
    const ctx = await requireStoreProduct(input?.storeId, productId, { forWrite: true });
    const { sellerId } = ctx.seller;
    if (!limiter.check(`bundles:${sellerId}`)) return { success: false, error: "rateLimited" };

    const [bundle] = await db
      .select({
        storeId: products.storeId,
        isBundle: products.isBundle,
        hasVariants: sql<boolean>`${sql`EXISTS (SELECT 1 FROM ${productVariants} v WHERE v.product_id = ${products.id})`}`,
        isItemOfBundle: sql<boolean>`${sql`EXISTS (SELECT 1 FROM ${productBundleItems} b WHERE b.item_product_id = ${products.id})`}`,
        productType: products.productType,
      })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), isNull(products.deletedAt), ctx.inStore))
      .limit(1);
    // The items' rows need the bundle's store (NOT NULL; the guard compares it).
    if (!bundle?.storeId) return { success: false, error: "notFound" };
    const bundleStoreId = bundle.storeId;

    if (input?.isBundle !== true) {
      if (bundle.isBundle) {
        await db.transaction(async (tx) => {
          await tx.delete(productBundleItems).where(and(eq(productBundleItems.bundleProductId, productId), eq(productBundleItems.sellerId, sellerId)));
          // A bundle had `track_stock` forced off (0188); a normal product tracks its stock again, so it
          // can't silently sell without limit. Pre-order still forces it off (0179 trigger).
          await tx
            .update(products)
            .set({ isBundle: false, trackStock: true, updatedAt: new Date().toISOString() })
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)));
        });
        await afterSave(sellerId, productId);
      }
      return { success: true, state: await loadBundle(ctx.store.id, productId) };
    }

    if (!bundle.isBundle) {
      const blocked = bundleBlockedReason(bundle);
      if (blocked) return { success: false, error: blocked };
    }
    const parsed = validateBundleItems(productId, input?.items);
    if (!parsed.ok) return { success: false, error: parsed.error };
    const items = parsed.items.slice(0, BUNDLE_MAX_ITEMS);

    // Every item: this seller, the bundle's store, the page's store condition.
    const ids = [...new Set(items.map((item) => item.productId))];
    const [found, variants] = await Promise.all([
      db
        .select({
          id: products.id,
          isBundle: products.isBundle,
          deletedAt: products.deletedAt,
          purgedAt: products.purgedAt,
          preorderEnabled: products.preorderEnabled,
          productType: products.productType,
        })
        .from(products)
        .where(and(inArray(products.id, ids), eq(products.sellerId, sellerId), eq(products.storeId, bundleStoreId), ctx.inStore)),
      loadVariants(ids),
    ]);
    const byId = new Map(found.map((row) => [row.id, row]));
    for (const item of items) {
      const row = byId.get(item.productId);
      if (!row) return { success: false, error: "notFound" };
      const problem = bundleItemProblem({
        isBundle: row.isBundle,
        trashed: row.deletedAt != null || row.purgedAt != null,
        preorder: row.preorderEnabled,
        digital: row.productType === "digital",
        variantIds: (variants.get(row.id) ?? []).map((variant) => variant.id),
        variantId: item.variantId,
      });
      if (problem) return { success: false, error: problem };
    }

    await db.transaction(async (tx) => {
      if (!bundle.isBundle) {
        await tx
          .update(products)
          .set({ isBundle: true, updatedAt: new Date().toISOString() })
          .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)));
      }
      await tx.delete(productBundleItems).where(and(eq(productBundleItems.bundleProductId, productId), eq(productBundleItems.sellerId, sellerId)));
      await tx.insert(productBundleItems).values(
        items.map((item, position) => ({
          sellerId,
          storeId: bundleStoreId,
          bundleProductId: productId,
          itemProductId: item.productId,
          itemVariantId: item.variantId,
          quantity: item.quantity,
          position,
        })),
      );
    });

    await afterSave(sellerId, productId);
    return { success: true, state: await loadBundle(ctx.store.id, productId) };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    const guard = bundleCheckError(error);
    if (guard) return { success: false, error: guard };
    console.error("[bundles] save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

async function afterSave(sellerId: string, productId: string): Promise<void> {
  await invalidateBundleProduct(sellerId, productId);
  revalidateDashboardPath(STORE_PRODUCTS_PATTERN, "page");
  revalidateDashboardPath(`${STORE_PRODUCTS_PATTERN}/[productId]/edit`, "page");
}
