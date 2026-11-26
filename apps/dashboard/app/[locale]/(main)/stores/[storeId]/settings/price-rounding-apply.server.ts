"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateProduct, mergeInvalidations, type ProductCacheSnapshot } from "@workspace/cache";
import { and, db, desc, eq, isNull, productTranslations, productVariants, products, sql, stores } from "@workspace/db";
import { parsePriceRounding, type PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { getLocale } from "next-intl/server";
import type { SQL } from "drizzle-orm";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { STORE_PRODUCTS_PATTERN } from "@/lib/products/product-routes.lib";
import type { ProductStatus } from "@/lib/products/product-status.lib";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  STORE_PRICE_ROUNDING_MAX_PRODUCTS,
  STORE_PRICE_ROUNDING_PREVIEW_ROWS,
  planStoreRounding,
  toChangeView,
  type PriceChange,
  type ProductRoundingPlan,
} from "./price-rounding-apply.lib";
import type { PriceRoundingApplyError, PriceRoundingApplyResult, PriceRoundingPreviewResult } from "./price-rounding-apply.dto";

/**
 * Store settings › General › Round prices › "Round existing prices"
 * (ROADMAP.md F-112c). The client sends only the store id; it is checked
 * against the session's seller (requireProductStore, forWrite: blocks
 * read-only stores and support accounts), and every query is scoped by the
 * seller, the store (`inStore`) and skips products in Trash (CLAUDE.md rule 5).
 * The rule is always the SAVED one, read on the server; apply recomputes every
 * price from rows locked in its transaction and never trusts the preview.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const previewLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });
const applyLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/** Rows per `UPDATE … FROM (VALUES …)` (3 parameters a row, well under the bind limit). */
const UPDATE_CHUNK = 500;

class ApplyError extends Error {
  constructor(readonly code: PriceRoundingApplyError) {
    super(code);
  }
}

function failure(error: unknown, label: string): { success: false; error: PriceRoundingApplyError } {
  if (error instanceof ApplyError) return { success: false, error: error.code };
  if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  console.error(`[store-price-rounding] ${label} failed`, (error as Error)?.message);
  return { success: false, error: "generic" };
}

function publicImage(path: unknown): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

/** The store's saved rule when on; `ruleOff` otherwise. Locked FOR SHARE inside the apply transaction. */
async function loadRule(q: Queryable, sellerId: string, storeId: string, lock: boolean): Promise<PriceRoundingRule> {
  const base = q
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
  const [row] = lock ? await base.for("share") : await base;
  if (!row) throw new ApplyError("notFound");
  const rule = parsePriceRounding(row.settings);
  if (!rule) throw new ApplyError("ruleOff");
  return rule;
}

type Scope = { sellerId: string; inStore: SQL };

const ownProducts = ({ sellerId, inStore }: Scope) => and(eq(products.sellerId, sellerId), isNull(products.deletedAt), inStore);

/**
 * Query 1: the store's products (not in Trash), newest first, with what the
 * preview shows (title in `locale`, first image) or what the cache purge needs
 * (slugs, category, flags). Capped at MAX + 1 to detect a store that is too big.
 */
async function loadProducts(q: Queryable, scope: Scope, locale: string, lock: boolean) {
  const base = q
    .select({
      id: products.id,
      sellerId: products.sellerId,
      storeId: products.storeId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      status: products.status,
      isFeatured: products.isFeatured,
      isTrending: products.isTrending,
      isSeasonal: products.isSeasonal,
      isMostSelling: products.isMostSelling,
      isPlatformChoice: products.isPlatformChoice,
      sponsored: products.sponsored,
      price: products.price,
      image: sql<unknown>`${products.images}->0`,
      title: sql<string | null>`coalesce(
        (SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = ${locale} AND t.title <> '' LIMIT 1),
        (SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.title <> '' ORDER BY t.locale LIMIT 1)
      )`,
      slugs: sql<{ locale: string; slug: string | null }[] | null>`(
        SELECT json_agg(json_build_object('locale', t.locale, 'slug', t.slug)) FROM ${productTranslations} t WHERE t.product_id = ${products.id}
      )`,
    })
    .from(products)
    .where(ownProducts(scope))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(STORE_PRICE_ROUNDING_MAX_PRODUCTS + 1);
  const rows = lock ? await base.for("update", { of: products }) : await base;
  if (rows.length > STORE_PRICE_ROUNDING_MAX_PRODUCTS) throw new ApplyError("tooMany");
  return rows;
}

/** Query 2: the variants of those products, joined on the same seller + store + not-in-Trash condition. */
async function loadVariants(q: Queryable, scope: Scope) {
  return q
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      title: productVariants.title,
      price: productVariants.price,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(ownProducts(scope))
    .orderBy(productVariants.productId, productVariants.position);
}

type LoadedProduct = Awaited<ReturnType<typeof loadProducts>>[number];

async function planFor(q: Queryable, scope: Scope, rule: PriceRoundingRule, locale: string, lock: boolean) {
  // Sequential: inside a transaction both queries share one connection.
  const productRows = await loadProducts(q, scope, locale, lock);
  const variantRows = productRows.length ? await loadVariants(q, scope) : [];
  return { productRows, ...planStoreRounding(productRows, variantRows, rule) };
}

/** Before → after of every price the saved rule would change; writes nothing. */
export async function previewStorePriceRounding(storeId: unknown): Promise<PriceRoundingPreviewResult> {
  try {
    const { seller, store, inStore } = await requireProductStore(storeId, { forWrite: true });
    if (!previewLimiter.check(`store-price-rounding-preview:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const locale = await getLocale();
    const rule = await loadRule(db, seller.sellerId, store.id, false);
    const { productRows, plans, productCount, variantCount } = await planFor(db, { sellerId: seller.sellerId, inStore }, rule, locale, false);

    const byId = new Map(productRows.map((row) => [row.id, row]));
    const rows = plans.slice(0, STORE_PRICE_ROUNDING_PREVIEW_ROWS).map((plan) => {
      const row = byId.get(plan.id)!;
      return {
        id: plan.id,
        title: row.title ?? "",
        image: publicImage(row.image),
        change: plan.change ? toChangeView(plan.change) : null,
        variants: plan.variants.map((v) => ({ id: v.id, title: v.title ?? "", change: toChangeView(v.change) })),
      };
    });
    return { success: true, productCount, variantCount, rows, more: Math.max(0, plans.length - rows.length) };
  } catch (error) {
    return failure(error, "preview");
  }
}

/** `UPDATE … FROM (VALUES (id, prev, next) …)`, guarded on the price still being `prev`. Returns the updated ids. */
async function updateProductPrices(tx: Tx, scope: Scope, changes: { id: string; change: PriceChange }[]): Promise<Set<string>> {
  const done = new Set<string>();
  for (let i = 0; i < changes.length; i += UPDATE_CHUNK) {
    const values = sql.join(
      changes
        .slice(i, i + UPDATE_CHUNK)
        .map(({ id, change }) => sql`(${id}::uuid, ${JSON.stringify(change.prev)}::jsonb, ${JSON.stringify(change.next)}::jsonb)`),
      sql`, `,
    );
    const rows = await tx.execute<{ id: string }>(sql`
      UPDATE ${products} SET price = v.next, updated_at = now()
      FROM (VALUES ${values}) AS v(id, prev, next)
      WHERE ${products.id} = v.id AND ${products.price} = v.prev AND ${ownProducts(scope)}
      RETURNING ${products.id} AS id
    `);
    for (const row of rows as unknown as { id: string }[]) done.add(row.id);
  }
  return done;
}

/** Same for variants; a removed discount also clears the variant's own `discount_ends_at`. */
async function updateVariantPrices(
  tx: Tx,
  scope: Scope,
  changes: { id: string; productId: string; change: PriceChange }[],
): Promise<{ products: Set<string>; count: number }> {
  const done = new Set<string>();
  let count = 0;
  for (let i = 0; i < changes.length; i += UPDATE_CHUNK) {
    const values = sql.join(
      changes
        .slice(i, i + UPDATE_CHUNK)
        .map(
          ({ id, productId, change }) =>
            sql`(${id}::uuid, ${productId}::uuid, ${JSON.stringify(change.prev)}::jsonb, ${JSON.stringify(change.next)}::jsonb, ${change.discountRemoved}::boolean)`,
        ),
      sql`, `,
    );
    const rows = await tx.execute<{ product_id: string }>(sql`
      UPDATE ${productVariants}
      SET price = v.next,
          discount_ends_at = CASE WHEN v.clear THEN NULL ELSE ${productVariants.discountEndsAt} END,
          updated_at = now()
      FROM (VALUES ${values}) AS v(id, product_id, prev, next, clear)
      WHERE ${productVariants.id} = v.id
        AND ${productVariants.productId} = v.product_id
        AND ${productVariants.price} = v.prev
        AND ${productVariants.productId} IN (SELECT ${products.id} FROM ${products} WHERE ${ownProducts(scope)})
      RETURNING ${productVariants.productId} AS product_id
    `);
    for (const row of rows as unknown as { product_id: string }[]) {
      done.add(row.product_id);
      count += 1;
    }
  }
  return { products: done, count };
}

function snapshot(row: LoadedProduct, price: unknown): ProductCacheSnapshot {
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.slugs ?? [],
    status: row.status as ProductStatus,
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(price ?? null),
  };
}

/** Rounds every price of the store with the saved rule, in one transaction. */
export async function applyStorePriceRounding(storeId: unknown): Promise<PriceRoundingApplyResult> {
  try {
    const { seller, store, inStore } = await requireProductStore(storeId, { forWrite: true });
    if (!applyLimiter.check(`store-price-rounding-apply:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const locale = await getLocale();
    const scope: Scope = { sellerId: seller.sellerId, inStore };

    const result = await db.transaction(async (tx) => {
      const rule = await loadRule(tx, seller.sellerId, store.id, true);
      const { productRows, plans } = await planFor(tx, scope, rule, locale, true);
      const productChanges = plans.flatMap((p) => (p.change ? [{ id: p.id, change: p.change }] : []));
      const variantChanges = plans.flatMap((p) => p.variants.map((v) => ({ id: v.id, productId: p.id, change: v.change })));
      const updatedProducts = await updateProductPrices(tx, scope, productChanges);
      const variants = await updateVariantPrices(tx, scope, variantChanges);
      return { productRows, plans, updatedProducts, touchedByVariants: variants.products, variantCount: variants.count };
    });

    const byId = new Map(result.productRows.map((row) => [row.id, row]));
    const touched: ProductRoundingPlan[] = result.plans.filter((p) => result.updatedProducts.has(p.id) || result.touchedByVariants.has(p.id));
    // Same purge as bulk edit's price change (bulk-edit.server.ts afterWrite): one invalidateProduct per changed product.
    if (touched.length) {
      const invalidations = touched.map((plan) => {
        const row = byId.get(plan.id)!;
        const after = plan.change && result.updatedProducts.has(plan.id) ? plan.change.next : row.price;
        return invalidateProduct(snapshot(row, row.price), snapshot(row, after));
      });
      await applyInvalidation(mergeInvalidations(...invalidations), { from: "dashboard", mode: "action" });
    }
    revalidateDashboardPath(STORE_PRODUCTS_PATTERN, "layout");

    return { success: true, productCount: result.updatedProducts.size, variantCount: result.variantCount };
  } catch (error) {
    return failure(error, "apply");
  }
}
