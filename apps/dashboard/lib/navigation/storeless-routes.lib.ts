/**
 * Store-less dashboard links (e.g. `dashboard.tallaby.com/settings/payments`):
 * a link the owner can send every seller, which opens that page for the
 * seller's own store, `/stores/<their store id>/settings/payments`. The store
 * is the sidebar's selected one (`getSellerStores().selected`): navigation
 * only, never a write target (CLAUDE.md rule 5). Pure, so both directions are
 * unit-tested; the redirect pages live in `app/[locale]/(main)`.
 *
 * Store-less forms (each maps to `/stores/<id>/…`):
 * - `/<section>/…` for the store sections with no account page of their own
 *   (`TOP_LEVEL_STORE_SECTIONS`);
 * - `/settings/<store settings page>/…` (`STORE_SETTINGS_PAGES`); the account
 *   pages `plan` and `fulfillment` are not store links, and `/settings` itself
 *   has its own redirect page (to the store's General settings);
 * - `/stores/<section>/…` for every store section (`STORE_SECTIONS`), the only
 *   form for sections whose top-level path is an account page (`/shipping`,
 *   `/settings`).
 * `/products/…` and `/welcome` have their own redirect pages.
 */

import { isUuid } from "@/lib/auth/access.lib";
import { searchParamsQuery } from "@/lib/products/product-routes.lib";

/** Every folder under `app/[locale]/(main)/stores/[storeId]` (guarded by a test). */
export const STORE_SECTIONS = [
  "analytics",
  "apps",
  "catalog",
  "earnings",
  "products",
  "settings",
  "shipping",
  "website",
  "welcome",
] as const;

/** Store sections reachable as `/<section>/…`: no account route uses these names. */
export const TOP_LEVEL_STORE_SECTIONS = ["analytics", "apps", "catalog", "earnings", "website"] as const;

/** The store settings sub-pages (`stores/[storeId]/settings/<page>`, guarded by a test). */
export const STORE_SETTINGS_PAGES = [
  "app",
  "checkout",
  "contact",
  "notifications",
  "payments",
  "policies",
  "protection",
  "sales-popup",
  "trash",
] as const;

const LOCALE_PREFIX_RE = /^\/(?:ar|en)(?=\/|$)/;

type Query = Record<string, string | string[] | undefined> | undefined;

function includes(list: readonly string[], value: string | undefined): value is string {
  return value !== undefined && list.includes(value);
}

/**
 * The store-relative segments (`["settings", "payments"]`) of a store-less
 * path (Next's decoded segments, no locale), or null when it is not one.
 * Empty and dot segments are refused, so nothing can climb out of the store.
 */
function storeRelativeSegments(pathSegments: readonly string[]): string[] | null {
  const [first, ...rest] = pathSegments;
  let segments: string[];
  if (first === "stores") {
    if (!includes(STORE_SECTIONS, rest[0])) return null;
    segments = rest;
  } else if (first === "settings") {
    if (!includes(STORE_SETTINGS_PAGES, rest[0])) return null;
    segments = pathSegments.slice();
  } else if (includes(TOP_LEVEL_STORE_SECTIONS, first)) {
    segments = pathSegments.slice();
  } else {
    return null;
  }
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  return segments;
}

/** Whether a store-less path (decoded segments, no locale) is a store link. No store needed. */
export function isStorelessStorePath(pathSegments: readonly string[]): boolean {
  return storeRelativeSegments(pathSegments) !== null;
}

/**
 * The store-scoped href of a store-less path under `storeId`, keeping the
 * query string (repeated keys too), or null when the path is not a
 * store-less store link (the caller 404s). Always starts with `/stores/`.
 */
export function storelessTarget(pathSegments: readonly string[], storeId: string, query?: Query): string | null {
  if (!storeId) return null;
  const segments = storeRelativeSegments(pathSegments);
  if (!segments) return null;
  const path = segments.map((s) => `/${encodeURIComponent(s)}`).join("");
  return `/stores/${encodeURIComponent(storeId)}${path}${searchParamsQuery(query)}`;
}

/**
 * The store-less form of a dashboard path, for a "copy link" anyone can open
 * for their own store, in their own language: a locale prefix is always
 * dropped (account paths too, `/en/orders` → `/orders`), and
 * `/stores/<uuid>/<rest>` becomes the path that reaches the same page
 * (`storelessTarget`, or the `/products` and `/welcome` redirect pages).
 * `/stores/<uuid>` alone becomes My stores. Any other path (account pages,
 * a store route with no store-less form such as the builder's `editor`) is
 * returned as is, minus the locale prefix. A query string or hash is kept.
 */
export function toStorelessPath(pathname: string): string {
  const cut = pathname.search(/[?#]/);
  const path = cut === -1 ? pathname : pathname.slice(0, cut);
  const suffix = cut === -1 ? "" : pathname.slice(cut);

  const bare = path.replace(LOCALE_PREFIX_RE, "") || (path ? "/" : "");
  const unchanged = `${bare}${suffix}`;

  const match = /^\/stores\/([^/]+)((?:\/[^/]*)*)$/.exec(bare);
  if (!match || !isUuid(match[1]!)) return unchanged;

  const segments = (match[2] ?? "").split("/").filter(Boolean);
  const [section, ...more] = segments;
  if (section === undefined) return `/stores${suffix}`;
  if (!includes(STORE_SECTIONS, section)) return unchanged;

  const joined = `/${segments.join("/")}`;
  if (includes(TOP_LEVEL_STORE_SECTIONS, section) || section === "products") return `${joined}${suffix}`;
  if (section === "welcome" && more.length === 0) return `/welcome${suffix}`;
  if (section === "settings" && includes(STORE_SETTINGS_PAGES, more[0])) return `${joined}${suffix}`;
  // `/stores/<id>/shipping`, `/stores/<id>/settings` (and anything else in a store section).
  return `/stores${joined}${suffix}`;
}
