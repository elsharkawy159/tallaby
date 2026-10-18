import { z } from "zod";
import { roundPriceUpToNearestFive } from "../utils/round-price";

/**
 * Shopify product import (PLAN.md §9.2, P7-07). Pure: validators, the Admin
 * GraphQL client (injectable fetch, timeout), and the Shopify → Tallaby
 * product mapping. One-way import into DRAFT products; nothing is written
 * back to Shopify.
 */

/** Custom app on the seller's own shop; the brief's format, after normalising. */
export const SHOP_DOMAIN_RE = /^[a-z0-9-]+\.myshopify\.com$/;
/** Admin API access tokens (custom apps: shpat_…). */
const SHOPIFY_TOKEN_RE = /^shp[a-z]{2}_[A-Za-z0-9]{20,100}$/;
/** Supported for 12 months from release; override with SHOPIFY_ADMIN_API_VERSION. */
export const DEFAULT_SHOPIFY_API_VERSION = "2026-04";
const API_VERSION_RE = /^\d{4}-(01|04|07|10)$/;
export const SHOPIFY_TIMEOUT_MS = 15_000;
/** Products per server-action call: each may re-upload up to MAX_IMAGES images. */
export const SHOPIFY_IMPORT_CHUNK = 5;
export const SHOPIFY_MAX_IMAGES = 5;
export const SHOPIFY_MAX_VARIANTS = 50;
export const SHOPIFY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
/** Images are fetched from Shopify's CDN only (never a URL a seller typed). */
export const SHOPIFY_IMAGE_HOSTS = ["cdn.shopify.com"] as const;

export type ShopifyCredentials = { shopDomain: string; accessToken: string; apiVersion?: string };
export type ShopifySecret = { accessToken: string };

/** Accepts `my-shop`, `my-shop.myshopify.com` or a pasted admin URL. */
export function normalizeShopDomain(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 255) return null;
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "").split(/[/?#]/)[0] ?? "";
  if (value && !value.includes(".")) value = `${value}.myshopify.com`;
  return SHOP_DOMAIN_RE.test(value) ? value : null;
}

export type ShopifyConnectInputError = "invalid_shop_domain" | "invalid_token";

const connectSchema = z.strictObject({
  shopDomain: z.string().max(255),
  accessToken: z.string().max(200),
});

export function validateShopifyConnectInput(
  raw: unknown,
): { success: true; data: { shopDomain: string; accessToken: string } } | { success: false; error: ShopifyConnectInputError } {
  const parsed = connectSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "invalid_shop_domain" };
  const shopDomain = normalizeShopDomain(parsed.data.shopDomain);
  if (!shopDomain) return { success: false, error: "invalid_shop_domain" };
  const accessToken = parsed.data.accessToken.trim();
  if (!SHOPIFY_TOKEN_RE.test(accessToken)) return { success: false, error: "invalid_token" };
  return { success: true, data: { shopDomain, accessToken } };
}

export function isAllowedShopifyImageUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 2048) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && (SHOPIFY_IMAGE_HOSTS as readonly string[]).includes(url.hostname) && !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// GraphQL client

export type ShopifyErrorCode = "auth" | "scope" | "throttled" | "unreachable" | "failed";
export type ShopifyResult<T> = { ok: true; data: T } | { ok: false; error: ShopifyErrorCode };

type CallOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

export async function shopifyGraphql<T>(
  credentials: ShopifyCredentials,
  query: string,
  variables: Record<string, unknown> = {},
  { fetchImpl = fetch, timeoutMs = SHOPIFY_TIMEOUT_MS }: CallOptions = {},
): Promise<ShopifyResult<T>> {
  if (!SHOP_DOMAIN_RE.test(credentials.shopDomain)) return { ok: false, error: "auth" };
  const version =
    credentials.apiVersion && API_VERSION_RE.test(credentials.apiVersion) ? credentials.apiVersion : DEFAULT_SHOPIFY_API_VERSION;
  try {
    const response = await fetchImpl(`https://${credentials.shopDomain}/admin/api/${version}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": credentials.accessToken },
      body: JSON.stringify({ query, variables }),
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, error: "auth" };
    if (response.status === 429) return { ok: false, error: "throttled" };
    if (!response.ok) return { ok: false, error: response.status === 404 ? "auth" : "failed" };
    const body = (await response.json().catch(() => null)) as {
      data?: T;
      errors?: Array<{ extensions?: { code?: string } }>;
    } | null;
    if (body?.errors?.length) {
      const codes = body.errors.map((e) => e.extensions?.code);
      if (codes.includes("ACCESS_DENIED")) return { ok: false, error: "scope" };
      if (codes.includes("THROTTLED")) return { ok: false, error: "throttled" };
      return { ok: false, error: "failed" };
    }
    if (!body?.data) return { ok: false, error: "failed" };
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "unreachable" };
  }
}

export const SHOP_QUERY = `query TallabyShop { shop { name currencyCode } productsCount { count } }`;

export const PRODUCT_TYPES_QUERY = `query TallabyProductTypes($after: String) {
  products(first: 250, after: $after, sortKey: ID) { pageInfo { hasNextPage endCursor } nodes { productType } }
}`;

export const PRODUCTS_QUERY = `query TallabyProducts($first: Int!, $after: String) {
  products(first: $first, after: $after, sortKey: ID) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id legacyResourceId title handle descriptionHtml productType
      media(first: ${SHOPIFY_MAX_IMAGES}) { nodes { ... on MediaImage { image { url } } } }
      variants(first: ${SHOPIFY_MAX_VARIANTS}) {
        pageInfo { hasNextPage }
        nodes {
          title sku price compareAtPrice inventoryQuantity
          selectedOptions { name value }
          media(first: 1) { nodes { ... on MediaImage { image { url } } } }
        }
      }
    }
  }
}`;

export type ShopifyShop = { shop: { name: string; currencyCode: string }; productsCount: { count: number } | null };

type MediaNodes = { nodes: Array<{ image?: { url?: string | null } | null }> } | null | undefined;

export type ShopifyVariantNode = {
  title: string | null;
  sku: string | null;
  price: string | null;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
  selectedOptions: Array<{ name: string; value: string }> | null;
  media?: MediaNodes;
};

export type ShopifyProductNode = {
  id: string;
  legacyResourceId: string;
  title: string;
  handle: string | null;
  descriptionHtml: string | null;
  productType: string | null;
  media?: MediaNodes;
  variants: { pageInfo?: { hasNextPage: boolean }; nodes: ShopifyVariantNode[] };
};

export type ShopifyProductsPage = {
  products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyProductNode[] };
};

// ---------------------------------------------------------------------------
// Mapping

/** The Tallaby `products.price` / `product_variants.price` jsonb, as the dashboard form stores it. */
export type TallabyPrice = {
  base: number;
  list: number;
  final: number;
  discountType: "amount" | null;
  discountValue: number | null;
  discountEndsAt: null;
};

export type MappedVariant = {
  title: string;
  sku: string;
  price: TallabyPrice;
  stock: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  isDefault: boolean;
  position: number;
  /** Shopify CDN URL, re-uploaded by the importer. */
  imageUrl: string | null;
};

export type MappedProduct = {
  shopifyId: string;
  /** Idempotency key: unique per seller through `unique_product_seller_sku_idx`. */
  sku: string;
  title: string;
  slugBase: string;
  categoryId: string;
  /** Sanitized rich text for `product_translations.content`. */
  content: string | null;
  /** Plain-text summary for `product_translations.description`. */
  description: string | null;
  price: TallabyPrice;
  quantity: number;
  variants: MappedVariant[];
  imageUrls: string[];
  warnings: ShopifyMappingWarning[];
};

export type ShopifyMappingWarning = "variants_truncated" | "zero_price" | "image_skipped";

export function shopifySku(legacyResourceId: string): string {
  return `shopify-${legacyResourceId}`;
}

/** Decimal string → integer piastres (no float drift), or null. */
export function toPiastres(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !/^\d{1,9}(\.\d{1,4})?$/.test(value.trim())) return null;
  const [whole, frac = ""] = value.trim().split(".");
  return Number(whole) * 100 + Math.round(Number(`0.${frac || "0"}`) * 100);
}

/**
 * Shopify price + compare-at → the Tallaby price object, rounded up to the
 * nearest 5 like every price the dashboard stores (normalizeProductPricePayload).
 */
export function mapShopifyPrice(price: string | null, compareAtPrice: string | null): TallabyPrice {
  const finalP = toPiastres(price) ?? 0;
  const compareP = toPiastres(compareAtPrice);
  const listP = compareP != null && compareP > finalP ? compareP : finalP;
  const final = finalP > 0 ? roundPriceUpToNearestFive(finalP / 100) : 0;
  const list = listP > 0 ? roundPriceUpToNearestFive(listP / 100) : 0;
  const discount = list > final ? list - final : 0;
  return {
    base: list,
    list,
    final,
    discountType: discount > 0 ? "amount" : null,
    discountValue: discount > 0 ? discount : null,
    discountEndsAt: null,
  };
}

export function slugifyHandle(handle: string | null | undefined, fallback: string): string {
  const slug = (handle ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

export function htmlToSummary(html: string | null | undefined, max = 300): string | null {
  if (!html) return null;
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function mediaUrls(media: MediaNodes): string[] {
  return (media?.nodes ?? []).map((n) => n.image?.url).filter((u): u is string => isAllowedShopifyImageUrl(u));
}

/** A single "Default Title" variant means the product has no options. */
function isSingleDefaultVariant(variants: ShopifyVariantNode[]): boolean {
  return (
    variants.length === 1 &&
    (variants[0]!.title === "Default Title" ||
      (variants[0]!.selectedOptions ?? []).every((o) => o.name === "Title" && o.value === "Default Title"))
  );
}

/**
 * Maps one Shopify product to a Tallaby draft. `sanitizeHtml` is the
 * dashboard's rich-text sanitizer (injected so this stays dependency-free).
 */
export function mapShopifyProduct(
  node: ShopifyProductNode,
  options: { categoryId: string; sanitizeHtml: (html: string) => string | null },
): MappedProduct {
  const warnings: ShopifyMappingWarning[] = [];
  const sku = shopifySku(node.legacyResourceId);
  const title = node.title.trim().slice(0, 250) || sku;
  const variantNodes = node.variants.nodes ?? [];
  if (node.variants.pageInfo?.hasNextPage) warnings.push("variants_truncated");

  const variants: MappedVariant[] = isSingleDefaultVariant(variantNodes)
    ? []
    : variantNodes.map((v, index) => {
        const options = (v.selectedOptions ?? []).map((o) => o.value.slice(0, 100));
        return {
          title: (v.title ?? options.join(" / ")).slice(0, 250) || `${title} ${index + 1}`,
          sku: (v.sku ?? "").trim().slice(0, 100) || `${sku}-${index + 1}`,
          price: mapShopifyPrice(v.price, v.compareAtPrice),
          stock: Math.max(0, Math.trunc(v.inventoryQuantity ?? 0)),
          option1: options[0] ?? null,
          option2: options[1] ?? null,
          option3: options[2] ?? null,
          isDefault: index === 0,
          position: index + 1,
          imageUrl: mediaUrls(v.media)[0] ?? null,
        };
      });

  const first = variantNodes[0];
  const price = variants[0]?.price ?? mapShopifyPrice(first?.price ?? null, first?.compareAtPrice ?? null);
  if (price.final <= 0) warnings.push("zero_price");
  const quantity = variants.length
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : Math.max(0, Math.trunc(first?.inventoryQuantity ?? 0));

  const content = node.descriptionHtml ? options.sanitizeHtml(node.descriptionHtml) : null;

  return {
    shopifyId: node.legacyResourceId,
    sku,
    title,
    slugBase: slugifyHandle(node.handle, sku),
    categoryId: options.categoryId,
    content,
    description: htmlToSummary(node.descriptionHtml),
    price,
    quantity,
    variants,
    imageUrls: mediaUrls(node.media).slice(0, SHOPIFY_MAX_IMAGES),
    warnings,
  };
}

/** The Shopify product type a seller maps to a category ("" = none). */
export function shopifyTypeKey(productType: string | null | undefined): string {
  return (productType ?? "").trim().slice(0, 100);
}

/** Picks the category for a product type, falling back to the default. */
export function categoryForType(
  productType: string | null | undefined,
  categoryMap: Record<string, string>,
  defaultCategoryId: string,
): string {
  return categoryMap[shopifyTypeKey(productType)] || defaultCategoryId;
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Downloads one image from Shopify's CDN: host allow-list, no redirects,
 * JPEG/PNG/WebP only, at most 2 MB (asks the CDN for a 1600px rendition).
 */
export async function fetchShopifyImage(
  rawUrl: string,
  { fetchImpl = fetch, timeoutMs = SHOPIFY_TIMEOUT_MS, maxBytes = SHOPIFY_IMAGE_MAX_BYTES }: CallOptions & { maxBytes?: number } = {},
): Promise<{ ok: true; bytes: ArrayBuffer; contentType: string; ext: string } | { ok: false; reason: string }> {
  if (!isAllowedShopifyImageUrl(rawUrl)) return { ok: false, reason: "host_not_allowed" };
  const url = new URL(rawUrl);
  url.searchParams.set("width", "1600");
  try {
    const response = await fetchImpl(url.toString(), {
      redirect: "error",
      headers: { accept: "image/jpeg,image/png,image/webp" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return { ok: false, reason: `http_${response.status}` };
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase().split(";")[0]!.trim();
    const ext = IMAGE_TYPES[contentType];
    if (!ext) return { ok: false, reason: "unsupported_type" };
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > maxBytes) return { ok: false, reason: "too_large" };
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > maxBytes) return { ok: false, reason: "too_large" };
    return { ok: true, bytes, contentType, ext };
  } catch {
    return { ok: false, reason: "download_failed" };
  }
}
