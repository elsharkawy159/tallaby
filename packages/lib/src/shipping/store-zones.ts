/**
 * Store shipping settings and own-delivery zones (PLAN.md §8.7, P3-08).
 * Pure; no DB imports. Money is quoted in integer piastres.
 *
 * NOT YET USED AT CHECKOUT. Charging zone prices on storefront orders and the
 * fulfillment switch for own delivery (D31) are P3-08 Part B, which waits for
 * owner approval together with the store wallet (P6-05).
 */
import { z } from "zod";
import { CAIRO_ORIGIN_RATES } from "./shipping-rates";
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

export function defaultStoreShipping(): StoreShippingSettings {
  return { method: "tallaby", handlingDays: 1, freeShippingOver: null };
}

export function parseStoreShipping(raw: unknown): StoreShippingSettings {
  const parsed = storeShippingSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaultStoreShipping();
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
