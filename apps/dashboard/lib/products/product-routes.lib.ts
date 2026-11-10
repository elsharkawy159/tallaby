/**
 * Where the Products pages live (ROADMAP.md F-87c slice 2): under the store
 * they act on, `/stores/<storeId>/products/…`. The old account-wide
 * `/products/…` URLs (bookmarks, emails, bell rows already stored, other
 * apps) still work: `app/(main)/products/[[...path]]` sends them to the same
 * page under the sidebar's selected store. Pure, so the mapping is unit-tested.
 */

/** The old, store-less prefix. Still what a link uses when there is no store. */
export const LEGACY_PRODUCTS_PATH = "/products";

/** Route pattern of the Products section, for `revalidatePath(pattern, "layout")`. */
export const STORE_PRODUCTS_PATTERN = "/stores/[storeId]/products";

/**
 * `/stores/<storeId>/products<sub>`. `sub` is "" or starts with "/", "?" or "#".
 * With no store (the seller has none yet) the old path, which the redirect
 * page handles.
 */
export function storeProductsHref(storeId: string | null | undefined, sub = ""): string {
  const tail = sub && !/^[/?#]/.test(sub) ? `/${sub}` : sub;
  return storeId ? `/stores/${encodeURIComponent(storeId)}/products${tail}` : `${LEGACY_PRODUCTS_PATH}${tail}`;
}

/** The query string of Next `searchParams`, repeated keys kept, in order. "" when empty. */
export function searchParamsQuery(searchParams: Record<string, string | string[] | undefined> | undefined): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) query.append(key, v);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

/**
 * The new URL of an old `/products/…` one: the same sub-path (each segment
 * encoded again, since Next hands them over decoded) and the same query,
 * under `storeId`.
 */
export function legacyProductsTarget(
  storeId: string,
  segments: string[] | undefined,
  searchParams?: Record<string, string | string[] | undefined>,
): string {
  const path = (segments ?? [])
    // Empty and dot segments are dropped: a decoded ".." must not climb out of the store's path.
    .filter((s) => s !== "" && s !== "." && s !== "..")
    .map((s) => `/${encodeURIComponent(s)}`)
    .join("");
  return storeProductsHref(storeId, `${path}${searchParamsQuery(searchParams)}`);
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const STORE_PRODUCTS_RE = new RegExp(`^/stores/(${UUID})/products(?=/|$|\\?)`);

/**
 * Rewrites a link that may still use the old prefix (`/products…`) to the
 * store's Products pages; any other link is returned unchanged. For links
 * built far from the store (AI builder issues, notifications, home cards).
 */
export function inStoreProductsHref(href: string, storeId: string | null | undefined): string {
  if (!storeId) return href;
  if (href !== LEGACY_PRODUCTS_PATH && !/^\/products[/?#]/.test(href)) return href;
  return storeProductsHref(storeId, href.slice(LEGACY_PRODUCTS_PATH.length));
}

/** The store id of a `/stores/<id>/products…` path, else null. */
export function storeIdOfProductsPath(pathname: string): string | null {
  return STORE_PRODUCTS_RE.exec(pathname)?.[1] ?? null;
}
