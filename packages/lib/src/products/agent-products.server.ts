/**
 * Product commands for MCP assistants (ROADMAP.md F-29f, design note §6–§7).
 * Server only, no `next/*` imports: apps/backend calls these and broadcasts
 * the returned cache invalidation itself.
 *
 * Tenancy (CLAUDE.md rule 5): products belong to the seller account, and a
 * store shows all of them (catalog_mode 'all') or its picks ('selected'). Every
 * function takes the seller and store from the verified token (never from tool
 * input), re-checks in SQL that the store is the seller's, and only touches a
 * product of that seller that the store shows. A store in "selected" mode gets
 * a new product added to its picks.
 *
 * Side effects match the dashboard's createProduct/updateProduct: the status
 * rule, price normalization, sanitized rich text, both translations, variants
 * reconciled in place (ids kept), stock history context, category counts and
 * cache invalidation.
 */
import { randomUUID } from "node:crypto";
import {
  invalidateProduct,
  invalidateSellerProducts,
  invalidateStoreCatalog,
  mergeInvalidations,
  type CacheInvalidation,
  type ProductCacheSnapshot,
} from "@workspace/cache/invalidate";
import {
  and,
  asc,
  categories,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  productTranslations,
  productVariants,
  products,
  sellerProductCategories,
  sql,
  storeProducts,
  stores,
} from "@workspace/db";
import { syncCategoryProductCountForProductChange, syncCategoryProductCountForProductMutation } from "@workspace/db/categories";
import { setStockContext } from "@workspace/db/inventory";
import { syncProductVariants } from "@workspace/db/products";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@workspace/tiptap/sanitize";
import type { AgentCreateProductInput, AgentSearchProductsInput, AgentUpdateProductInput } from "./agent-products.dto";
import {
  buildAgentPrice,
  buildVariantRows,
  checkAgentVariants,
  cleanAgentKeywords,
  clipText,
  existingImagePath,
  htmlToText,
  imageList,
  nextAgentProductStatus,
  productImagePrefix,
  productImageUrl,
  readAgentPrice,
  slugifyTitle,
  textToHtml,
  variantStockTotal,
  type ProductStatusValue,
} from "./agent-products.lib";
import { restoreProducts, trashProducts } from "./trash.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AgentProductErrorCode =
  | "not_found"
  | "store_read_only"
  | "invalid_category"
  | "category_required"
  | "invalid_store_category"
  | "store_category_limit"
  | "image_failed"
  | "image_required"
  | "sku_taken"
  | "variants_invalid"
  | "cannot_publish";

export class AgentProductError extends Error {
  constructor(
    readonly code: AgentProductErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AgentProductError";
  }
}

/** Who is acting (from the verified MCP token) and in which store. */
export type AgentProductContext = {
  sellerId: string;
  /** The user who approved the assistant (stock history actor). */
  userId: string;
  /** sellers.status: only "approved" sellers can make products live. */
  sellerStatus: string;
  storeId: string;
};

/** Stores an image the tool downloaded; returns the path in the "products" bucket, or null on failure. */
export type ProductImageUploader = (url: string) => Promise<{ ok: true; path: string } | { ok: false; reason: string }>;

const SELLER_TAXONOMY_MAX_ITEMS = 300;

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

// ── Store and product access ────────────────────────────────────────────────

type AgentStore = { id: string; status: string; catalogMode: string; subdomain: string };

async function loadStore(ctx: AgentProductContext, forWrite: boolean): Promise<AgentStore> {
  const [store] = await db
    .select({ id: stores.id, status: stores.status, catalogMode: stores.catalogMode, subdomain: stores.subdomain })
    .from(stores)
    .where(and(eq(stores.id, ctx.storeId), eq(stores.sellerId, ctx.sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) throw new AgentProductError("not_found", "Store not found.");
  if (forWrite && store.status !== "active") throw new AgentProductError("store_read_only", "This store is archived or suspended; products can't be changed from it.");
  return store;
}

/** The seller's product that this store shows (any status, Trash included). */
function storeShowsProduct(store: AgentStore, sellerId: string) {
  return and(
    eq(products.sellerId, sellerId),
    isNull(products.purgedAt),
    store.catalogMode === "selected"
      ? sql`EXISTS (SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${store.id} AND sp.product_id = ${products.id})`
      : undefined,
  );
}

async function loadSnapshot(q: Tx | typeof db, sellerId: string, productId: string) {
  const row = await q.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.sellerId, sellerId)),
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });
  return row ?? null;
}

function snapshotOf(row: NonNullable<Awaited<ReturnType<typeof loadSnapshot>>>): ProductCacheSnapshot {
  return {
    id: row.id,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: row.status,
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(row.price ?? null),
  };
}

async function requireProduct(store: AgentStore, sellerId: string, productId: string, { allowTrash = false } = {}) {
  const [row] = await db
    .select({ id: products.id, status: products.status, images: products.images, deletedAt: products.deletedAt, sku: products.sku })
    .from(products)
    .where(and(eq(products.id, productId), storeShowsProduct(store, sellerId), allowTrash ? undefined : isNull(products.deletedAt)))
    .limit(1);
  if (!row) throw new AgentProductError("not_found", "Product not found in this store.");
  return row;
}

// ── Taxonomy ────────────────────────────────────────────────────────────────

async function resolveCategories(
  ctx: AgentProductContext,
  input: {
    categoryId?: string;
    storeCategoryId?: string | null;
    storeCategoryName?: { ar?: string; en: string };
  },
): Promise<{ categoryId?: string; sellerCategoryId?: string | null; taxonomyChanged: boolean }> {
  let sellerCategoryId: string | null | undefined = input.storeCategoryId;
  let sourceCategoryId: string | null = null;

  if (input.storeCategoryName) {
    const found = await findOrAddStoreCategory(ctx.sellerId, input.storeCategoryName);
    sellerCategoryId = found.id;
    sourceCategoryId = found.sourceCategoryId;
  } else if (sellerCategoryId) {
    const [own] = await db
      .select({ id: sellerProductCategories.id, sourceCategoryId: sellerProductCategories.sourceCategoryId })
      .from(sellerProductCategories)
      .where(and(eq(sellerProductCategories.id, sellerCategoryId), eq(sellerProductCategories.sellerId, ctx.sellerId)))
      .limit(1);
    if (!own) throw new AgentProductError("invalid_store_category", "Store category not found. Use list_store_categories.");
    sourceCategoryId = own.sourceCategoryId;
  }

  let categoryId = input.categoryId;
  if (categoryId) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!cat) throw new AgentProductError("invalid_category", "Unknown Tallaby category. Use search_categories.");
  } else if (sourceCategoryId) {
    categoryId = sourceCategoryId;
  }
  return { categoryId, sellerCategoryId, taxonomyChanged: sellerCategoryId !== undefined };
}

const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

async function findOrAddStoreCategory(sellerId: string, name: { ar?: string; en: string }) {
  const keys = [name.en, name.ar].filter((n): n is string => Boolean(n?.trim())).map(nameKey);
  const findExisting = async () => {
    const [row] = await db
      .select({ id: sellerProductCategories.id, sourceCategoryId: sellerProductCategories.sourceCategoryId })
      .from(sellerProductCategories)
      .where(
        and(
          eq(sellerProductCategories.sellerId, sellerId),
          or(
            ...keys.flatMap((key) => [
              sql`lower(btrim(${sellerProductCategories.name})) = ${key}`,
              sql`lower(btrim(${sellerProductCategories.nameAr})) = ${key}`,
            ]),
          ),
        ),
      )
      .orderBy(asc(sellerProductCategories.position))
      .limit(1);
    return row;
  };
  const existing = await findExisting();
  if (existing) return existing;

  const [counted] = await db.select({ total: count() }).from(sellerProductCategories).where(eq(sellerProductCategories.sellerId, sellerId));
  if ((counted?.total ?? 0) >= SELLER_TAXONOMY_MAX_ITEMS) throw new AgentProductError("store_category_limit", "The store already has the maximum number of categories.");
  try {
    const [row] = await db
      .insert(sellerProductCategories)
      .values({
        sellerId,
        name: name.en.trim().replace(/\s+/g, " "),
        nameAr: name.ar?.trim().replace(/\s+/g, " ") || null,
        position: sql<number>`(SELECT coalesce(max(t.position), -1) + 1 FROM ${sellerProductCategories} t WHERE t.seller_id = ${sellerId})`,
      })
      .returning({ id: sellerProductCategories.id, sourceCategoryId: sellerProductCategories.sourceCategoryId });
    return row!;
  } catch (error) {
    // Added at the same moment by another call: use that one.
    const raced = await findExisting();
    if (raced) return raced;
    throw error;
  }
}

// ── Images ──────────────────────────────────────────────────────────────────

/**
 * Turns image refs into stored paths: images the product already has are kept,
 * https URLs are downloaded (three at a time). Any failure fails the call with
 * the URLs that did not work, so the assistant can retry with other ones.
 */
async function resolveImages(refs: readonly string[], current: readonly string[], upload: ProductImageUploader): Promise<Map<string, string>> {
  const prefix = productImagePrefix(supabaseUrl());
  const resolved = new Map<string, string>();
  const todo: string[] = [];
  for (const ref of new Set(refs)) {
    const kept = existingImagePath(ref, current, prefix);
    if (kept) resolved.set(ref, kept);
    else todo.push(ref);
  }
  const failed: { url: string; reason: string }[] = [];
  for (let i = 0; i < todo.length; i += 3) {
    await Promise.all(
      todo.slice(i, i + 3).map(async (ref) => {
        if (!/^https:\/\//i.test(ref)) {
          failed.push({ url: ref.slice(0, 200), reason: "not an https URL or an image of this product" });
          return;
        }
        const result = await upload(ref);
        if (result.ok) resolved.set(ref, result.path);
        else failed.push({ url: ref.slice(0, 200), reason: result.reason });
      }),
    );
  }
  if (failed.length) {
    throw new AgentProductError("image_failed", "Some images could not be used. Give public https links to JPEG, PNG or WebP files up to 5 MB.", { failed });
  }
  return resolved;
}

/** The stored paths for `refs`, in order, without repeats. */
const pathsFor = (refs: readonly string[], resolved: Map<string, string>) => [...new Set(refs.map((ref) => resolved.get(ref)!))];

// ── Copy ────────────────────────────────────────────────────────────────────

function richText(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const clean = sanitizeRichTextHtml(textToHtml(value));
  return isRichTextEmpty(clean) ? null : clean;
}

type Copy = {
  title: { ar: string; en: string };
  description?: { ar: string; en: string } | null;
  content?: { ar: string; en: string } | null;
  bulletPoints?: { ar: string[]; en: string[] };
  seo?: AgentCreateProductInput["seo"];
};

function translationValues(copy: Copy, locale: "ar" | "en", slug: string, previous?: { metaTitle: string | null; metaDescription: string | null; metaKeywords: string[] }) {
  const title = copy.title[locale].trim();
  const description = copy.description === undefined ? undefined : richText(copy.description?.[locale]);
  const content = copy.content === undefined ? undefined : richText(copy.content?.[locale]);
  const seo = copy.seo?.[locale];
  const metaTitle = seo?.metaTitle?.trim() || (previous ? previous.metaTitle : null) || clipText(title, 60);
  const autoDescription = clipText(htmlToText(description ?? content ?? ""), 160) || null;
  const metaDescription = seo?.metaDescription?.trim() || (previous ? previous.metaDescription : null) || autoDescription;
  return {
    title,
    slug,
    ...(description !== undefined ? { description } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(copy.bulletPoints ? { bulletPoints: copy.bulletPoints[locale].map((p) => p.trim()).filter(Boolean) } : {}),
    metaTitle,
    metaDescription,
    metaKeywords: seo?.keywords ? cleanAgentKeywords(seo.keywords) : (previous?.metaKeywords ?? []),
  };
}

async function uniqueSlug(q: Tx, title: string, productId: string | null): Promise<string> {
  const base = slugifyTitle(title, randomUUID().slice(0, 8));
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 4 + attempt)}`;
    const [taken] = await q
      .select({ id: productTranslations.id })
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.slug, candidate),
          productId ? ne(productTranslations.productId, productId) : undefined,
        ),
      )
      .limit(1);
    if (!taken) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 12)}`;
}

async function skuTaken(sellerId: string, sku: string, productId: string | null): Promise<boolean> {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), eq(products.sku, sku), productId ? ne(products.id, productId) : undefined))
    .limit(1);
  return Boolean(row);
}

function generatedSku(): string {
  return `SKU-${Date.now().toString().slice(-6)}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function variantImagesFor(variants: readonly { image?: string }[], resolved: Map<string, string>): (string | null)[] {
  return variants.map((v) => (v.image ? (resolved.get(v.image) ?? null) : null));
}

// ── Commands ────────────────────────────────────────────────────────────────

export type AgentProductWriteResult = {
  productId: string;
  status: ProductStatusValue;
  slug: string;
  invalidation: CacheInvalidation;
};

export async function agentCreateProduct(
  ctx: AgentProductContext,
  input: AgentCreateProductInput,
  upload: ProductImageUploader,
): Promise<AgentProductWriteResult> {
  const store = await loadStore(ctx, true);
  const variants = input.variants ?? [];
  const variantProblem = checkAgentVariants(variants);
  if (variantProblem) throw new AgentProductError("variants_invalid", `Variants are not valid: ${variantProblem}.`);

  const taxonomy = await resolveCategories(ctx, input);
  if (!taxonomy.categoryId) {
    throw new AgentProductError("category_required", "Pick a Tallaby category (search_categories) for the product.");
  }

  const sku = input.sku?.trim() || generatedSku();
  if (await skuTaken(ctx.sellerId, sku, null)) throw new AgentProductError("sku_taken", `SKU "${sku}" is already used by another product.`);

  const variantRefs = variants.map((v) => v.image).filter((v): v is string => Boolean(v));
  const resolved = await resolveImages([...input.images, ...variantRefs], [], upload);
  const images = pathsFor(input.images, resolved);

  const status = nextAgentProductStatus({
    previous: null,
    hasImage: images.length > 0,
    canPublish: ctx.sellerStatus === "approved",
    wantDraft: input.publish === false,
  });
  const discountEndsAt = input.discountEndsAt ?? null;
  const quantity = input.quantity ?? (variants.length ? variantStockTotal(variants) : 0);

  const created = await db.transaction(async (tx) => {
    await setStockContext(tx, { reason: "edit", actorId: ctx.userId, storeId: store.id });
    const [row] = await tx
      .insert(products)
      .values({
        sellerId: ctx.sellerId,
        categoryId: taxonomy.categoryId!,
        sellerCategoryId: taxonomy.sellerCategoryId ?? null,
        sku,
        quantity: String(quantity),
        ...(input.trackStock !== undefined && { trackStock: input.trackStock }),
        images,
        price: buildAgentPrice(input.price, input.compareAtPrice, discountEndsAt),
        status,
        condition: input.condition ?? "new",
        freeDelivery: input.freeDelivery ?? false,
        maxOrderQuantity: input.maxOrderQuantity ?? null,
        dimensions: input.weightGrams ? { weight: input.weightGrams, weightUnit: "g", unit: "cm" } : null,
      })
      .returning({ id: products.id });
    const productId = row!.id;

    const slug = await uniqueSlug(tx, input.title.en, productId);
    const copy: Copy = { title: input.title, description: input.description, content: input.content, bulletPoints: input.bulletPoints, seo: input.seo };
    for (const locale of ["en", "ar"] as const) {
      const values = translationValues(copy, locale, slug);
      await tx.insert(productTranslations).values({
        productId,
        locale,
        title: values.title,
        slug,
        description: values.description ?? null,
        content: values.content ?? null,
        bulletPoints: values.bulletPoints ?? [],
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        metaKeywords: values.metaKeywords,
      });
    }

    if (variants.length) {
      const rows = buildVariantRows(variants, { productSku: sku, productImages: images, variantImages: variantImagesFor(variants, resolved), discountEndsAt });
      await tx.insert(productVariants).values(rows.map(({ id: _id, ...v }) => ({ ...v, productId })));
    }

    if (store.catalogMode === "selected") {
      await tx
        .insert(storeProducts)
        .values({
          storeId: store.id,
          productId,
          position: sql<number>`(SELECT coalesce(max(sp.position), -1) + 1 FROM ${storeProducts} sp WHERE sp.store_id = ${store.id})`,
        })
        .onConflictDoNothing();
    }
    return { productId, slug };
  });

  await syncCategoryProductCountForProductChange({ categoryId: taxonomy.categoryId, previousStatus: null, nextStatus: status });
  const after = await loadSnapshot(db, ctx.sellerId, created.productId);
  const invalidation = mergeInvalidations(
    invalidateProduct(null, after ? snapshotOf(after) : null),
    ...(taxonomy.taxonomyChanged ? [invalidateSellerProducts(ctx.sellerId)] : []),
    ...(store.catalogMode === "selected" ? [invalidateStoreCatalog(ctx.sellerId, store.id, store.subdomain)] : []),
  );
  return { productId: created.productId, status, slug: created.slug, invalidation };
}

export async function agentUpdateProduct(
  ctx: AgentProductContext,
  input: AgentUpdateProductInput,
  upload: ProductImageUploader,
): Promise<AgentProductWriteResult> {
  const store = await loadStore(ctx, true);
  const current = await requireProduct(store, ctx.sellerId, input.productId);
  const before = await loadSnapshot(db, ctx.sellerId, input.productId);
  if (!before) throw new AgentProductError("not_found", "Product not found in this store.");

  if (input.variants) {
    const problem = checkAgentVariants(input.variants);
    if (problem) throw new AgentProductError("variants_invalid", `Variants are not valid: ${problem}.`);
  }
  const taxonomy = await resolveCategories(ctx, input);
  if (input.sku && (await skuTaken(ctx.sellerId, input.sku.trim(), input.productId))) {
    throw new AgentProductError("sku_taken", `SKU "${input.sku}" is already used by another product.`);
  }

  const currentImages = imageList(current.images);
  const currentVariantImages = await db
    .select({ images: productVariants.images, imageUrl: productVariants.imageUrl })
    .from(productVariants)
    .where(eq(productVariants.productId, input.productId));
  // Photos the product or its variants already have can be kept by path or public URL.
  const knownImages = [...currentImages, ...currentVariantImages.flatMap((v) => [...imageList(v.images), ...(v.imageUrl ? [v.imageUrl] : [])])];

  const variantRefs = (input.variants ?? []).map((v) => v.image).filter((v): v is string => Boolean(v));
  const refs = [...(input.images ?? []), ...variantRefs];
  const resolved = refs.length ? await resolveImages(refs, knownImages, upload) : new Map<string, string>();
  const images = input.images ? pathsFor(input.images, resolved) : currentImages;

  const status = nextAgentProductStatus({
    previous: current.status as ProductStatusValue,
    hasImage: images.length > 0,
    canPublish: ctx.sellerStatus === "approved",
  });

  const [storedPrice] = await db.select({ price: products.price }).from(products).where(eq(products.id, input.productId)).limit(1);
  const priceNow = readAgentPrice(storedPrice?.price);
  const priceChanged = input.price !== undefined || input.compareAtPrice !== undefined || input.discountEndsAt !== undefined;
  const discountEndsAt = input.discountEndsAt !== undefined ? input.discountEndsAt : priceNow.discountEndsAt;

  const slug = await db.transaction(async (tx) => {
    await setStockContext(tx, { reason: "edit", actorId: ctx.userId, storeId: store.id });
    const patch: Partial<typeof products.$inferInsert> = { status, updatedAt: new Date().toISOString() };
    if (input.images) patch.images = images;
    if (priceChanged) {
      patch.price = buildAgentPrice(
        input.price ?? priceNow.price,
        input.compareAtPrice !== undefined ? input.compareAtPrice : priceNow.compareAtPrice,
        discountEndsAt,
      );
    }
    if (input.trackStock !== undefined) patch.trackStock = input.trackStock;
    if (input.quantity !== undefined) patch.quantity = String(input.quantity);
    else if (input.variants?.length) patch.quantity = String(variantStockTotal(input.variants));
    if (input.sku) patch.sku = input.sku.trim();
    if (taxonomy.categoryId) patch.categoryId = taxonomy.categoryId;
    if (taxonomy.sellerCategoryId !== undefined) patch.sellerCategoryId = taxonomy.sellerCategoryId;
    if (input.condition) patch.condition = input.condition;
    if (input.freeDelivery !== undefined) patch.freeDelivery = input.freeDelivery;
    if (input.maxOrderQuantity !== undefined) patch.maxOrderQuantity = input.maxOrderQuantity;
    if (input.weightGrams !== undefined) patch.dimensions = input.weightGrams ? { weight: input.weightGrams, weightUnit: "g", unit: "cm" } : null;

    const updated = await tx
      .update(products)
      .set(patch)
      .where(and(eq(products.id, input.productId), eq(products.sellerId, ctx.sellerId), isNull(products.deletedAt)))
      .returning({ id: products.id, sku: products.sku });
    if (!updated.length) throw new AgentProductError("not_found", "Product not found in this store.");

    const rows = await tx.select().from(productTranslations).where(eq(productTranslations.productId, input.productId));
    const enRow = rows.find((r) => r.locale === "en");
    let productSlug = enRow?.slug || null;
    const copyChanged = input.title || input.description !== undefined || input.content !== undefined || input.bulletPoints || input.seo;
    if (copyChanged) {
      const title = input.title ?? {
        ar: rows.find((r) => r.locale === "ar")?.title || enRow?.title || "Untitled",
        en: enRow?.title || rows.find((r) => r.locale === "ar")?.title || "Untitled",
      };
      if (!productSlug) productSlug = await uniqueSlug(tx, title.en, input.productId);
      const copy: Copy = { title, description: input.description, content: input.content, bulletPoints: input.bulletPoints, seo: input.seo };
      for (const locale of ["en", "ar"] as const) {
        const row = rows.find((r) => r.locale === locale);
        const values = translationValues(copy, locale, productSlug, row ? { metaTitle: input.title ? null : row.metaTitle, metaDescription: row.metaDescription, metaKeywords: row.metaKeywords } : undefined);
        if (row) {
          await tx.update(productTranslations).set(values).where(eq(productTranslations.id, row.id));
        } else {
          await tx.insert(productTranslations).values({
            productId: input.productId,
            locale,
            ...values,
            description: values.description ?? null,
            content: values.content ?? null,
            bulletPoints: values.bulletPoints ?? [],
          });
        }
      }
    }

    if (input.variants) {
      const variantRows = buildVariantRows(input.variants, {
        productSku: updated[0]!.sku ?? current.sku ?? "SKU",
        productImages: images,
        variantImages: variantImagesFor(input.variants, resolved),
        discountEndsAt,
      });
      await syncProductVariants(tx, input.productId, variantRows);
    }
    return productSlug ?? "";
  });

  const after = await loadSnapshot(db, ctx.sellerId, input.productId);
  if (after) {
    await syncCategoryProductCountForProductMutation({
      previousCategoryId: before.categoryId,
      nextCategoryId: after.categoryId,
      previousStatus: before.status,
      nextStatus: after.status,
    });
  }
  const invalidation = mergeInvalidations(
    invalidateProduct(snapshotOf(before), after ? snapshotOf(after) : null),
    ...(taxonomy.taxonomyChanged ? [invalidateSellerProducts(ctx.sellerId)] : []),
  );
  return { productId: input.productId, status: (after?.status ?? status) as ProductStatusValue, slug, invalidation };
}

/** Publish (active) or hide (draft) a product, with the dashboard's rules. */
export async function agentSetProductStatus(
  ctx: AgentProductContext,
  productId: string,
  wanted: "active" | "draft",
): Promise<{ status: ProductStatusValue; changed: boolean; invalidation: CacheInvalidation }> {
  const store = await loadStore(ctx, true);
  const product = await requireProduct(store, ctx.sellerId, productId);
  const empty: CacheInvalidation = { tags: [], paths: [] };
  if (product.status === wanted) return { status: wanted, changed: false, invalidation: empty };
  if (product.status === "rejected") throw new AgentProductError("cannot_publish", "Tallaby took this product down; it can't be published or hidden here.");
  if (wanted === "active" && imageList(product.images).length === 0) throw new AgentProductError("image_required", "Add at least one photo before publishing.");
  if (wanted === "active" && ctx.sellerStatus !== "approved") throw new AgentProductError("cannot_publish", "This account can't publish products right now.");

  const before = await loadSnapshot(db, ctx.sellerId, productId);
  await db
    .update(products)
    .set({ status: wanted, updatedAt: new Date().toISOString() })
    .where(and(eq(products.id, productId), eq(products.sellerId, ctx.sellerId), isNull(products.deletedAt)));
  if (before) await syncCategoryProductCountForProductChange({ categoryId: before.categoryId, previousStatus: before.status, nextStatus: wanted });
  const after = await loadSnapshot(db, ctx.sellerId, productId);
  return { status: wanted, changed: true, invalidation: invalidateProduct(before ? snapshotOf(before) : null, after ? snapshotOf(after) : null) };
}

/** Move products to Trash (30 days, restorable). Only products this store shows. */
export async function agentTrashProducts(ctx: AgentProductContext, productIds: string[]) {
  const store = await loadStore(ctx, true);
  const visible = await visibleIds(store, ctx.sellerId, productIds);
  return trashProducts(ctx.sellerId, ctx.userId, visible);
}

export async function agentRestoreProducts(ctx: AgentProductContext, productIds: string[]) {
  const store = await loadStore(ctx, true);
  const visible = await visibleIds(store, ctx.sellerId, productIds);
  return restoreProducts(ctx.sellerId, visible, { canPublish: ctx.sellerStatus === "approved" });
}

async function visibleIds(store: AgentStore, sellerId: string, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.id, ids), storeShowsProduct(store, sellerId)));
  return rows.map((r) => r.id);
}

// ── Reads ───────────────────────────────────────────────────────────────────

export type AgentProductRow = {
  id: string;
  title: { ar: string | null; en: string | null };
  status: string;
  inTrash: boolean;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  /** False: unlimited stock (0138, F-51); `stock` is then not meaningful. */
  trackStock: boolean;
  variants: number;
  sku: string | null;
  image: string | null;
  storeCategoryId: string | null;
  updatedAt: string | null;
};

export async function agentSearchProducts(
  ctx: AgentProductContext,
  input: AgentSearchProductsInput,
): Promise<{ items: AgentProductRow[]; nextCursor: number | null; total: number }> {
  const store = await loadStore(ctx, false);
  const term = input.query?.trim();
  const pattern = term ? `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const where = and(
    storeShowsProduct(store, ctx.sellerId),
    input.status === "trash" ? isNotNull(products.deletedAt) : isNull(products.deletedAt),
    input.status === "active" || input.status === "draft" ? eq(products.status, input.status) : undefined,
    input.storeCategoryId ? eq(products.sellerCategoryId, input.storeCategoryId) : undefined,
    input.maxStock !== undefined ? sql`${products.trackStock} AND ${products.quantity}::numeric <= ${input.maxStock}` : undefined,
    pattern
      ? or(
          ilike(products.sku, pattern),
          sql`EXISTS (SELECT 1 FROM ${productTranslations} pt WHERE pt.product_id = ${products.id} AND pt.title ILIKE ${pattern})`,
        )
      : undefined,
  );

  const [rows, [counted]] = await Promise.all([
    db.query.products.findMany({
      where,
      columns: { id: true, status: true, deletedAt: true, price: true, quantity: true, trackStock: true, sku: true, images: true, sellerCategoryId: true, updatedAt: true },
      with: {
        productTranslations: { columns: { locale: true, title: true } },
        productVariants: { columns: { id: true, stock: true } },
      },
      orderBy: [desc(products.updatedAt), desc(products.id)],
      limit: input.limit,
      offset: input.cursor,
    }),
    db.select({ total: count() }).from(products).where(where),
  ]);

  const items = rows.map((p) => {
    const price = readAgentPrice(p.price);
    const first = imageList(p.images)[0];
    const variantStock = p.productVariants.length ? variantStockTotal(p.productVariants.map((v) => ({ stock: v.stock ?? 0 }))) : null;
    return {
      id: p.id,
      title: {
        ar: p.productTranslations.find((t) => t.locale === "ar")?.title ?? null,
        en: p.productTranslations.find((t) => t.locale === "en")?.title ?? null,
      },
      status: p.status,
      inTrash: Boolean(p.deletedAt),
      price: price.price,
      compareAtPrice: price.compareAtPrice,
      stock: variantStock ?? Number(p.quantity ?? 0),
      trackStock: p.trackStock,
      variants: p.productVariants.length,
      sku: p.sku,
      image: first ? productImageUrl(first, supabaseUrl()) : null,
      storeCategoryId: p.sellerCategoryId,
      updatedAt: p.updatedAt,
    };
  });
  const nextCursor = input.cursor + rows.length < (counted?.total ?? 0) ? input.cursor + rows.length : null;
  return { items, nextCursor, total: counted?.total ?? 0 };
}

export async function agentGetProduct(ctx: AgentProductContext, productId: string) {
  const store = await loadStore(ctx, false);
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), storeShowsProduct(store, ctx.sellerId)),
    with: {
      productTranslations: true,
      productVariants: { orderBy: [asc(productVariants.position)] },
      category: { columns: { id: true, name: true, nameAr: true } },
    },
  });
  if (!product) throw new AgentProductError("not_found", "Product not found in this store.");

  const base = supabaseUrl();
  const price = readAgentPrice(product.price);
  const translation = (locale: "ar" | "en") => {
    const t = product.productTranslations.find((r) => r.locale === locale);
    return t
      ? {
          title: t.title,
          description: t.description,
          content: t.content,
          bulletPoints: Array.isArray(t.bulletPoints) ? t.bulletPoints : [],
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
          keywords: t.metaKeywords ?? [],
        }
      : null;
  };
  const [storeCategory] = product.sellerCategoryId
    ? await db
        .select({ id: sellerProductCategories.id, name: sellerProductCategories.name, nameAr: sellerProductCategories.nameAr })
        .from(sellerProductCategories)
        .where(and(eq(sellerProductCategories.id, product.sellerCategoryId), eq(sellerProductCategories.sellerId, ctx.sellerId)))
        .limit(1)
    : [];
  const enSlug = product.productTranslations.find((r) => r.locale === "en")?.slug ?? null;
  const dims = product.dimensions && typeof product.dimensions === "object" ? (product.dimensions as Record<string, unknown>) : null;

  return {
    id: product.id,
    status: product.status,
    inTrash: Boolean(product.deletedAt),
    sku: product.sku,
    slug: enSlug,
    url: enSlug && store.subdomain ? `https://${store.subdomain}.tallaby.com/products/${enSlug}` : null,
    price: price.price,
    compareAtPrice: price.compareAtPrice,
    discountEndsAt: price.discountEndsAt,
    quantity: Number(product.quantity ?? 0),
    trackStock: product.trackStock,
    images: imageList(product.images).map((path) => productImageUrl(path, base)),
    category: product.category ? { id: product.category.id, name: product.category.name, nameAr: product.category.nameAr } : null,
    storeCategory: storeCategory ?? null,
    condition: product.condition,
    freeDelivery: product.freeDelivery,
    maxOrderQuantity: product.maxOrderQuantity,
    weightGrams: dims && typeof dims.weight === "number" && (dims.weightUnit ?? "g") === "g" ? dims.weight : null,
    copy: { ar: translation("ar"), en: translation("en") },
    variants: product.productVariants.map((v) => {
      const vp = readAgentPrice(v.price);
      const localized = v.localized && typeof v.localized === "object" ? (v.localized as Record<string, Record<string, string>>) : {};
      return {
        id: v.id,
        title: { ar: localized.ar?.title ?? null, en: localized.en?.title ?? v.title },
        options: { ar: [localized.ar?.option1, localized.ar?.option2, localized.ar?.option3].filter(Boolean), en: [v.option1, v.option2, v.option3].filter(Boolean) },
        price: vp.price,
        compareAtPrice: vp.compareAtPrice,
        stock: v.stock ?? 0,
        sku: v.sku,
        isDefault: v.isDefault ?? false,
        image: v.imageUrl ? productImageUrl(v.imageUrl, base) : null,
      };
    }),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function agentListStoreCategories(ctx: AgentProductContext) {
  await loadStore(ctx, false);
  const rows = await db
    .select({
      id: sellerProductCategories.id,
      name: sellerProductCategories.name,
      nameAr: sellerProductCategories.nameAr,
      tallabyCategoryId: sellerProductCategories.sourceCategoryId,
      products: sql<number>`(SELECT count(*)::int FROM ${products} p WHERE p.seller_category_id = ${sellerProductCategories.id} AND p.deleted_at IS NULL)`,
    })
    .from(sellerProductCategories)
    .where(eq(sellerProductCategories.sellerId, ctx.sellerId))
    .orderBy(asc(sellerProductCategories.position))
    .limit(SELLER_TAXONOMY_MAX_ITEMS);
  return rows;
}

/** Tallaby's category pack, searched in Arabic and English (the required categoryId on a product). */
export async function agentSearchCategories(ctx: AgentProductContext, query: string) {
  await loadStore(ctx, false);
  const pattern = `%${query.trim().slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      nameAr: categories.nameAr,
      parent: sql<string | null>`(SELECT p.name FROM ${categories} p WHERE p.id = ${categories.parentId})`,
      parentAr: sql<string | null>`(SELECT p.name_ar FROM ${categories} p WHERE p.id = ${categories.parentId})`,
    })
    .from(categories)
    .where(or(ilike(categories.name, pattern), ilike(categories.nameAr, pattern)))
    .orderBy(desc(categories.productCount), asc(categories.name))
    .limit(15);
  return rows.filter((r) => r.name || r.nameAr);
}
