"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreProducts } from "@workspace/cache";
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
import {
  aliasedTaxonomyInStore,
  taxonomyInStore,
  taxonomyItemsInStore,
  taxonomyStoreIdForWrite,
  type TaxonomyScope,
} from "@workspace/lib/stores/scope/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { requireProductStore, taxonomyScopeOf } from "@/lib/products/product-store.server";
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
  isCheckViolation,
  isSellerTaxonomyImage,
  isUniqueViolation,
  taxonomyNameKey,
} from "./categories-brands.lib";

/**
 * Products › Categories and Products › Brands (0068), per store (ROADMAP.md
 * F-87d). Every action takes an explicit `storeId` (the page's
 * `/stores/[storeId]/...` segment, sent back by the client) and checks it with
 * `requireProductStore`: the session's seller must own the store (a foreign,
 * deleted, forged or malformed id is "not found"). Every item id is then
 * matched with `taxonomyInStore` in the same WHERE:
 * - `stores_catalog_split` off: the seller's one list, exactly as before
 *   (every store of the seller shares it);
 * - on: only rows with `store_id` = the store, so store B can't read, edit,
 *   reorder, delete or assign store A's items.
 * New rows always write `store_id` = the checked store (nothing reads it before
 * the split; 0163 must not assume it is NULL). Archived and suspended stores
 * are read-only only after the split (`requireProductStore`, slice 2 rule).
 *
 * Caches: every write purges `invalidateStoreProducts(seller, store)`: the
 * store's storefront tag plus the seller tags, which stay while a list is
 * shared by every store (rule 8; drop them only after the split).
 */

const SUGGESTION_LIMIT = 12;

function failure(error: unknown, scope: string): { success: false; error: TaxonomyErrorKey } {
  if (isAccessError(error)) {
    const readOnly = error.code === "seller_blocked" || error.code === "store_read_only";
    return { success: false, error: readOnly ? "readOnly" : "notFound" };
  }
  if (isUniqueViolation(error)) return { success: false, error: "duplicate" };
  // The 0171 parent guard (same store, two levels), behind the checks in `checkParent`.
  if (isCheckViolation(error) && (scope === "add" || scope === "update")) return { success: false, error: "invalidParent" };
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
const isAllowedImage = (image: string | null | undefined, sellerId: string): boolean =>
  image == null || isSellerTaxonomyImage(image, process.env.NEXT_PUBLIC_SUPABASE_URL, sellerId);

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
          // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
          parentName: sql<string | null>`${sql`(SELECT p.name FROM ${categories} p WHERE p.id = ${categories.parentId})`}`,
          parentNameAr: sql<string | null>`${sql`(SELECT p.name_ar FROM ${categories} p WHERE p.id = ${categories.parentId})`}`,
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

type TaxonomyContext = { scope: TaxonomyScope; storeId: string };

/** The checked store of a taxonomy action (session seller, owned store, switch). */
async function requireTaxonomyStore(storeId: unknown): Promise<TaxonomyContext> {
  const ctx = await requireProductStore(storeId);
  return { scope: taxonomyScopeOf(ctx), storeId: ctx.store.id };
}

/**
 * Whether `parentId` may be the main category of `selfId` (or of a new item):
 * categories only, a row of the same store's list (`taxonomyInStore`, never
 * the client's word), itself a main category, not the item itself, and the
 * item has no sub-categories of its own (two levels). null/undefined: nothing
 * to check. The 0171 trigger checks the same in the database.
 */
async function checkParent(
  ctx: TaxonomyContext,
  kind: TaxonomyKind,
  parentId: string | null | undefined,
  selfId?: string,
): Promise<TaxonomyErrorKey | null> {
  if (parentId == null) return null;
  if (kind !== "category") return "invalidInput";
  if (parentId === selfId) return "invalidParent";
  const [parent] = await db
    .select({ id: sellerProductCategories.id, parentId: sellerProductCategories.parentId })
    .from(sellerProductCategories)
    .where(and(eq(sellerProductCategories.id, parentId), taxonomyInStore(sellerProductCategories, ctx.scope)))
    .limit(1);
  if (!parent || parent.parentId !== null) return "invalidParent";
  if (selfId) {
    const [child] = await db
      .select({ id: sellerProductCategories.id })
      .from(sellerProductCategories)
      .where(and(eq(sellerProductCategories.parentId, selfId), taxonomyInStore(sellerProductCategories, ctx.scope)))
      .limit(1);
    if (child) return "invalidParent";
  }
  return null;
}

/** Purges the store's storefront entries plus the seller-wide ones (lists are shared until the split). */
const invalidateTaxonomy = ({ scope, storeId }: TaxonomyContext) =>
  applyInvalidation(invalidateStoreProducts(scope.sellerId, storeId), { from: "dashboard", mode: "action" });

/** Add to the store's list: a pack item (copied in) or the seller's own name. */
export async function addTaxonomyItem(storeId: string, kind: TaxonomyKind, input: unknown): Promise<TaxonomyResult<SellerTaxonomyItem>> {
  try {
    return await addItem(await requireTaxonomyStore(storeId), kind, input);
  } catch (error) {
    return failure(error, "add");
  }
}

async function addItem(ctx: TaxonomyContext, kind: TaxonomyKind, input: unknown): Promise<TaxonomyResult<SellerTaxonomyItem>> {
  const { scope } = ctx;
  const parsed = addTaxonomyItemSchema.safeParse(input);
  if (!isKind(kind) || !parsed.success) return { success: false, error: "invalidInput" };
  if ("image" in parsed.data && !isAllowedImage(parsed.data.image, scope.sellerId)) return { success: false, error: "invalidImage" };
  // Brands have no main brand: any parentId is refused, even null.
  if (kind !== "category" && parsed.data.parentId !== undefined) return { success: false, error: "invalidInput" };
  const parentId = parsed.data.parentId ?? null;
  const parentError = await checkParent(ctx, kind, parentId);
  if (parentError) return { success: false, error: parentError };
  const { table } = tableFor(kind);

  // The limit counts the list the store sees: the seller's before the split, the store's after it.
  const [{ total }] = await db.select({ total: count() }).from(table).where(taxonomyInStore(table, scope));
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

  // Last of the list, so also last among its siblings (the list is read in tree order, flattenCategoryTree).
  const position = sql<number>`(SELECT coalesce(max(t.position), -1) + 1 FROM ${table} t WHERE ${aliasedTaxonomyInStore("t", scope)})`;
  // store_id: the checked store, in both modes (read only after the split).
  const owner = { sellerId: scope.sellerId, storeId: taxonomyStoreIdForWrite(scope) };
  const [row] =
    kind === "category"
      ? await db
          .insert(sellerProductCategories)
          .values({ ...owner, parentId, name: values.name, nameAr: values.nameAr, sourceCategoryId: values.sourceId, imageUrl: values.image, position })
          .returning({ id: sellerProductCategories.id })
      : await db
          .insert(sellerProductBrands)
          .values({ ...owner, name: values.name, nameAr: values.nameAr, sourceBrandId: values.sourceId, logoUrl: values.image, position })
          .returning({ id: sellerProductBrands.id });

  revalidatePath(TAXONOMY_PAGE_HREF[kind], "page");
  // A category picked from a Tallaby one takes in that category's unlinked products on the storefront (storeCategoryGroups).
  // A new brand shows in the store's brands section at once.
  // A new sub-category shows under its main category on the storefront.
  if (kind === "brand" || values.sourceId || parentId) await invalidateTaxonomy(ctx);
  return { success: true, data: { id: row!.id, ...values, parentId, productCount: 0, ownProductCount: 0 } };
}

/**
 * The product form's category (also the file import and the AI Store Builder):
 * the store's item with that name (English or Arabic, case-insensitive) or
 * picked from that Tallaby item, added to the store's list when it isn't there
 * yet. Matching is done here in code, never by an AI prompt (rule 20).
 */
export async function ensureTaxonomyItem(storeId: string, kind: TaxonomyKind, input: unknown): Promise<TaxonomyResult<SellerTaxonomyOption>> {
  try {
    const ctx = await requireTaxonomyStore(storeId);
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
      // Categories (0171): a name can be on a main category and on sub-categories; the main one wins, then the first by position.
      const isCategory = kind === "category";
      const [row] = await db
        .select({
          id: table.id,
          name: table.name,
          nameAr: table.nameAr,
          sourceId: sourceColumn,
          ...(isCategory
            ? {
                parentId: sellerProductCategories.parentId,
                // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
                parentName: sql<string | null>`${sql`(SELECT p.name FROM ${sellerProductCategories} p WHERE p.id = ${sellerProductCategories.parentId})`}`,
                parentNameAr: sql<string | null>`${sql`(SELECT p.name_ar FROM ${sellerProductCategories} p WHERE p.id = ${sellerProductCategories.parentId})`}`,
              }
            : {}),
        })
        .from(table)
        .where(and(taxonomyInStore(table, ctx.scope), or(...(sourceId ? [eq(sourceColumn, sourceId)] : []), ...byName)))
        // The item copied from this Tallaby one first, then a same-named one.
        .orderBy(
          ...(sourceId ? [sql`(${sourceColumn} IS NOT DISTINCT FROM ${sourceId}::uuid) DESC`] : []),
          ...(isCategory ? [sql`(${sellerProductCategories.parentId} IS NULL) DESC`] : []),
          asc(table.position),
        )
        .limit(1);
      return row as SellerTaxonomyOption | undefined;
    };

    const existing = await findExisting();
    if (existing) return { success: true, data: existing };

    const added = await addItem(ctx, kind, sourceId ? { sourceId } : { name: names[0] });
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

/** Rename an item in the store's list, set or remove its image, and (categories) file it under a main category or none. */
export async function updateTaxonomyItem(storeId: string, kind: TaxonomyKind, id: string, input: unknown): Promise<TaxonomyResult> {
  try {
    const ctx = await requireTaxonomyStore(storeId);
    const { scope } = ctx;
    const parsed = updateTaxonomyItemSchema.safeParse(input);
    if (!isKind(kind) || !parsed.success || typeof id !== "string") return { success: false, error: "invalidInput" };
    const { image, parentId } = parsed.data;
    if (!isAllowedImage(image, scope.sellerId)) return { success: false, error: "invalidImage" };
    if (parentId !== undefined && kind !== "category") return { success: false, error: "invalidInput" };
    const parentError = await checkParent(ctx, kind, parentId, id);
    if (parentError) return { success: false, error: parentError };
    const patch = {
      name: cleanTaxonomyName(parsed.data.name),
      nameAr: parsed.data.nameAr ? cleanTaxonomyName(parsed.data.nameAr) : null,
      updatedAt: sql`now()`,
    };
    // `parentId` left out keeps the current main category; null makes it a main category. A move puts
    // it last (last main category, or last sub-category of its new main one), as the client shows it.
    const categoryPatch =
      parentId === undefined
        ? patch
        : {
            ...patch,
            parentId,
            position: sql<number>`(SELECT coalesce(max(t.position), -1) + 1 FROM ${sellerProductCategories} t WHERE ${aliasedTaxonomyInStore("t", scope)})`,
          };
    // `image` left out keeps the current one (e.g. a pack image path).
    const updated =
      kind === "category"
        ? await db
            .update(sellerProductCategories)
            .set(image === undefined ? categoryPatch : { ...categoryPatch, imageUrl: image })
            .where(and(eq(sellerProductCategories.id, id), taxonomyInStore(sellerProductCategories, scope)))
            .returning({ id: sellerProductCategories.id })
        : await db
            .update(sellerProductBrands)
            .set(image === undefined ? patch : { ...patch, logoUrl: image })
            .where(and(eq(sellerProductBrands.id, id), taxonomyInStore(sellerProductBrands, scope)))
            .returning({ id: sellerProductBrands.id });
    if (!updated.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF[kind], "page");
    // Storefront category tiles show this image (getStorefrontCategories); brands show in the store's brands
    // section (getCachedSellerBrands). Both carry the seller and store tags.
    await invalidateTaxonomy(ctx);
    return { success: true };
  } catch (error) {
    return failure(error, "update");
  }
}

/**
 * Remove an item; products that used it keep everything else (the link is set
 * to null). A main category's sub-categories become main categories (0171 FK
 * ON DELETE SET NULL); nothing else is deleted.
 */
export async function deleteTaxonomyItem(storeId: string, kind: TaxonomyKind, id: string): Promise<TaxonomyResult> {
  try {
    const ctx = await requireTaxonomyStore(storeId);
    if (!isKind(kind) || typeof id !== "string") return { success: false, error: "invalidInput" };
    const { table } = tableFor(kind);
    const deleted = await db
      .delete(table)
      .where(and(eq(table.id, id), taxonomyInStore(table, ctx.scope)))
      .returning({ id: table.id });
    if (!deleted.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF[kind], "page");
    await invalidateTaxonomy(ctx);
    return { success: true };
  } catch (error) {
    // A sub-category that becomes a main category may share a main category's name (0171 sibling-unique index).
    if (isUniqueViolation(error)) return { success: false, error: "childNameTaken" };
    return failure(error, "delete");
  }
}

/**
 * Save the list order. `ids` must be exactly the store's items (a stale list,
 * after an add or delete in another tab, reads as "not found").
 */
export async function reorderTaxonomyItems(storeId: string, kind: TaxonomyKind, ids: unknown): Promise<TaxonomyResult> {
  try {
    const ctx = await requireTaxonomyStore(storeId);
    const parsed = reorderTaxonomySchema.safeParse(ids);
    if (!isKind(kind) || !parsed.success) return { success: false, error: "invalidInput" };
    const order = parsed.data;
    const { table } = tableFor(kind);

    const owned = await db.select({ id: table.id }).from(table).where(taxonomyInStore(table, ctx.scope));
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
      .where(and(taxonomyInStore(table, ctx.scope), inArray(table.id, order)));

    revalidatePath(TAXONOMY_PAGE_HREF[kind], "page");
    // The first category photo by position is the storefront tile photo; brands show in their order.
    await invalidateTaxonomy(ctx);
    return { success: true };
  } catch (error) {
    return failure(error, "reorder");
  }
}

/**
 * Set a product's own category and brand (the product form calls this after
 * create/update, so actions/products.ts stays untouched). The product must be
 * in the page's store (`productInStore`, scope `managed`, in the UPDATE), and
 * each item must be in the same store's list (`taxonomyItemsInStore`: the
 * seller's before the split, `store_id` = the store after it, F-87d), else
 * `notFound`. The 0068 trigger checks the seller again; the proposed 0163
 * trigger `products_taxonomy_same_store` (docs/plans/stores-separation.md §3.2)
 * will check the store in the database too.
 */
export async function setProductSellerTaxonomy(storeId: string, productId: string, input: unknown): Promise<TaxonomyResult> {
  try {
    const ctx = await requireProductStore(storeId);
    const scope = taxonomyScopeOf(ctx);
    const parsed = productTaxonomySchema.safeParse(input);
    if (!parsed.success || typeof productId !== "string") return { success: false, error: "invalidInput" };
    const { sellerCategoryId, sellerBrandId } = parsed.data;

    if (!(await taxonomyItemsInStore(scope, { sellerCategoryId, sellerBrandId }))) return { success: false, error: "notFound" };

    const updated = await db
      .update(products)
      .set({ sellerCategoryId, sellerBrandId })
      .where(and(eq(products.id, productId), eq(products.sellerId, scope.sellerId), ctx.inStore))
      .returning({ id: products.id });
    if (!updated.length) return { success: false, error: "notFound" };
    revalidatePath(TAXONOMY_PAGE_HREF.category, "page");
    revalidatePath(TAXONOMY_PAGE_HREF.brand, "page");
    // The product's category can change which photo its storefront category tile shows.
    await invalidateTaxonomy({ scope, storeId: ctx.store.id });
    return { success: true };
  } catch (error) {
    return failure(error, "set product");
  }
}
