"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { applyInvalidation, invalidateStoreProducts } from "@workspace/cache";
import {
  and,
  db,
  eq,
  inArray,
  isNull,
  or,
  productTranslations,
  products,
  sellerCategoryProductPositions,
  sellerProductCategories,
  sql,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { taxonomyInStore, type TaxonomyScope } from "@workspace/lib/stores/scope/server";
import { requireProductStore, taxonomyScopeOf, type ProductStoreContext } from "@/lib/products/product-store.server";
import { priceDisplay } from "../bulk-edit/bulk-edit.lib";
import {
  CATEGORY_ORDER_MAX_PRODUCTS,
  saveCategoryOrderSchema,
  type CategoryOrderError,
  type CategoryOrderLoadResult,
  type CategoryOrderProduct,
  type CategoryOrderSaveResult,
} from "./category-order.dto";
import { positionsFor } from "./category-order.lib";
import { STORE_PRODUCTS_PATTERN } from "@/lib/products/product-routes.lib";

/**
 * Products › Categories › "Arrange products" (ROADMAP.md F-24d, 0128). The
 * seller comes from the session; a category is used only when it is in the
 * page's store list (F-87d, `taxonomyInStore`: the seller's list before the
 * split, `store_id` = the store after it), and only the products of
 * the page's store in it can be placed or cleared (F-87c: the store must be the
 * seller's, products filtered with `productInStore`, scope `managed`; before
 * the split that is every product of the seller, as before). The
 * products are the ones the store's category page shows: linked to the
 * category, plus unlinked ones of the Tallaby category it was picked from
 * (same rule as `storeCategoryGroups`), and for a main category the same for
 * each of its sub-categories (0171). Positions stay keyed by the category the
 * seller arranges. Saving clears the seller's storefront
 * product caches (seller-scoped tags).
 */

function failure(error: unknown, label: string): { success: false; error: CategoryOrderError } {
  if (isAccessError(error)) {
    const readOnly = error.code === "seller_blocked" || error.code === "store_read_only";
    return { success: false, error: readOnly ? "readOnly" : "notFound" };
  }
  console.error(`[category-order] ${label} failed`, error);
  return { success: false, error: "generic" };
}

type ScopeCategory = { id: string; sourceId: string | null };
/** The arranged category and, for a main category, its sub-categories (0171): their products show on its page too. */
type OwnedCategory = ScopeCategory & { covers: ScopeCategory[] };

async function ownedCategory(ctx: ProductStoreContext, categoryId: string): Promise<OwnedCategory | null> {
  const scope: TaxonomyScope = taxonomyScopeOf(ctx);
  // One query: the category and its sub-categories, both from the page's store list.
  const rows = await db
    .select({ id: sellerProductCategories.id, sourceId: sellerProductCategories.sourceCategoryId, parentId: sellerProductCategories.parentId })
    .from(sellerProductCategories)
    .where(
      and(
        or(eq(sellerProductCategories.id, categoryId), eq(sellerProductCategories.parentId, categoryId)),
        taxonomyInStore(sellerProductCategories, scope),
      ),
    );
  const row = rows.find((r) => r.id === categoryId);
  if (!row) return null;
  const self = { id: row.id, sourceId: row.sourceId };
  const children = row.parentId ? [] : rows.filter((r) => r.id !== categoryId).map((r) => ({ id: r.id, sourceId: r.sourceId }));
  return { ...self, covers: [self, ...children] };
}

function inCategory(sellerId: string, inStore: SQL, category: OwnedCategory) {
  return and(
    eq(products.sellerId, sellerId),
    inStore,
    isNull(products.deletedAt),
    isNull(products.purgedAt),
    // Each covered category by today's rule: linked to it, or unlinked from the Tallaby category it was picked from.
    or(
      ...category.covers.map((c) =>
        or(
          eq(products.sellerCategoryId, c.id),
          c.sourceId ? and(isNull(products.sellerCategoryId), eq(products.categoryId, c.sourceId)) : undefined,
        ),
      ),
    ),
  );
}

/** Positions of this store's products only: saving or resetting through one store never clears another's. */
function storePositions(inStore: SQL) {
  return inArray(sellerCategoryProductPositions.productId, db.select({ id: products.id }).from(products).where(inStore));
}

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** The category's products in their current "Featured" order. */
export async function loadCategoryProductOrder(storeId: string, categoryId: unknown): Promise<CategoryOrderLoadResult> {
  try {
    const ctx = await requireProductStore(storeId, { read: true });
    const { seller, inStore } = ctx;
    if (!isUuid(categoryId)) return { success: false, error: "invalidInput" };
    const category = await ownedCategory(ctx, categoryId);
    if (!category) return { success: false, error: "notFound" };
    const locale = await getLocale();

    const position = sql<number | null>`(SELECT ${sellerCategoryProductPositions.position} FROM ${sellerCategoryProductPositions} WHERE ${sellerCategoryProductPositions.sellerCategoryId} = ${category.id} AND ${sellerCategoryProductPositions.productId} = ${products.id})`;
    const rows = await db
      .select({
        id: products.id,
        status: products.status,
        images: products.images,
        price: products.price,
        position,
      })
      .from(products)
      .where(inCategory(seller.sellerId, inStore, category))
      .orderBy(sql`${position} ASC NULLS LAST`, sql`${products.createdAt} DESC`, products.id)
      .limit(CATEGORY_ORDER_MAX_PRODUCTS + 1);

    const shown = rows.slice(0, CATEGORY_ORDER_MAX_PRODUCTS);
    const titles = shown.length
      ? await db
          .select({ productId: productTranslations.productId, locale: productTranslations.locale, title: productTranslations.title })
          .from(productTranslations)
          .where(inArray(productTranslations.productId, shown.map((r) => r.id)))
      : [];

    const out: CategoryOrderProduct[] = shown.map((row) => {
      const own = titles.filter((t) => t.productId === row.id);
      const images = Array.isArray(row.images) ? row.images.filter((i): i is string => typeof i === "string" && i.trim() !== "") : [];
      return {
        id: row.id,
        title: own.find((t) => t.locale === locale)?.title || own.find((t) => t.title)?.title || "",
        image: images[0] ?? null,
        status: row.status,
        price: priceDisplay(row.price).final,
        placed: row.position != null,
      };
    });
    return { success: true, products: out, truncated: rows.length > CATEGORY_ORDER_MAX_PRODUCTS };
  } catch (error) {
    return failure(error, "load");
  }
}

async function afterChange(sellerId: string, storeId: string) {
  // This store's grids (productTags.store), and still every grid of the seller until the catalog split (F-87c).
  await applyInvalidation(invalidateStoreProducts(sellerId, storeId), { from: "dashboard", mode: "action" });
  revalidatePath(`${STORE_PRODUCTS_PATTERN}/categories`, "page");
}

/** Saves the order: the listed products get positions 0..n-1, the rest of the category follows newest first. */
export async function saveCategoryProductOrder(storeId: string, input: unknown): Promise<CategoryOrderSaveResult> {
  try {
    const ctx = await requireProductStore(storeId);
    const { seller, store, inStore } = ctx;
    const parsed = saveCategoryOrderSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    const category = await ownedCategory(ctx, parsed.data.categoryId);
    if (!category) return { success: false, error: "notFound" };

    const ids = parsed.data.productIds;
    const eligible = ids.length
      ? await db
          .select({ id: products.id })
          .from(products)
          .where(and(inCategory(seller.sellerId, inStore, category), inArray(products.id, ids)))
      : [];
    const rows = positionsFor(
      ids,
      eligible.map((r) => r.id),
    );
    if (!rows) return { success: false, error: "notFound" };

    await db.transaction(async (tx) => {
      await tx
        .delete(sellerCategoryProductPositions)
        .where(
          and(
            eq(sellerCategoryProductPositions.sellerCategoryId, category.id),
            eq(sellerCategoryProductPositions.sellerId, seller.sellerId),
            storePositions(inStore),
          ),
        );
      if (rows.length) {
        await tx.insert(sellerCategoryProductPositions).values(
          rows.map((r) => ({ sellerCategoryId: category.id, productId: r.productId, sellerId: seller.sellerId, position: r.position })),
        );
      }
    });
    await afterChange(seller.sellerId, store.id);
    return { success: true };
  } catch (error) {
    return failure(error, "save");
  }
}

/** Forgets the manual order: the category goes back to newest first. */
export async function resetCategoryProductOrder(storeId: string, categoryId: unknown): Promise<CategoryOrderSaveResult> {
  try {
    const ctx = await requireProductStore(storeId);
    const { seller, store, inStore } = ctx;
    if (!isUuid(categoryId)) return { success: false, error: "invalidInput" };
    const category = await ownedCategory(ctx, categoryId);
    if (!category) return { success: false, error: "notFound" };
    await db
      .delete(sellerCategoryProductPositions)
      .where(
        and(
          eq(sellerCategoryProductPositions.sellerCategoryId, category.id),
          eq(sellerCategoryProductPositions.sellerId, seller.sellerId),
          storePositions(inStore),
        ),
      );
    await afterChange(seller.sellerId, store.id);
    return { success: true };
  } catch (error) {
    return failure(error, "reset");
  }
}
