import { and, categories, db, desc, eq, inArray, productTranslations, products, sql, storeProducts } from "@workspace/db";
import { parsePriceJson } from "@workspace/lib";
import { BLOG_FIELDS, cmsItemPath, cmsItemSummaryFields } from "@workspace/lib/cms";
import { listCmsCollections, listCmsItems } from "@workspace/lib/cms/server";
import { listStoreFormDefinitions } from "@workspace/lib/store-forms/server";
import {
  sellerBrandList,
  sellerCoupons,
  storeProductSales,
  storeReviewStats,
  storeReviews,
} from "@workspace/lib/store-sites/catalog-data";
import { BEST_SELLER_DAYS, TRENDING_DAYS } from "@workspace/lib/store-sites/catalog-data.lib";
import type {
  EditorBrand,
  EditorCatalogSnapshot,
  EditorCategory,
  EditorCoupon,
  EditorForm,
  EditorProduct,
  EditorReview,
  EditorStoreData,
} from "@workspace/store-editor/editor.dto";
import type { ContentItemSummary } from "@workspace/store-sections/render";

// The shapes moved to @workspace/store-editor; re-exported so existing imports keep working.
export type { EditorBrand, EditorCatalogSnapshot, EditorCategory, EditorCoupon, EditorForm, EditorProduct, EditorReview, EditorStoreData };

/**
 * Read-only data the editor canvas needs to preview commerce sections
 * (PLAN.md P4-06, P4-07): the active products this store can show (the
 * seller's, or the store's picks in selected catalog mode) and their categories. Loaded once per editor session; the canvas filters it locally.
 * Never cached (seller-specific editor data).
 */

/** The store's forms (checked against the session seller by the lib). Never cached. */
export async function loadEditorForms(sellerId: string, storeId: string): Promise<EditorForm[]> {
  const forms = await listStoreFormDefinitions(sellerId, storeId);
  return forms.map((f) => ({
    id: f.id,
    name: f.name,
    active: f.status === "active",
    form: { id: f.id, fields: f.fields, submitLabel: f.settings.submitLabel, successMessage: f.settings.successMessage },
  }));
}

const MAX_PRODUCTS = 300;

function publicImage(path: unknown): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

/**
 * The store's published blog posts, newest first, for post lists on the
 * canvas (checked against the session seller by the lib). Never creates the
 * blog: a store without one simply has no posts yet.
 */
export async function loadEditorPosts(sellerId: string, storeId: string): Promise<ContentItemSummary[]> {
  const blog = (await listCmsCollections(sellerId, storeId))?.find((c) => c.kind === "blog");
  if (!blog) return [];
  const list = await listCmsItems(sellerId, storeId, blog.id, { state: "published", limit: 24 });
  return (list?.items ?? []).map((item) => {
    const summary = cmsItemSummaryFields(BLOG_FIELDS, item.data);
    return {
      id: item.id,
      title: summary.title || item.slug,
      href: cmsItemPath(blog.slug, item.slug),
      excerpt: summary.excerpt ?? (item.seo.description || null),
      image: summary.image,
      publishedAt: item.publishedAt,
      tags: summary.tags,
    };
  });
}

/** One load of the store data for the editor; `catalogMode` is the store's catalog mode (D24). */
export async function loadEditorSnapshot(sellerId: string, storeId: string, catalogMode: string | null | undefined): Promise<EditorCatalogSnapshot> {
  const catalogStoreId = catalogMode === "selected" ? storeId : undefined;
  const postsFailed: EditorStoreData["failed"] = [];
  const [catalog, forms, extra, posts] = await Promise.all([
    loadEditorCatalog(sellerId, catalogStoreId, { salesStoreId: storeId }),
    loadEditorForms(sellerId, storeId),
    loadEditorStoreData(sellerId, catalogStoreId),
    attempt("posts", postsFailed, () => loadEditorPosts(sellerId, storeId)),
  ]);
  return {
    products: catalog.products,
    categories: catalog.categories,
    forms,
    posts,
    ...extra,
    failed: [...extra.failed, ...postsFailed, ...(catalog.salesFailed ? (["sales"] as const) : [])],
  };
}

/** Runs a loader, turning a failure into `null` plus a `failed` entry (logged, never thrown). */
async function attempt<T, K extends string>(key: K, failed: K[], load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`[editor-data] ${key} failed`, error instanceof Error ? error.message : error);
    failed.push(key);
    return null;
  }
}

/**
 * Brands, reviews and coupons for the canvas, all for the session seller
 * (reviews only for this store's products in selected catalog mode).
 */
export async function loadEditorStoreData(sellerId: string, catalogStoreId?: string): Promise<EditorStoreData> {
  const failed: EditorStoreData["failed"] = [];
  const [brandRows, reviewRows, reviewStats, coupons] = await Promise.all([
    attempt("brands", failed, () => sellerBrandList(sellerId)),
    attempt("reviews", failed, () => storeReviews(sellerId, catalogStoreId, { limit: 24 })),
    attempt("reviews", failed, () => storeReviewStats(sellerId, catalogStoreId)),
    attempt("coupons", failed, () => sellerCoupons(sellerId)),
  ]);
  return {
    brands: brandRows?.map((b) => ({ id: b.id, name: { ar: b.nameAr || b.name, en: b.name || b.nameAr || "" }, logo: publicImage(b.logoUrl) })) ?? null,
    reviews:
      reviewRows?.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: r.authorName,
        verified: r.verified,
        productId: r.productId,
        productTitle: { ar: r.productTitle.ar ?? r.productTitle.en ?? "", en: r.productTitle.en ?? r.productTitle.ar ?? "" },
        createdAt: r.createdAt,
      })) ?? null,
    reviewStats,
    coupons,
    failed: [...new Set(failed)],
  };
}

/**
 * `catalogStoreId` is set for a store in selected catalog mode (D24): only its picks are listed.
 * With `salesStoreId`, units sold in that store's orders are loaded too (best sellers, trending).
 */
export async function loadEditorCatalog(
  sellerId: string,
  catalogStoreId?: string,
  options: { salesStoreId?: string } = {},
): Promise<{ products: EditorProduct[]; categories: EditorCategory[]; salesFailed: boolean }> {
  const salesFailed: "sales"[] = [];
  const salesStoreId = options.salesStoreId;
  const [sales90, sales14] = salesStoreId
    ? await Promise.all([
        attempt("sales", salesFailed, () => storeProductSales(sellerId, salesStoreId, BEST_SELLER_DAYS)),
        attempt("sales", salesFailed, () => storeProductSales(sellerId, salesStoreId, TRENDING_DAYS)),
      ])
    : [null, null];
  const rows = await db
    .select({
      id: products.id,
      images: products.images,
      price: products.price,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      quantity: products.quantity,
      createdAt: products.createdAt,
      averageRating: products.averageRating,
      titleAr: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'ar' LIMIT 1)`,
      titleEn: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'en' LIMIT 1)`,
      slug: sql<
        string | null
      >`(SELECT coalesce(t.slug, '') FROM ${productTranslations} t WHERE t.product_id = ${products.id} ORDER BY (t.locale = 'ar') DESC LIMIT 1)`,
    })
    .from(products)
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        catalogStoreId ? sql`EXISTS (SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${catalogStoreId} AND sp.product_id = ${products.id})` : undefined,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(MAX_PRODUCTS);

  const list: EditorProduct[] = rows.map((row) => {
    const price = parsePriceJson(row.price);
    const final = price.final ?? null;
    const list = price.list ?? null;
    const title = { ar: row.titleAr ?? row.titleEn ?? "", en: row.titleEn ?? row.titleAr ?? "" };
    return {
      id: row.id,
      title,
      slug: row.slug || row.id,
      image: publicImage(Array.isArray(row.images) ? row.images[0] : null),
      price: final,
      compareAtPrice: list != null && final != null && list > final ? list : null,
      isFeatured: Boolean(row.isFeatured),
      categoryId: row.categoryId,
      inStock: Number(row.quantity ?? 0) > 0,
      createdAt: row.createdAt ?? "",
      rating: row.averageRating != null && Number(row.averageRating) > 0 ? Number(row.averageRating) : null,
      sold90: sales90?.get(row.id) ?? 0,
      sold14: sales14?.get(row.id) ?? 0,
    };
  });

  const categoryIds = [...new Set(list.map((p) => p.categoryId))];
  const categoryRows = categoryIds.length
    ? await db
        .select({ id: categories.id, name: categories.name, nameAr: categories.nameAr, imageUrl: categories.imageUrl })
        .from(categories)
        .where(inArray(categories.id, categoryIds))
    : [];

  return {
    salesFailed: salesFailed.length > 0,
    products: list,
    categories: categoryRows
      .map((c) => ({
        id: c.id,
        name: { ar: c.nameAr ?? c.name ?? "", en: c.name ?? c.nameAr ?? "" },
        image: publicImage(c.imageUrl) ?? list.find((p) => p.categoryId === c.id && p.image)?.image ?? null,
        productCount: list.filter((p) => p.categoryId === c.id).length,
      }))
      .sort((a, b) => b.productCount - a.productCount),
  };
}
