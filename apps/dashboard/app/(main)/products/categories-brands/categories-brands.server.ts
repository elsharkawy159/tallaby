"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateSellerProducts } from "@workspace/cache";
import {
  and,
  asc,
  brands,
  categories,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  or,
  products,
  sellerProductBrands,
  sellerProductCategories,
  sql,
} from "@workspace/db";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import {
  SELLER_TAXONOMY_MAX_ITEMS,
  addTaxonomyItemSchema,
  ensureTaxonomyItemSchema,
  productTaxonomySchema,
  reorderTaxonomySchema,
  updateTaxonomyItemSchema,
  type PackSuggestion,
  type SellerTaxonomyItem,
  type SellerTaxonomyOption,
  type TaxonomyErrorKey,
  type TaxonomyKind,
  type TaxonomyResult,
} from "./categories-brands.dto";
import {
  TAXONOMY_PAGE_HREF,
  cleanTaxonomyName,
  escapeLike,
  isSellerTaxonomyImage,
  isUniqueViolation,
  taxonomyNameKey,
} from "./categories-brands.lib";

/**
 * Products › Categories and Products › Brands (0068). Every list belongs to the session's
 * seller: ids from the client are only ever matched together with that
 * seller_id, so another seller's items read and write as "not found".
 */

const SUGGESTION_LIMIT = 12;

function failure(error: unknown, scope: string): { success: false; error: TaxonomyErrorKey } {
  if (isAccessError(error)) {
    return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "notFound" };
  }
  if (isUniqueViolation(error)) return { success: false, error: "duplicate" };
  console.error(`[categories-brands] ${scope} failed`, error);
  return { success: false, error: "generic" };
}

/** Table and columns for each kind, so the actions are written once. */
function tableFor(kind: TaxonomyKind) {
  return kind === "category"
    ? { table: sellerProductCategories, source: sellerProductCategories.sourceCategoryId, image: sellerProductCategories.imageUrl }
    : { table: sellerProductBrands, source: sellerProductBrands.sourceBrandId, image: sellerProductBrands.logoUrl };
}

const isKind = (kind: unknown): kind is TaxonomyKind => kind === "category" || kind === "brand";

/** An image the client may set: none, or a file in the seller uploads folder. */
const isAllowedImage = (image: string | null | undefined): boolean =>
  image == null || isSellerTaxonomyImage(image, process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Search the Tallaby pack (admin-curated categories or brands) as the seller types. */
export async function searchTaxonomyPack(kind: TaxonomyKind, query: string): Promise<TaxonomyResult<PackSuggestion[]>> {
  try {
    await requireSeller();
    const term = typeof query === "string" ? query.trim().slice(0, 80) : "";
    if (!isKind(kind) || !term) return { success: true, data: [] };
    const pattern = `%${escapeLike(term)}%`;

    if (kind === "category") {
      const rows = await db
        .select({
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
          image: categories.imageUrl,
          parentName: sql<string | null>`(SELECT p.name FROM ${categories} p WHERE p.id = ${categories.parentId})`,
          parentNameAr: sql<string | null>`(SELECT p.name_ar FROM ${categories} p WHERE p.id = ${categories.parentId})`,
        })
        .from(categories)
        .where(or(ilike(categories.name, pattern), ilike(categories.nameAr, pattern)))
        .orderBy(desc(categories.productCount), asc(categories.name))
        .limit(SUGGESTION_LIMIT);
      return {
        success: true,
        data: rows.map((r) => ({ ...r, name: r.name ?? r.nameAr ?? "" })).filter((r) => r.name),
      };
    }

    const rows = await db
      .select({ id: brands.id, name: brands.name, image: brands.logoUrl })
      .from(brands)
      .where(ilike(brands.name, pattern))
      .orderBy(desc(brands.isVerified), desc(brands.productCount), asc(brands.name))
      .limit(SUGGESTION_LIMIT);
    return { success: true, data: rows.map((r) => ({ ...r, nameAr: null, parentName: null, parentNameAr: null })) };
  } catch (error) {
    return failure(error, "search");
  }
}

/** Add to the seller's list: a pack item (copied in) or the seller's own name. */
export async function addTaxonomyItem(kind: TaxonomyKind, input: unknown): Promise<TaxonomyResult<SellerTaxonomyItem>> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = addTaxonomyItemSchema.safeParse(input);
    if (!isKind(kind) || !parsed.success) return { success: false, error: "invalidInput" };
    if ("image" in parsed.data && !isAllowedImage(parsed.data.image)) return { success: false, error: "invalidImage" };
    const { table } = tableFor(kind);

    const [{ total }] = await db.select({ total: count() }).from(table).where(eq(table.sellerId, seller.sellerId));
    if ((total ?? 0) >= SELLER_TAXONOMY_MAX_ITEMS) return { success: false, error: "limit" };

    let values: { name: string; nameAr: string | null; sourceId: string | null; image: string | null };
    if ("sourceId" in parsed.data) {
      const source = await loadPackItem(kind, parsed.data.sourceId);
      if (!source) return { success: false, error: "notFound" };
      values = source;
    } else {
      values = {
        name: cleanTaxonomyName(parsed.data.name),
        nameAr: parsed.data.nameAr ? cleanTaxonomyName(parsed.data.nameAr) : null,
        sourceId: null,
        image: parsed.data.image ?? null,
      };
    }

    const position = sql<number>`(SELECT coalesce(max(t.position), -1) + 1 FROM ${table} t WHERE t.seller_id = ${seller.sellerId})`;
    const [row] =
      kind === "category"
        ? await db
            .insert(sellerProductCategories)
            .values({ sellerId: seller.sellerId, name: values.name, nameAr: values.nameAr, sourceCategoryId: values.sourceId, imageUrl: values.image, position })
            .returning({ id: sellerProductCategories.id })
        : await db
            .insert(sellerProductBrands)
            .values({ sellerId: seller.sellerId, name: values.name, nameAr: values.nameAr, sourceBrandId: values.sourceId, logoUrl: values.image, position })
            .returning({ id: sellerProductBrands.id });

    revalidatePath(TAXONOMY_PAGE_HREF[kind]);
    return { success: true, data: { id: row!.id, ...values, productCount: 0 } };
  } catch (error) {
    return failure(error, "add");
  }
}

/**
 * The product form's category: the seller's item with that name (English or
 * Arabic, case-insensitive) or picked from that Tallaby item, added to their
 * list when it isn't there yet.
 */
export async function ensureTaxonomyItem(kind: TaxonomyKind, input: unknown): Promise<TaxonomyResult<SellerTaxonomyOption>> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = ensureTaxonomyItemSchema.safeParse(input);
    if (!isKind(kind) || !parsed.success) return { success: false, error: "invalidInput" };
    const sourceId = "sourceId" in parsed.data ? parsed.data.sourceId : null;
    const source = sourceId ? await loadPackItem(kind, sourceId) : null;
    if (sourceId && !source) return { success: false, error: "notFound" };
    const names = source
      ? [source.name, source.nameAr].filter((n): n is string => Boolean(n))
      : [cleanTaxonomyName((parsed.data as { name: string }).name)];
    const { table, source: sourceColumn } = tableFor(kind);

    const findExisting = async () => {
      const keys = names.map(taxonomyNameKey);
      const byName = keys.flatMap((key) => [
        sql`lower(btrim(${table.name})) = ${key}`,
        sql`lower(btrim(${table.nameAr})) = ${key}`,
      ]);
      const [row] = await db
        .select({ id: table.id, name: table.name, nameAr: table.nameAr, sourceId: sourceColumn })
        .from(table)
        .where(and(eq(table.sellerId, seller.sellerId), or(...(sourceId ? [eq(sourceColumn, sourceId)] : []), ...byName)))
        // The item copied from this Tallaby one first, then a same-named one.
        .orderBy(sourceId ? sql`(${sourceColumn} IS NOT DISTINCT FROM ${sourceId}::uuid) DESC` : asc(table.position))
        .limit(1);
      return row;
    };

    const existing = await findExisting();
    if (existing) return { success: true, data: existing };

    const added = await addTaxonomyItem(kind, sourceId ? { sourceId } : { name: names[0] });
    if (added.success) {
      return {
        success: true,
        data: { id: added.data.id, name: added.data.name, nameAr: added.data.nameAr, sourceId: added.data.sourceId },
      };
    }
    // Added at the same moment (another tab, a double submit): use that one.
    if (added.error === "duplicate") {
      const raced = await findExisting();
      if (raced) return { success: true, data: raced };
    }
    return added;
  } catch (error) {
    return failure(error, "ensure");
  }
}

async function loadPackItem(kind: TaxonomyKind, id: string) {
  if (kind === "category") {
    const [row] = await db
      .select({ name: categories.name, nameAr: categories.nameAr, image: categories.imageUrl })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    const name = row?.name ?? row?.nameAr;
    return row && name ? { name: cleanTaxonomyName(name), nameAr: row.nameAr, sourceId: id, image: row.image } : null;
  }
  const [row] = await db.select({ name: brands.name, image: brands.logoUrl }).from(brands).where(eq(brands.id, id)).limit(1);
  return row ? { name: cleanTaxonomyName(row.name), nameAr: null, sourceId: id, image: row.image } : null;
}

/** Rename an item in the seller's list, and set or remove its image. */
export async function updateTaxonomyItem(kind: TaxonomyKind, id: string, input: unknown): Promise<TaxonomyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = updateTaxonomyItemSchema.safeParse(input);
    if (!isKind(kind) || !parsed.success || typeof id !== "string") return { success: false, error: "invalidInput" };
    const { image } = parsed.data;
    if (!isAllowedImage(image)) return { success: false, error: "invalidImage" };
    const patch = {
      name: cleanTaxonomyName(parsed.data.name),
      nameAr: parsed.data.nameAr ? cleanTaxonomyName(parsed.data.nameAr) : null,
      updatedAt: sql`now()`,
    };
    // `image` left out keeps the current one (e.g. a pack image path).
    const updated =
      kind === "category"
        ? await db
            .update(sellerProductCategories)
            .set(image === undefined ? patch : { ...patch, imageUrl: image })
            .where(and(eq(sellerProductCategories.id, id), eq(sellerProductCategories.sellerId, seller.sellerId)))
            .returning({ id: sellerProductCategories.id })
        : await db
            .update(sellerProductBrands)
            .set(image === undefined ? patch : { ...patch, logoUrl: image })
            .where(and(eq(sellerProductBrands.id, id), eq(sellerProductBrands.sellerId, seller.sellerId)))
            .returning({ id: sellerProductBrands.id });
    if (!updated.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF[kind]);
    // Storefront category tiles show this image (getStorefrontCategories is tagged by the seller products tag).
    if (kind === "category") await applyInvalidation(invalidateSellerProducts(seller.sellerId), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    return failure(error, "update");
  }
}

/** Remove an item; products that used it keep everything else (the link is set to null). */
export async function deleteTaxonomyItem(kind: TaxonomyKind, id: string): Promise<TaxonomyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!isKind(kind) || typeof id !== "string") return { success: false, error: "invalidInput" };
    const { table } = tableFor(kind);
    const deleted = await db
      .delete(table)
      .where(and(eq(table.id, id), eq(table.sellerId, seller.sellerId)))
      .returning({ id: table.id });
    if (!deleted.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF[kind]);
    if (kind === "category") await applyInvalidation(invalidateSellerProducts(seller.sellerId), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    return failure(error, "delete");
  }
}

/**
 * Save the list order. `ids` must be exactly the seller's items (a stale list,
 * after an add or delete in another tab, reads as "not found").
 */
export async function reorderTaxonomyItems(kind: TaxonomyKind, ids: unknown): Promise<TaxonomyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = reorderTaxonomySchema.safeParse(ids);
    if (!isKind(kind) || !parsed.success) return { success: false, error: "invalidInput" };
    const order = parsed.data;
    const { table } = tableFor(kind);

    const owned = await db.select({ id: table.id }).from(table).where(eq(table.sellerId, seller.sellerId));
    const ownedIds = new Set(owned.map((r) => r.id));
    if (owned.length !== order.length || !order.every((id) => ownedIds.has(id))) return { success: false, error: "notFound" };
    if (!order.length) return { success: true };

    const position = sql<number>`CASE ${table.id} ${sql.join(
      order.map((id, index) => sql`WHEN ${id}::uuid THEN ${index}::int`),
      sql` `,
    )} END`;
    await db
      .update(table)
      .set({ position, updatedAt: sql`now()` })
      .where(and(eq(table.sellerId, seller.sellerId), inArray(table.id, order)));

    revalidatePath(TAXONOMY_PAGE_HREF[kind]);
    // The first category photo by position is the storefront tile photo.
    if (kind === "category") await applyInvalidation(invalidateSellerProducts(seller.sellerId), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    return failure(error, "reorder");
  }
}

/**
 * Set a product's own category and brand (the product form calls this after
 * create/update, so actions/products.ts stays untouched). The product and both
 * items must belong to the session's seller; the 0068 trigger checks it again.
 */
export async function setProductSellerTaxonomy(productId: string, input: unknown): Promise<TaxonomyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = productTaxonomySchema.safeParse(input);
    if (!parsed.success || typeof productId !== "string") return { success: false, error: "invalidInput" };
    const { sellerCategoryId, sellerBrandId } = parsed.data;

    const [category, brand] = await Promise.all([
      sellerCategoryId
        ? db
            .select({ id: sellerProductCategories.id })
            .from(sellerProductCategories)
            .where(and(eq(sellerProductCategories.id, sellerCategoryId), eq(sellerProductCategories.sellerId, seller.sellerId)))
            .limit(1)
        : [null],
      sellerBrandId
        ? db
            .select({ id: sellerProductBrands.id })
            .from(sellerProductBrands)
            .where(and(eq(sellerProductBrands.id, sellerBrandId), eq(sellerProductBrands.sellerId, seller.sellerId)))
            .limit(1)
        : [null],
    ]);
    if ((sellerCategoryId && !category[0]) || (sellerBrandId && !brand[0])) return { success: false, error: "notFound" };

    const updated = await db
      .update(products)
      .set({ sellerCategoryId, sellerBrandId })
      .where(and(eq(products.id, productId), eq(products.sellerId, seller.sellerId)))
      .returning({ id: products.id });
    if (!updated.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF.category);
    revalidatePath(TAXONOMY_PAGE_HREF.brand);
    // The product's category can change which photo its storefront category tile shows.
    await applyInvalidation(invalidateSellerProducts(seller.sellerId), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    return failure(error, "set product");
  }
}
