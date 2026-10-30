import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

/**
 * Shareable catalog links (ROADMAP.md F-11c "Easy Catalog"). A catalog is not
 * stored anywhere: its link carries a signed token naming the store and what
 * it shows (picked products, one store category, or the newest products),
 * plus an optional title. The storefront page resolves the store from the
 * request HOST, recomputes the HMAC with that store's seller id and checks
 * the token's store id is the host's store, so a token never opens another
 * store's catalog and can't be edited. What the page lists is read live
 * (active, non-trashed products of that store's catalog), so a product taken
 * down simply drops out of every link that names it.
 *
 * Token: `base64url(body).base64url(mac)`, body (binary, so a 48-product
 * link stays near 1 KB, fine for WhatsApp):
 *   [0] version (1) · [1] kind (1 products, 2 category, 3 newest)
 *   [2..18) store id (16 bytes) · [18] title byte length · title (UTF-8)
 *   kind 1: [n] count, then n × 16-byte product ids
 *   kind 2: [n] key byte length, then the store category key (UTF-8)
 * mac = first 16 bytes of HMAC-SHA256(key, "tallaby:catalog:v1|<seller id>|" + body).
 * The key is derived with HKDF from INTEGRATIONS_ENCRYPTION_KEY (no new
 * secret); rotating that key retires every link. Server-only (node:crypto).
 */

export const CATALOG_SHARE_MAX_PRODUCTS = 48;
export const CATALOG_SHARE_MAX_TITLE = 80; // characters
const MAX_TITLE_BYTES = 255;
const MAX_KEY_BYTES = 200;
const MAC_BYTES = 16;
const VERSION = 1;
const MAX_TOKEN_LENGTH = 2400;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CatalogShareSource =
  | { kind: "products"; productIds: string[] }
  | { kind: "category"; categoryKey: string }
  | { kind: "newest" };

export type CatalogSharePayload = {
  storeId: string;
  title: string | null;
  source: CatalogShareSource;
};

const KIND_CODE = { products: 1, category: 2, newest: 3 } as const;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** HKDF-derived HMAC key, so the integrations key is never used directly. */
export function deriveCatalogShareKey(key: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", key, Buffer.alloc(0), "tallaby:catalog-share:v1", 32));
}

function uuidBytes(id: string): Buffer {
  return Buffer.from(id.replace(/-/g, ""), "hex");
}

function bytesUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Valid, distinct product ids in the order given, at most CATALOG_SHARE_MAX_PRODUCTS. */
export function normalizeCatalogProductIds(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!isUuid(id)) continue;
    const lower = id.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(lower);
    if (out.length >= CATALOG_SHARE_MAX_PRODUCTS) break;
  }
  return out;
}

/** The title trimmed to one line and CATALOG_SHARE_MAX_TITLE characters, or null. */
export function normalizeCatalogTitle(title: unknown): string | null {
  if (typeof title !== "string") return null;
  const clean = Array.from(title.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim())
    .slice(0, CATALOG_SHARE_MAX_TITLE)
    .join("")
    .trim();
  return clean || null;
}

function mac(body: Buffer, sellerId: string, key: Buffer): Buffer {
  return createHmac("sha256", key)
    .update(`tallaby:catalog:v1|${sellerId.toLowerCase()}|`)
    .update(body)
    .digest()
    .subarray(0, MAC_BYTES);
}

/** Signs a catalog for `sellerId`'s store. Throws on input the page could never show. */
export function signCatalogShare(payload: CatalogSharePayload, sellerId: string, key: Buffer): string {
  if (!isUuid(payload.storeId) || !isUuid(sellerId)) throw new Error("catalog-share: invalid store or seller id");
  const title = Buffer.from(normalizeCatalogTitle(payload.title) ?? "", "utf8").subarray(0, MAX_TITLE_BYTES);
  const parts: Buffer[] = [
    Buffer.from([VERSION, KIND_CODE[payload.source.kind]]),
    uuidBytes(payload.storeId),
    Buffer.from([title.length]),
    title,
  ];
  if (payload.source.kind === "products") {
    const ids = normalizeCatalogProductIds(payload.source.productIds);
    if (!ids.length) throw new Error("catalog-share: no products");
    parts.push(Buffer.from([ids.length]), ...ids.map(uuidBytes));
  } else if (payload.source.kind === "category") {
    const categoryKey = Buffer.from(payload.source.categoryKey.trim(), "utf8");
    if (!categoryKey.length || categoryKey.length > MAX_KEY_BYTES) throw new Error("catalog-share: invalid category");
    parts.push(Buffer.from([categoryKey.length]), categoryKey);
  }
  const body = Buffer.concat(parts);
  return `${body.toString("base64url")}.${mac(body, sellerId, key).toString("base64url")}`;
}

/**
 * The catalog a token names, or null when it is malformed, tampered with or
 * signed for another seller. The caller still checks `storeId` is the host's store.
 */
export function verifyCatalogShare(token: unknown, sellerId: string, key: Buffer): CatalogSharePayload | null {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH || !isUuid(sellerId)) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]!) || !/^[A-Za-z0-9_-]+$/.test(parts[1]!)) return null;
  const body = Buffer.from(parts[0]!, "base64url");
  const signature = Buffer.from(parts[1]!, "base64url");
  const expected = mac(body, sellerId, key);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return decodeBody(body);
}

function decodeBody(body: Buffer): CatalogSharePayload | null {
  if (body.length < 19 || body[0] !== VERSION) return null;
  const kind = body[1];
  const storeId = bytesUuid(body.subarray(2, 18));
  const titleLength = body[18]!;
  let offset = 19 + titleLength;
  if (offset > body.length) return null;
  const title = normalizeCatalogTitle(body.subarray(19, offset).toString("utf8"));
  if (kind === KIND_CODE.newest) {
    return offset === body.length ? { storeId, title, source: { kind: "newest" } } : null;
  }
  if (offset >= body.length) return null;
  const count = body[offset]!;
  offset += 1;
  if (kind === KIND_CODE.products) {
    if (!count || count > CATALOG_SHARE_MAX_PRODUCTS || offset + count * 16 !== body.length) return null;
    const productIds: string[] = [];
    for (let i = 0; i < count; i += 1) productIds.push(bytesUuid(body.subarray(offset + i * 16, offset + (i + 1) * 16)));
    return { storeId, title, source: { kind: "products", productIds } };
  }
  if (kind === KIND_CODE.category) {
    if (!count || offset + count !== body.length) return null;
    const categoryKey = body.subarray(offset).toString("utf8");
    return categoryKey.trim() ? { storeId, title, source: { kind: "category", categoryKey } } : null;
  }
  return null;
}

/** Rows in the token's order, dropping ids the store no longer shows. */
export function orderCatalogRows<T extends { id: string }>(rows: readonly T[], productIds: readonly string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row]));
  const out: T[] = [];
  for (const id of productIds) {
    const row = byId.get(id.toLowerCase());
    if (row) out.push(row);
  }
  return out;
}

export type CatalogShareUrls = {
  /** The catalog in the store's default language. */
  url: string;
  /** The same catalog in the other language the store offers, or null. */
  altUrl: string | null;
  altLocale: "ar" | "en" | null;
  /** The printable page (opens the browser's print / Save as PDF). */
  printUrl: string;
};

/**
 * The catalog addresses on the store's live origin (`storeUrl`: its custom
 * domain, else its subdomain). Arabic is the unprefixed default on a store host.
 */
export function catalogShareUrls(origin: string, token: string, supportedLocales: readonly string[] | null | undefined): CatalogShareUrls {
  const base = origin.replace(/\/$/, "");
  const locales = supportedLocales?.length ? supportedLocales : ["ar"];
  const main = locales[0] === "en" ? "en" : "ar";
  const alt = main === "ar" ? (locales.includes("en") ? "en" : null) : locales.includes("ar") ? "ar" : null;
  const at = (locale: "ar" | "en") => `${base}${locale === "en" ? "/en" : ""}/catalog/${token}`;
  return { url: at(main), altUrl: alt ? at(alt) : null, altLocale: alt, printUrl: `${at(main)}?print=1` };
}

/** wa.me share link with the message and the catalog link. */
export function catalogWhatsAppHref(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message.trim()}\n${url}`.trim())}`;
}
