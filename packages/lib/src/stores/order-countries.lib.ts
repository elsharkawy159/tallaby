/**
 * "Orders from my country only" (ROADMAP.md F-115, app A5; owner 2026-11-27).
 * A store website can refuse orders placed from outside the countries it
 * ships to. Saved in `stores.settings.orderCountries` (no migration); off by
 * default. The visitor's country comes from the request (`getClientCountry`):
 * when it is unknown the order is allowed, so a missing header never blocks a
 * real customer. Pure functions only.
 */

export type StoreOrderCountries = { enabled: boolean };

export const ORDER_COUNTRIES_DEFAULTS: StoreOrderCountries = Object.freeze({ enabled: false });

/** Stores with no delivery zones of their own (Tallaby delivery, Bosta) ship in Egypt. */
export const DEFAULT_SELLING_COUNTRY = "EG";

const ISO = /^[A-Z]{2}$/;

export function parseStoreOrderCountries(settings: unknown): StoreOrderCountries {
  const raw = settings && typeof settings === "object" ? (settings as Record<string, unknown>).orderCountries : null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...ORDER_COUNTRIES_DEFAULTS };
  return { enabled: (raw as Record<string, unknown>).enabled === true };
}

/**
 * The countries a store sells to: the first segment of each enabled zone's
 * place keys (`EG/CAIRO/nasr-city` → `EG`), or Egypt when it has none.
 * Sorted, so the dashboard and tests see a stable list.
 */
export function storeSellingCountries(zones: readonly { places: readonly string[] | null; enabled?: boolean | null }[]): string[] {
  const countries = new Set<string>();
  for (const zone of zones) {
    if (zone.enabled === false) continue;
    for (const place of zone.places ?? []) {
      const country = place.split("/")[0]?.trim().toUpperCase() ?? "";
      if (ISO.test(country)) countries.add(country);
    }
  }
  if (countries.size === 0) countries.add(DEFAULT_SELLING_COUNTRY);
  return [...countries].sort();
}

export type OrderCountryCheck = { ok: true } | { ok: false; visitorCountry: string };

/** Refuses only when the setting is on and the visitor's country is known and outside the list. */
export function checkOrderCountry(
  setting: StoreOrderCountries,
  visitorCountry: string | null | undefined,
  sellingCountries: readonly string[],
): OrderCountryCheck {
  if (!setting.enabled) return { ok: true };
  const country = (visitorCountry ?? "").trim().toUpperCase();
  if (!ISO.test(country)) return { ok: true };
  return sellingCountries.includes(country) ? { ok: true } : { ok: false, visitorCountry: country };
}
