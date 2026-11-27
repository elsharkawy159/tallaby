/**
 * Top loader app (owner request, 2026-11-27): the thin progress bar at the top
 * of the store website while the next page loads (nextjs-toploader in the
 * ecommerce `(shop)` layout). Pure, safe on the client.
 *
 * On for every store by default: a missing key, or anything but
 * `enabled: false`, keeps it on. `color` is null for the store's brand colour
 * (`--sf-brand`), or a `#rrggbb` the seller picked. Settings live in
 * `stores.settings.topLoader` (other keys kept); no migration.
 */

export type StoreTopLoaderSettings = {
  enabled: boolean;
  /** Null: the store's brand colour. Otherwise a lowercase `#rrggbb`. */
  color: string | null;
};

export const TOP_LOADER_DEFAULTS: Readonly<StoreTopLoaderSettings> = { enabled: true, color: null };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** A `#rrggbb` colour in lowercase, or null for anything else. */
export function cleanTopLoaderColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const color = value.trim();
  return HEX_RE.test(color) ? color.toLowerCase() : null;
}

/** The store's top loader settings from `stores.settings`, every field re-validated. */
export function parseStoreTopLoader(settings: unknown): StoreTopLoaderSettings {
  const raw = (settings as { topLoader?: unknown } | null | undefined)?.topLoader;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...TOP_LOADER_DEFAULTS };
  const value = raw as { enabled?: unknown; color?: unknown };
  return { enabled: value.enabled !== false, color: cleanTopLoaderColor(value.color) };
}

/** A save from the dashboard, cleaned the same way (never trusted as sent). */
export function normalizeTopLoaderInput(input: unknown): StoreTopLoaderSettings {
  return parseStoreTopLoader({ topLoader: input });
}

/**
 * The storefront CSS for these settings, or null when nothing changes (on,
 * brand colour). `color` is regex-checked above, so it is safe in CSS.
 */
export function topLoaderCss(settings: StoreTopLoaderSettings): string | null {
  if (!settings.enabled) return "#nprogress { display: none !important; }";
  const color = cleanTopLoaderColor(settings.color);
  return color ? `body { --sf-loader: ${color}; }` : null;
}
