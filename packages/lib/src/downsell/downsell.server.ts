import {
  and,
  asc,
  coupons,
  db,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
  productDownsells,
  products,
  productTranslations,
  productVariants,
  sql,
  storeAppInstalls,
} from "@workspace/db";
import { getPriceFinal } from "../utils/parse-price-json";
import { couponInStore, productInStore } from "../stores/store-scope.server";
import { DOWNSELL_APP, DOWNSELL_LIMIT, isCheaperPrice, pickDownsellLine, type DownsellSaveInput } from "./downsell.lib";
import { applyBundleAvailability } from "../products/bundles.server";

/**
 * Downsell (ROADMAP.md F-116, 0185). Server-only. Callers pass the session's
 * seller and a store they checked (`requireStore`) or the request host's store;
 * every query filters on both, and every product or coupon id from the client
 * is checked to be this store's before it is saved (CLAUDE.md rule 5).
 *
 * Until 0185 is applied, every read returns "not available" / no offer and
 * every write returns `unavailable`, so nothing breaks (Postgres 42P01).
 */

type Scope = { sellerId: string; storeId: string; catalogSplit: boolean };

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.cause?.code ?? e?.code;
}

/** True when 0185 is not applied yet. */
export function isDownsellTableMissing(error: unknown): boolean {
  return pgErrorCode(error) === "42P01";
}

function logFailure(what: string, error: unknown) {
  if (isDownsellTableMissing(error)) return;
  console.error(`[downsell] ${what} failed`, pgErrorCode(error) ?? (error instanceof Error ? error.name : "error"));
}

/** Is the app on for this store? */
export async function isDownsellAppInstalled(storeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: storeAppInstalls.id })
    .from(storeAppInstalls)
    .where(and(eq(storeAppInstalls.storeId, storeId), eq(storeAppInstalls.appKey, DOWNSELL_APP), isNull(storeAppInstalls.uninstalledAt)))
    .limit(1);
  return Boolean(row);
}

/** A coupon that can still be used now (the coupon flow checks it again, with the cart). */
const couponUsableNow = () =>
  and(
    eq(coupons.isActive, true),
    lte(coupons.startsAt, sql`now()`),
    gt(coupons.expiresAt, sql`now()`),
    or(isNull(coupons.usageLimit), sql`coalesce(${coupons.usageCount}, 0) < ${coupons.usageLimit}`),
  );

async function titlesFor(productIds: string[], locale: string): Promise<Map<string, { title: string; slug: string | null }>> {
  if (productIds.length === 0) return new Map();
  const rows = await db
    .select({ productId: productTranslations.productId, locale: productTranslations.locale, title: productTranslations.title, slug: productTranslations.slug })
    .from(productTranslations)
    .where(inArray(productTranslations.productId, productIds));
  const out = new Map<string, { title: string; slug: string | null }>();
  for (const id of productIds) {
    const own = rows.filter((row) => row.productId === id);
    const pick = own.find((row) => row.locale === locale) ?? own[0];
    if (pick) out.set(id, { title: pick.title, slug: pick.slug });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type StoreDownsellRow = {
  productId: string;
  productTitle: string;
  offer:
    | { kind: "product"; productId: string; title: string; active: boolean }
    | { kind: "coupon"; couponId: string; code: string; name: string; usable: boolean };
};

export type StoreDownsellList = { available: false } | { available: true; rows: StoreDownsellRow[] };

/** The store's offers with their names (product titles in `locale`, else any). */
export async function listStoreDownsells(scope: Scope, locale: string): Promise<StoreDownsellList> {
  try {
    const rows = await db
      .select()
      .from(productDownsells)
      .where(and(eq(productDownsells.sellerId, scope.sellerId), eq(productDownsells.storeId, scope.storeId)))
      .orderBy(asc(productDownsells.createdAt))
      .limit(DOWNSELL_LIMIT);
    if (rows.length === 0) return { available: true, rows: [] };
    const productIds = [...new Set(rows.flatMap((row) => [row.productId, ...(row.offerProductId ? [row.offerProductId] : [])]))];
    const couponIds = [...new Set(rows.flatMap((row) => (row.couponId ? [row.couponId] : [])))];
    const [titles, activeIds, couponRows] = await Promise.all([
      titlesFor(productIds, locale),
      db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.sellerId, scope.sellerId),
            eq(products.status, "active"),
            isNull(products.deletedAt),
            productInStore(scope.storeId, { catalogSplit: scope.catalogSplit, scope: "shown" }),
          ),
        ),
      couponIds.length
        ? db
            .select({ id: coupons.id, code: coupons.code, name: coupons.name, usable: sql<boolean>`${couponUsableNow()}` })
            .from(coupons)
            .where(and(inArray(coupons.id, couponIds), eq(coupons.sellerId, scope.sellerId)))
        : Promise.resolve([]),
    ]);
    const active = new Set(activeIds.map((row) => row.id));
    const out: StoreDownsellRow[] = [];
    for (const row of rows) {
      const productTitle = titles.get(row.productId)?.title ?? "";
      if (row.offerProductId) {
        out.push({
          productId: row.productId,
          productTitle,
          offer: { kind: "product", productId: row.offerProductId, title: titles.get(row.offerProductId)?.title ?? "", active: active.has(row.offerProductId) },
        });
      } else if (row.couponId) {
        const coupon = couponRows.find((c) => c.id === row.couponId);
        if (!coupon) continue;
        out.push({ productId: row.productId, productTitle, offer: { kind: "coupon", couponId: coupon.id, code: coupon.code, name: coupon.name, usable: coupon.usable === true } });
      }
    }
    return { available: true, rows: out };
  } catch (error) {
    if (isDownsellTableMissing(error)) return { available: false };
    throw error;
  }
}

/** Coupons the seller can pick: usable now and valid in this store. */
export async function listDownsellCoupons(scope: Pick<Scope, "sellerId" | "storeId">): Promise<{ id: string; code: string; name: string }[]> {
  return db
    .select({ id: coupons.id, code: coupons.code, name: coupons.name })
    .from(coupons)
    .where(and(eq(coupons.sellerId, scope.sellerId), couponInStore(scope.storeId), couponUsableNow()))
    .orderBy(asc(coupons.code))
    .limit(200);
}

export type DownsellSaveError = "unavailable" | "not_found" | "offer_not_found" | "not_cheaper" | "same_product" | "limit";

/**
 * Saves the product's one offer (replacing an older one). The main product must
 * be the store's; an offer product must be the store's, active, not in Trash and
 * cheaper than the main product; a coupon must be the seller's, valid in this
 * store and usable now.
 */
export async function saveProductDownsell(
  scope: Scope,
  input: DownsellSaveInput,
): Promise<{ success: true } | { success: false; error: DownsellSaveError }> {
  const { productId, offer } = input;
  try {
    const managed = productInStore(scope.storeId, { catalogSplit: scope.catalogSplit, scope: "managed" });
    const [main] = await db
      .select({ id: products.id, price: products.price })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.sellerId, scope.sellerId), isNull(products.deletedAt), managed))
      .limit(1);
    if (!main) return { success: false, error: "not_found" };

    let offerProductId: string | null = null;
    let couponId: string | null = null;
    if (offer.kind === "product") {
      if (offer.productId === productId) return { success: false, error: "same_product" };
      const [cheaper] = await db
        .select({ id: products.id, price: products.price })
        .from(products)
        .where(
          and(
            eq(products.id, offer.productId),
            eq(products.sellerId, scope.sellerId),
            eq(products.status, "active"),
            isNull(products.deletedAt),
            productInStore(scope.storeId, { catalogSplit: scope.catalogSplit, scope: "shown" }),
          ),
        )
        .limit(1);
      if (!cheaper) return { success: false, error: "offer_not_found" };
      const toMinor = (price: unknown) => Math.round(getPriceFinal(price) * 100);
      if (!isCheaperPrice(toMinor(cheaper.price), toMinor(main.price))) return { success: false, error: "not_cheaper" };
      offerProductId = cheaper.id;
    } else {
      const [coupon] = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(and(eq(coupons.id, offer.couponId), eq(coupons.sellerId, scope.sellerId), couponInStore(scope.storeId), couponUsableNow()))
        .limit(1);
      if (!coupon) return { success: false, error: "offer_not_found" };
      couponId = coupon.id;
    }

    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productDownsells)
      .where(and(eq(productDownsells.storeId, scope.storeId), sql`${productDownsells.productId} <> ${productId}`));
    if (count >= DOWNSELL_LIMIT) return { success: false, error: "limit" };

    await db
      .insert(productDownsells)
      .values({ sellerId: scope.sellerId, storeId: scope.storeId, productId, offerProductId, couponId })
      .onConflictDoUpdate({
        target: [productDownsells.storeId, productDownsells.productId],
        set: { offerProductId, couponId, updatedAt: sql`now()` },
        // The row is this seller's store's (store_id is checked above); never touch another seller's.
        setWhere: eq(productDownsells.sellerId, scope.sellerId),
      });
    return { success: true };
  } catch (error) {
    if (isDownsellTableMissing(error)) return { success: false, error: "unavailable" };
    throw error;
  }
}

/** Removes the product's offer. Missing table or row: nothing to do. */
export async function deleteProductDownsell(scope: Pick<Scope, "sellerId" | "storeId">, productId: string): Promise<{ success: boolean }> {
  try {
    await db
      .delete(productDownsells)
      .where(and(eq(productDownsells.sellerId, scope.sellerId), eq(productDownsells.storeId, scope.storeId), eq(productDownsells.productId, productId)));
    return { success: true };
  } catch (error) {
    if (isDownsellTableMissing(error)) return { success: false };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Storefront checkout
// ---------------------------------------------------------------------------

/** What the checkout shows. Never a coupon code: the server applies it. */
export type CheckoutDownsell = {
  lineId: string;
  mainTitle: string;
  offer:
    | { kind: "product"; productId: string; title: string; image: string | null; slug: string | null; unitMinor: number; mainUnitMinor: number; hasVariants: boolean }
    | { kind: "coupon"; name: string; discountType: string; discountValue: number };
};

export type CheckoutDownsellLine = { lineId: string; productId: string; unitMinor: number };

/** The raw offer row for one product of the store, or null (also before 0185). */
export async function findProductDownsell(sellerId: string, storeId: string, productId: string) {
  try {
    const [row] = await db
      .select()
      .from(productDownsells)
      .where(and(eq(productDownsells.sellerId, sellerId), eq(productDownsells.storeId, storeId), eq(productDownsells.productId, productId)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logFailure("find", error);
    return null;
  }
}

/** A usable coupon of the store's seller, valid in this store, or null. */
export async function findUsableStoreCoupon(sellerId: string, storeId: string, couponId: string) {
  const [coupon] = await db
    .select({ id: coupons.id, code: coupons.code, name: coupons.name, discountType: coupons.discountType, discountValue: coupons.discountValue })
    .from(coupons)
    .where(and(eq(coupons.id, couponId), eq(coupons.sellerId, sellerId), couponInStore(storeId), couponUsableNow()))
    .limit(1);
  return coupon ?? null;
}

/**
 * The one offer to show on this cart's checkout: the first cart line with an
 * offer whose product is still sold by the store (active, in stock) or whose
 * coupon is still usable. Null when the app is off, there is none, or 0185 is
 * missing. Read fresh (it depends on stock and coupon state).
 */
export async function findCheckoutDownsell(input: {
  sellerId: string;
  storeId: string;
  catalogSplit: boolean;
  lines: readonly CheckoutDownsellLine[];
  locale: string;
}): Promise<CheckoutDownsell | null> {
  const { sellerId, storeId, catalogSplit, locale } = input;
  const lines = input.lines.slice(0, 50);
  if (lines.length === 0) return null;
  try {
    if (!(await isDownsellAppInstalled(storeId))) return null;
    const productIds = [...new Set(lines.map((line) => line.productId))];
    const rows = await db
      .select()
      .from(productDownsells)
      .where(and(eq(productDownsells.sellerId, sellerId), eq(productDownsells.storeId, storeId), inArray(productDownsells.productId, productIds)));
    if (rows.length === 0) return null;

    const offerProductIds = [...new Set(rows.flatMap((row) => (row.offerProductId ? [row.offerProductId] : [])))].filter(
      (id) => !productIds.includes(id),
    );
    const couponIds = [...new Set(rows.flatMap((row) => (row.couponId ? [row.couponId] : [])))];
    const [offerRows, variants, couponRows] = await Promise.all([
      offerProductIds.length
        ? db
            .select({ id: products.id, price: products.price, images: products.images, quantity: products.quantity, trackStock: products.trackStock, isBundle: products.isBundle })
            .from(products)
            .where(
              and(
                inArray(products.id, offerProductIds),
                eq(products.sellerId, sellerId),
                eq(products.status, "active"),
                isNull(products.deletedAt),
                productInStore(storeId, { catalogSplit, scope: "shown" }),
              ),
            )
        : Promise.resolve([]),
      offerProductIds.length
        ? db.select({ productId: productVariants.productId, stock: productVariants.stock }).from(productVariants).where(inArray(productVariants.productId, offerProductIds))
        : Promise.resolve([]),
      couponIds.length
        ? db
            .select({ id: coupons.id, name: coupons.name, discountType: coupons.discountType, discountValue: coupons.discountValue })
            .from(coupons)
            .where(and(inArray(coupons.id, couponIds), eq(coupons.sellerId, sellerId), couponInStore(storeId), couponUsableNow()))
        : Promise.resolve([]),
    ]);

    // A bundle offer's stock is its items' (0188, F-07f).
    const offerProducts = await applyBundleAvailability(storeId, offerRows);
    type Offer = { kind: "product"; unitMinor: number; id: string; image: string | null; hasVariants: boolean } | { kind: "coupon"; id: string; name: string; discountType: string; discountValue: number };
    const offers = new Map<string, Offer>();
    for (const row of rows) {
      if (row.offerProductId) {
        const product = offerProducts.find((p) => p.id === row.offerProductId);
        if (!product) continue;
        const own = variants.filter((v) => v.productId === product.id);
        const tracked = product.trackStock !== false;
        const inStock = own.length > 0 ? !tracked || own.some((v) => Number(v.stock ?? 0) > 0) : !tracked || Number(product.quantity ?? 0) > 0;
        if (!inStock) continue;
        offers.set(row.productId, {
          kind: "product",
          id: product.id,
          unitMinor: Math.round(getPriceFinal(product.price) * 100),
          image: (product.images as string[] | null)?.[0] ?? null,
          hasVariants: own.length > 0,
        });
      } else if (row.couponId) {
        const coupon = couponRows.find((c) => c.id === row.couponId);
        if (!coupon) continue;
        offers.set(row.productId, { kind: "coupon", id: coupon.id, name: coupon.name, discountType: coupon.discountType, discountValue: Number(coupon.discountValue) });
      }
    }
    const picked = pickDownsellLine(lines, offers);
    if (!picked) return null;
    const { line, offer } = picked;
    const titles = await titlesFor(offer.kind === "product" ? [line.productId, offer.id] : [line.productId], locale);
    return {
      lineId: line.lineId,
      mainTitle: titles.get(line.productId)?.title ?? "",
      offer:
        offer.kind === "product"
          ? {
              kind: "product",
              productId: offer.id,
              title: titles.get(offer.id)?.title ?? "",
              image: offer.image,
              slug: titles.get(offer.id)?.slug ?? null,
              unitMinor: offer.unitMinor,
              mainUnitMinor: line.unitMinor,
              hasVariants: offer.hasVariants,
            }
          : { kind: "coupon", name: offer.name, discountType: offer.discountType, discountValue: offer.discountValue },
    };
  } catch (error) {
    logFailure("checkout offer", error);
    return null;
  }
}
