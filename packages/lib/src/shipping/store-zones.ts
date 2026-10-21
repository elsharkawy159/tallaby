/**
 * Store shipping settings and own-delivery zones (PLAN.md §8.7, P3-08).
 * Pure; no DB imports. Money is quoted in integer piastres.
 *
 * NOT YET USED AT CHECKOUT. Charging zone prices on storefront orders and the
 * fulfillment switch for own delivery (D31) are P3-08 Part B, which waits for
 * owner approval together with the store wallet (P6-05). Checkout bills
 * Tallaby's governorate rates for every store, which are also the default
 * seller-delivery rates below (`defaultZoneGroups`, owner 2026-10-21).
 */
import { z } from "zod";
import { TALLABY_SERVICES_ENABLED } from "../fulfillment/constants";
import { CAIRO_ORIGIN_RATES, EXTRA_KG_RATE, FALLBACK_BASE_RATE, FEE_MULTIPLIER, ROUND_TO } from "./shipping-rates";
import { normalizeGovernorate } from "./governorate.lib";

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
    governorates: z
      .array(z.string().refine((g) => ZONE_GOVERNORATES.includes(g), "unknown_governorate"))
      .min(1)
      .max(ZONE_GOVERNORATES.length)
      .refine((list) => new Set(list).size === list.length, "duplicate_governorate"),
    price: money(10_000),
    perKgSurcharge: money(1_000),
    freeOver: money(1_000_000).nullable(),
    deliveryDaysMin: z.number().int().min(0).max(60),
    deliveryDaysMax: z.number().int().min(0).max(60),
    codEnabled: z.boolean(),
    enabled: z.boolean(),
  })
  .strict()
  .refine((z) => z.deliveryDaysMax >= z.deliveryDaysMin, { message: "days_range", path: ["deliveryDaysMax"] });

export type ZoneInput = z.output<typeof zoneInputSchema>;

export const storeShippingSettingsSchema = z
  .object({
    method: z.enum(["tallaby", "own"]),
    /** Preparation time before handing over, in days. */
    handlingDays: z.number().int().min(0).max(30),
    /** Tallaby delivery: seller-funded free delivery at or over this subtotal (EGP). */
    freeShippingOver: money(1_000_000).nullable(),
  })
  .strict();

export type StoreShippingSettings = z.output<typeof storeShippingSettingsSchema>;

/**
 * Seller delivery ("own") is the default (owner, 2026-10-21): Tallaby delivers
 * no orders for now. A store with no saved method, or one saved as "tallaby"
 * before this decision, reads as "own" while TALLABY_SERVICES_ENABLED is off.
 * No migration rewrites the stored value; flipping the flag back restores it.
 */
export function defaultStoreShipping(): StoreShippingSettings {
  return { method: "own", handlingDays: 1, freeShippingOver: null };
}

export function parseStoreShipping(raw: unknown): StoreShippingSettings {
  const parsed = storeShippingSettingsSchema.safeParse(raw);
  if (!parsed.success) return defaultStoreShipping();
  if (parsed.data.method === "tallaby" && !TALLABY_SERVICES_ENABLED) return { ...parsed.data, method: "own" };
  return parsed.data;
}

/** Tallaby's per-kg rate after fees, used as the default extra-kg charge (EGP 7 × 1.14, rounded to whole EGP). */
export const DEFAULT_PER_KG_SURCHARGE = Math.round(EXTRA_KG_RATE * FEE_MULTIPLIER);

/**
 * Tallaby's customer price for the first kg to a governorate (base rate with
 * fees, rounded down to EGP 5) — the same number checkout bills today.
 */
export function defaultRateForGovernorate(governorate: string): number {
  const base = CAIRO_ORIGIN_RATES[governorate] ?? FALLBACK_BASE_RATE;
  return Math.floor((base * FEE_MULTIPLIER) / ROUND_TO) * ROUND_TO;
}

export type DefaultZoneGroup = { price: number; perKgSurcharge: number; governorates: string[] };

/**
 * Tallaby's delivery rates grouped into seller-delivery zones (one per
 * first-kg price, cheapest first). These are the default seller rates: shown
 * when a store has no zones, saved as real zones on request, and what an
 * uncovered governorate costs (checkout bills Tallaby's rate table today).
 */
export function defaultZoneGroups(): DefaultZoneGroup[] {
  const byPrice = new Map<number, string[]>();
  for (const g of ZONE_GOVERNORATES) {
    const price = defaultRateForGovernorate(g);
    byPrice.set(price, [...(byPrice.get(price) ?? []), g]);
  }
  return [...byPrice.entries()]
    .sort(([a], [b]) => a - b)
    .map(([price, governorates]) => ({ price, perKgSurcharge: DEFAULT_PER_KG_SURCHARGE, governorates }));
}

export type ZoneForQuote = {
  id: string;
  governorates: string[];
  price: number;
  perKgSurcharge: number;
  freeOver: number | null;
  enabled: boolean;
};

/** The first governorate that sits in two enabled zones, or null. */
export function findZoneOverlap(zones: Pick<ZoneForQuote, "id" | "governorates" | "enabled">[]) {
  const owner = new Map<string, string>();
  for (const zone of zones) {
    if (!zone.enabled) continue;
    for (const g of zone.governorates) {
      const other = owner.get(g);
      if (other && other !== zone.id) return { governorate: g, zoneIds: [other, zone.id] };
      owner.set(g, zone.id);
    }
  }
  return null;
}

/** The enabled zone covering a (free-text or canonical) governorate. */
export function findZoneForGovernorate<Z extends Pick<ZoneForQuote, "governorates" | "enabled">>(
  zones: Z[],
  governorate: string | null | undefined,
): Z | null {
  const key = normalizeGovernorate(governorate);
  if (!key) return null;
  return zones.find((z) => z.enabled && z.governorates.includes(key)) ?? null;
}

/** Governorates that no enabled zone covers ("we don't deliver here yet"). */
export function uncoveredGovernorates(zones: Pick<ZoneForQuote, "governorates" | "enabled">[]): string[] {
  const covered = new Set(zones.filter((z) => z.enabled).flatMap((z) => z.governorates));
  return ZONE_GOVERNORATES.filter((g) => !covered.has(g));
}

/**
 * Own-delivery price for one order: the zone's flat price for the first kg,
 * plus the per-kg surcharge for each started kg after it; free at or over the
 * zone's threshold. One function for display and charge.
 */
export function quoteZone(
  zone: Pick<ZoneForQuote, "price" | "perKgSurcharge" | "freeOver">,
  order: { subtotal: number; weightGrams: number },
): { amountPiastres: number; free: boolean } {
  if (zone.freeOver !== null && toPiastres(order.subtotal) >= toPiastres(zone.freeOver)) {
    return { amountPiastres: 0, free: true };
  }
  const extraKg = Math.max(0, Math.ceil(order.weightGrams / 1000) - 1);
  return { amountPiastres: toPiastres(zone.price) + extraKg * toPiastres(zone.perKgSurcharge), free: false };
}
