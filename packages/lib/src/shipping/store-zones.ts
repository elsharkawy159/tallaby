/**
 * Store shipping settings and own-delivery zones (PLAN.md §8.7, P3-08).
 * Pure; no DB imports. Money is quoted in integer piastres.
 *
 * Zones cover places (`EG`, `EG/CAIRO`, `EG/CAIRO/nasr-city`, see
 * `@workspace/lib/places`). Storefront checkout charges the most specific
 * enabled zone covering the address (`store-quote.ts`). Tallaby's governorate
 * rates are the default zone groups (`defaultZoneGroups`, owner 2026-10-21)
 * and the fallback for places no zone covers when `otherPlaces` is
 * `tallaby_rates`.
 */
import { z } from "zod";
import { TALLABY_SERVICES_ENABLED } from "../fulfillment/constants";
import { EGYPT, getPlace, placeChain } from "../places";
import { CAIRO_ORIGIN_RATES, FALLBACK_BASE_RATE, FEE_MULTIPLIER, ROUND_TO } from "./shipping-rates";

export const ZONE_GOVERNORATES = Object.keys(CAIRO_ORIGIN_RATES);
export const MAX_ZONES_PER_STORE = 30;

const toPiastres = (egp: number) => Math.round(egp * 100);
const money = (max: number) =>
  z
    .number()
    .min(0)
    .max(max)
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "money_precision");

export const zoneInputSchema = z
  .object({
    nameAr: z.string().trim().min(1).max(60),
    nameEn: z.string().trim().max(60).optional(),
    places: z
      .array(z.string().refine((k) => getPlace(k) !== undefined, "unknown_place"))
      .min(1)
      .max(200)
      .refine((list) => new Set(list).size === list.length, "duplicate_place"),
    price: money(10_000),
    freeOver: money(1_000_000).nullable(),
    deliveryDaysMin: z.number().int().min(0).max(60),
    deliveryDaysMax: z.number().int().min(0).max(60),
    codEnabled: z.boolean(),
    enabled: z.boolean(),
  })
  .strict()
  .refine((z) => z.deliveryDaysMax >= z.deliveryDaysMin, { message: "days_range", path: ["deliveryDaysMax"] });

export type ZoneInput = z.output<typeof zoneInputSchema>;

const settingsShape = {
  method: z.enum(["tallaby", "own"]),
  /** Preparation time before handing over, in days. */
  handlingDays: z.number().int().min(0).max(30),
  /** Tallaby delivery: seller-funded free delivery at or over this subtotal (EGP). */
  freeShippingOver: money(1_000_000).nullable(),
};

export const storeShippingSettingsSchema = z
  .object({
    ...settingsShape,
    /** What an Egyptian place no zone covers does: bill Tallaby's rates, or refuse the order. */
    otherPlaces: z.enum(["tallaby_rates", "refuse"]),
  })
  .strict();

export type StoreShippingSettings = z.output<typeof storeShippingSettingsSchema>;

/** Stored settings from before `otherPlaces` existed lack the key. */
const storedSettingsSchema = z
  .object({ ...settingsShape, otherPlaces: z.enum(["tallaby_rates", "refuse"]).optional() })
  .strict();

/**
 * Seller delivery ("own") is the default (owner, 2026-10-21): Tallaby delivers
 * no orders for now. A store with no saved method, or one saved as "tallaby"
 * before this decision, reads as "own" while TALLABY_SERVICES_ENABLED is off.
 * No migration rewrites the stored value; flipping the flag back restores it.
 */
export function defaultStoreShipping(): StoreShippingSettings {
  return { method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" };
}

export function parseStoreShipping(raw: unknown): StoreShippingSettings {
  const parsed = storedSettingsSchema.safeParse(raw);
  if (!parsed.success) return defaultStoreShipping();
  const settings: StoreShippingSettings = { ...parsed.data, otherPlaces: parsed.data.otherPlaces ?? "tallaby_rates" };
  if (settings.method === "tallaby" && !TALLABY_SERVICES_ENABLED) return { ...settings, method: "own" };
  return settings;
}

/**
 * Tallaby's customer price for the first kg to a governorate (base rate with
 * fees, rounded down to EGP 5) — the same number checkout bills today.
 */
export function defaultRateForGovernorate(governorate: string): number {
  const base = CAIRO_ORIGIN_RATES[governorate] ?? FALLBACK_BASE_RATE;
  return Math.floor((base * FEE_MULTIPLIER) / ROUND_TO) * ROUND_TO;
}

export type DefaultZoneGroup = { price: number; places: string[] };

/**
 * Tallaby's delivery rates grouped into seller-delivery zones (one per
 * first-kg price, cheapest first). These are the default seller rates: shown
 * when a store has no zones and saved as real zones on request.
 */
export function defaultZoneGroups(): DefaultZoneGroup[] {
  const byPrice = new Map<number, string[]>();
  for (const g of ZONE_GOVERNORATES) {
    const price = defaultRateForGovernorate(g);
    byPrice.set(price, [...(byPrice.get(price) ?? []), `EG/${g}`]);
  }
  return [...byPrice.entries()].sort(([a], [b]) => a - b).map(([price, places]) => ({ price, places }));
}

export const SHIPPING_TEMPLATES = ["tallaby_rates", "egypt_flat", "cairo_giza"] as const;
export type ShippingTemplate = (typeof SHIPPING_TEMPLATES)[number];

/** Zone groups (price + places) a seller can start from. Names and days are added by the caller. */
export function templateZones(template: ShippingTemplate, opts: { price?: number }): DefaultZoneGroup[] {
  switch (template) {
    case "tallaby_rates":
      return defaultZoneGroups();
    case "egypt_flat": {
      const price = opts.price;
      if (price === undefined || !Number.isFinite(price) || price < 0 || price > 10_000) return [];
      return [{ price, places: [EGYPT] }];
    }
    case "cairo_giza":
      return [{ price: defaultRateForGovernorate("CAIRO"), places: ["EG/CAIRO", "EG/GIZA"] }];
  }
}

export type ZoneForQuote = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  places: string[];
  price: number;
  freeOver: number | null;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  codEnabled: boolean;
  enabled: boolean;
};

/** The first place key that sits in two enabled zones, or null. A place and its child may sit in different zones. */
export function findZoneOverlap(
  zones: Pick<ZoneForQuote, "id" | "places" | "enabled">[],
): { place: string; zoneIds: [string, string] } | null {
  const owner = new Map<string, string>();
  for (const zone of zones) {
    if (!zone.enabled) continue;
    for (const p of zone.places) {
      const other = owner.get(p);
      if (other && other !== zone.id) return { place: p, zoneIds: [other, zone.id] };
      owner.set(p, zone.id);
    }
  }
  return null;
}

/** The enabled zone covering a place: the most specific match along its chain (city, then region, then country). */
export function findZoneForPlace<Z extends Pick<ZoneForQuote, "places" | "enabled">>(
  zones: Z[],
  place: string | null,
): { zone: Z; matched: string } | null {
  if (!place) return null;
  for (const key of placeChain(place)) {
    const zone = zones.find((z) => z.enabled && z.places.includes(key));
    if (zone) return { zone, matched: key };
  }
  return null;
}

/** Governorates that no enabled zone covers (`EG` or `EG/<g>`): "we don't deliver here yet". */
export function uncoveredGovernorates(zones: Pick<ZoneForQuote, "places" | "enabled">[]): string[] {
  const covered = new Set(zones.filter((z) => z.enabled).flatMap((z) => z.places));
  if (covered.has(EGYPT)) return [];
  return ZONE_GOVERNORATES.filter((g) => !covered.has(`${EGYPT}/${g}`));
}

/** Own-delivery price for one order: the zone's flat price, free at or over its threshold. */
export function quoteZone(
  zone: Pick<ZoneForQuote, "price" | "freeOver">,
  subtotal: number,
): { amountPiastres: number; free: boolean } {
  if (zone.freeOver !== null && toPiastres(subtotal) >= toPiastres(zone.freeOver)) {
    return { amountPiastres: 0, free: true };
  }
  return { amountPiastres: toPiastres(zone.price), free: false };
}
