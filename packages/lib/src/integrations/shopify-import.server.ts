import {
  and,
  categories,
  db,
  eq,
  inArray,
  products,
  productTranslations,
  productVariants,
  sql,
  storeIntegrations,
} from "@workspace/db";
import { decryptCredentials, encryptCredentials } from "./crypto.server";
import { INTEGRATIONS } from "./registry";
import {
  categoryForType,
  fetchShopifyImage,
  mapShopifyProduct,
  PRODUCT_TYPES_QUERY,
  PRODUCTS_QUERY,
  SHOP_QUERY,
  SHOPIFY_IMPORT_CHUNK,
  shopifyGraphql,
  shopifySku,
  shopifyTypeKey,
  validateShopifyConnectInput,
  type MappedProduct,
  type ShopifyCredentials,
  type ShopifyErrorCode,
  type ShopifyMappingWarning,
  type ShopifyProductsPage,
  type ShopifyResult,
  type ShopifySecret,
  type ShopifyShop,
} from "./shopify.lib";
import {
  ownStoreStatus,
  summaryColumns,
  toIntegrationSummary,
  UUID_RE,
  type IntegrationResult,
  type Queryable,
  type StoreIntegrationSummary,
} from "./store-integrations.server";

/**
 * Shopify import data access (PLAN.md §9.2, P7-07). There is no job system,
 * so the dashboard drives the import with repeated server actions, each
 * handling one page of SHOPIFY_IMPORT_CHUNK products from a Shopify cursor.
 * Products are created as DRAFTS for the session seller (products are
 * seller-scoped; the store only scopes the connection). Re-runs are idempotent:
 * the product SKU is `shopify-<product id>`, unique per seller.
 */

const PROVIDER = "shopify_import" as const;

export type ShopifyCallOptions = { fetchImpl?: typeof fetch; timeoutMs?: number; apiVersion?: string };

export type ConnectShopifyError =
  | "not_found"
  | "store_read_only"
  | "not_available"
  | "invalid_shop_domain"
  | "invalid_token"
  | ShopifyErrorCode;

/** Connects a shop: the token is checked against the shop before it is stored. */
export async function connectShopify(
  sellerId: string,
  actorId: string,
  storeId: string,
  rawInput: unknown,
  options: ShopifyCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<StoreIntegrationSummary, ConnectShopifyError>> {
  const { q = db, apiVersion, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (INTEGRATIONS[PROVIDER].availability !== "available") return { success: false, error: "not_available" };
  const input = validateShopifyConnectInput(rawInput);
  if (!input.success) return { success: false, error: input.error };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const shop = await shopifyGraphql<ShopifyShop>({ ...input.data, apiVersion }, SHOP_QUERY, {}, callOptions);
  if (!shop.ok) return { success: false, error: shop.error };

  const secret: ShopifySecret = { accessToken: input.data.accessToken };
  const credentialsEncrypted = encryptCredentials(secret, { storeId, provider: PROVIDER });
  const config = {
    shopDomain: input.data.shopDomain,
    shopName: shop.data.shop.name.slice(0, 200),
    shopCurrency: shop.data.shop.currencyCode.slice(0, 8),
    importedProducts: 0,
  };

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;
    const [row] = await tx
      .insert(storeIntegrations)
      .values({
        storeId,
        sellerId,
        provider: PROVIDER,
        status: "connected",
        config,
        credentialsEncrypted,
        scopes: ["read_products", "read_inventory"],
        externalAccountId: input.data.shopDomain,
        connectedBy: actorId,
        connectedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [storeIntegrations.storeId, storeIntegrations.provider],
        set: {
          status: "connected",
          config,
          credentialsEncrypted,
          externalAccountId: input.data.shopDomain,
          lastError: null,
          connectedBy: actorId,
          connectedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning(summaryColumns);
    return { success: true, data: toIntegrationSummary(PROVIDER, row!) } as const;
  });
}

async function loadShopify(
  q: Queryable,
  sellerId: string,
  storeId: string,
  apiVersion?: string,
): Promise<{ credentials: ShopifyCredentials; config: Record<string, unknown>; storeStatus: string } | null> {
  if (!UUID_RE.test(storeId)) return null;
  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return null;
  const [row] = await q
    .select({ config: storeIntegrations.config, secret: storeIntegrations.credentialsEncrypted })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  const config = (row?.config ?? {}) as Record<string, unknown>;
  if (!row?.secret || typeof config.shopDomain !== "string") return null;
  try {
    const { accessToken } = decryptCredentials<ShopifySecret>(row.secret, { storeId, provider: PROVIDER });
    return { credentials: { shopDomain: config.shopDomain, accessToken, apiVersion }, config, storeStatus: store.status };
  } catch {
    return null;
  }
}

async function recordShopifyError(q: Queryable, storeId: string, error: ShopifyErrorCode): Promise<void> {
  await q
    .update(storeIntegrations)
    .set({ status: "error", lastError: `Shopify: ${error}`, updatedAt: sql`now()` })
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.provider, PROVIDER)));
}

export type ShopifyPreview = {
  count: number;
  currency: string;
  /** Distinct Shopify product types ("" = no type), for the category mapping. */
  productTypes: string[];
  /** True when the shop has more products than the type scan read. */
  typesTruncated: boolean;
};

const PREVIEW_MAX_PAGES = 20; // 20 × 250 = 5,000 products scanned for types

type ShopifyTypesPage = {
  products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Array<{ productType: string | null }> };
};

/** Product count, currency and the product types to map to categories. */
export async function previewShopifyImport(
  sellerId: string,
  storeId: string,
  options: ShopifyCallOptions & { q?: Queryable } = {},
): Promise<IntegrationResult<ShopifyPreview, "not_connected" | ShopifyErrorCode>> {
  const { q = db, apiVersion, ...callOptions } = options;
  const loaded = await loadShopify(q, sellerId, storeId, apiVersion);
  if (!loaded) return { success: false, error: "not_connected" };

  const shop = await shopifyGraphql<ShopifyShop>(loaded.credentials, SHOP_QUERY, {}, callOptions);
  if (!shop.ok) {
    await recordShopifyError(q, storeId, shop.error);
    return { success: false, error: shop.error };
  }

  const types = new Set<string>();
  let after: string | null = null;
  let truncated = false;
  for (let page = 0; ; page++) {
    if (page >= PREVIEW_MAX_PAGES) {
      truncated = true;
      break;
    }
    const result: ShopifyResult<ShopifyTypesPage> = await shopifyGraphql<ShopifyTypesPage>(
      loaded.credentials,
      PRODUCT_TYPES_QUERY,
      { after },
      callOptions,
    );
    if (!result.ok) {
      await recordShopifyError(q, storeId, result.error);
      return { success: false, error: result.error };
    }
    for (const node of result.data.products.nodes) types.add(shopifyTypeKey(node.productType));
    if (!result.data.products.pageInfo.hasNextPage) break;
    after = result.data.products.pageInfo.endCursor;
  }

  return {
    success: true,
    data: {
      count: shop.data.productsCount?.count ?? 0,
      currency: shop.data.shop.currencyCode,
      productTypes: [...types].sort((a, b) => a.localeCompare(b)),
      typesTruncated: truncated,
    },
  };
}

export type ShopifyImportItem = {
  shopifyId: string;
  title: string;
  status: "created" | "skipped" | "failed";
  productId?: string;
  error?: string;
  warnings?: ShopifyMappingWarning[];
};

export type ShopifyChunkResult = { nextCursor: string | null; items: ShopifyImportItem[] };

export type ShopifyChunkError = "not_connected" | "store_read_only" | "invalid_category" | ShopifyErrorCode;

export type ShopifyImportDeps = {
  /** The dashboard's rich-text sanitizer (Tiptap allow-list). */
  sanitizeHtml: (html: string) => string | null;
  /** Stores image bytes in the products bucket and returns the object path, or null. */
  uploadImage: (bytes: ArrayBuffer, contentType: string, ext: string) => Promise<string | null>;
};

/** A slug not used by another product in that locale (uniqueness is app-enforced). */
async function freeSlug(q: Queryable, base: string, shopifyId: string): Promise<string> {
  const candidates = [base, `${base}-${shopifyId}`];
  const taken = await q
    .select({ slug: productTranslations.slug })
    .from(productTranslations)
    .where(and(eq(productTranslations.locale, "en"), inArray(productTranslations.slug, candidates)));
  const used = new Set(taken.map((t) => t.slug));
  return candidates.find((c) => !used.has(c)) ?? `${base}-${shopifyId}-${Date.now().toString(36)}`;
}

async function uploadImages(
  urls: string[],
  deps: ShopifyImportDeps,
  options: ShopifyCallOptions,
): Promise<{ paths: Map<string, string>; skipped: number }> {
  const paths = new Map<string, string>();
  let skipped = 0;
  for (const url of urls) {
    if (paths.has(url)) continue;
    const image = await fetchShopifyImage(url, options);
    const path = image.ok ? await deps.uploadImage(image.bytes, image.contentType, image.ext).catch(() => null) : null;
    if (path) paths.set(url, path);
    else skipped++;
  }
  return { paths, skipped };
}

/** Inserts one mapped product (draft) with its variants and AR/EN translations. */
async function insertDraftProduct(
  q: Queryable,
  sellerId: string,
  mapped: MappedProduct,
  images: string[],
  variantImage: (url: string | null) => string | null,
): Promise<string | null> {
  const slug = await freeSlug(q, mapped.slugBase, mapped.shopifyId);
  return q.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values({
        sellerId,
        categoryId: mapped.categoryId,
        sku: mapped.sku,
        status: "draft",
        quantity: String(mapped.quantity),
        price: mapped.price,
        images: images.length ? images : null,
      })
      .onConflictDoNothing({ target: [products.sellerId, products.sku] })
      .returning({ id: products.id });
    if (!created) return null; // imported by a concurrent run

    if (mapped.variants.length) {
      await tx.insert(productVariants).values(
        mapped.variants.map((v) => {
          const path = variantImage(v.imageUrl) ?? (v.isDefault ? (images[0] ?? null) : null);
          return {
            productId: created.id,
            title: v.title,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            imageUrl: path,
            images: path ? [path] : null,
            isDefault: v.isDefault,
            position: v.position,
            option1: v.option1,
            option2: v.option2,
            option3: v.option3,
          };
        }),
      );
    }

    // Shopify has one title/description: both locales get it (the seller can translate later).
    await tx.insert(productTranslations).values(
      (["en", "ar"] as const).map((locale) => ({
        productId: created.id,
        locale,
        title: mapped.title,
        description: mapped.description,
        content: mapped.content,
        bulletPoints: [],
        slug,
      })),
    );
    return created.id;
  });
}

/**
 * Imports one page of products. `cursor` is the Shopify page cursor the
 * previous call returned (null to start). Category ids are checked to exist;
 * an unknown product type falls back to `defaultCategoryId`. Every product
 * gets its own result line; one failure never stops the page.
 */
export async function importShopifyChunk(
  sellerId: string,
  storeId: string,
  input: { cursor: string | null; categoryMap: Record<string, string>; defaultCategoryId: string },
  deps: ShopifyImportDeps,
  options: ShopifyCallOptions & { q?: Queryable; chunkSize?: number } = {},
): Promise<IntegrationResult<ShopifyChunkResult, ShopifyChunkError>> {
  const { q = db, apiVersion, chunkSize = SHOPIFY_IMPORT_CHUNK, ...callOptions } = options;
  const loaded = await loadShopify(q, sellerId, storeId, apiVersion);
  if (!loaded) return { success: false, error: "not_connected" };
  if (loaded.storeStatus !== "active") return { success: false, error: "store_read_only" };

  const categoryIds = [...new Set([input.defaultCategoryId, ...Object.values(input.categoryMap)])];
  if (!categoryIds.every((id) => UUID_RE.test(id))) return { success: false, error: "invalid_category" };
  const found = await q.select({ id: categories.id }).from(categories).where(inArray(categories.id, categoryIds));
  if (found.length !== categoryIds.length) return { success: false, error: "invalid_category" };

  const page = await shopifyGraphql<ShopifyProductsPage>(
    loaded.credentials,
    PRODUCTS_QUERY,
    { first: Math.min(Math.max(chunkSize, 1), 10), after: input.cursor },
    callOptions,
  );
  if (!page.ok) {
    await recordShopifyError(q, storeId, page.error);
    return { success: false, error: page.error };
  }

  const nodes = page.data.products.nodes;
  const existing = nodes.length
    ? await q
        .select({ sku: products.sku })
        .from(products)
        .where(and(eq(products.sellerId, sellerId), inArray(products.sku, nodes.map((n) => shopifySku(n.legacyResourceId)))))
    : [];
  const existingSkus = new Set(existing.map((e) => e.sku));

  const items: ShopifyImportItem[] = [];
  let created = 0;
  for (const node of nodes) {
    const base = { shopifyId: node.legacyResourceId, title: node.title.slice(0, 120) };
    if (existingSkus.has(shopifySku(node.legacyResourceId))) {
      items.push({ ...base, status: "skipped", error: "already_imported" });
      continue;
    }
    try {
      const mapped = mapShopifyProduct(node, {
        categoryId: categoryForType(node.productType, input.categoryMap, input.defaultCategoryId),
        sanitizeHtml: deps.sanitizeHtml,
      });
      const urls = [...mapped.imageUrls, ...mapped.variants.map((v) => v.imageUrl).filter((u): u is string => Boolean(u))];
      const { paths, skipped } = await uploadImages(urls, deps, callOptions);
      const warnings = [...mapped.warnings];
      if (skipped) warnings.push("image_skipped");
      const images = mapped.imageUrls.map((u) => paths.get(u)).filter((p): p is string => Boolean(p));
      const productId = await insertDraftProduct(q, sellerId, mapped, images, (url) => (url ? (paths.get(url) ?? null) : null));
      if (!productId) {
        items.push({ ...base, status: "skipped", error: "already_imported" });
        continue;
      }
      created++;
      items.push({ ...base, status: "created", productId, ...(warnings.length ? { warnings } : {}) });
    } catch (error) {
      // A Postgres code (e.g. 23505) only, never the row data.
      const code = (error as { code?: unknown })?.code;
      items.push({ ...base, status: "failed", error: typeof code === "string" ? `db_${code}` : "import_failed" });
    }
  }

  await q
    .update(storeIntegrations)
    .set({
      status: "connected",
      lastError: null,
      lastSyncedAt: sql`now()`,
      updatedAt: sql`now()`,
      config: sql`jsonb_set(${storeIntegrations.config}, '{importedProducts}', to_jsonb(COALESCE((${storeIntegrations.config}->>'importedProducts')::int, 0) + ${created}::int))`,
    })
    .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)));

  const { hasNextPage, endCursor } = page.data.products.pageInfo;
  return { success: true, data: { nextCursor: hasNextPage ? endCursor : null, items } };
}
