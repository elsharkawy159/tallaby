import { z } from "zod";

/**
 * How a store delivers its orders (owner, 2026-11-27): the seller ships them
 * ("self": they or their own riders) or hands them to a shipping company
 * ("company": Bosta, Egypt Post through Wassalha). Stored as the top-level
 * `stores.settings.shippingMode`, NOT inside `settings.shipping`, whose schema
 * is strict and read by checkout. Switching deletes nothing: zones, riders and
 * carrier integrations stay. Client-safe.
 */
export const SHIPPING_MODES = ["self", "company"] as const;

export type ShippingMode = (typeof SHIPPING_MODES)[number];

export const shippingModeSchema = z.enum(SHIPPING_MODES);

/** The mode saved in a store's settings, or null when none was chosen yet. */
export function parseShippingMode(settings: unknown): ShippingMode | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const parsed = shippingModeSchema.safeParse((settings as Record<string, unknown>).shippingMode);
  return parsed.success ? parsed.data : null;
}

/**
 * The saved mode, or one inferred for stores from before the choice existed:
 * a connected carrier (Bosta or Wassalha) reads as "company", shipping zones as
 * "self", and a store with neither has not chosen yet (null).
 */
export function resolveShippingMode(
  stored: ShippingMode | null,
  { hasCarrier, hasZones }: { hasCarrier: boolean; hasZones: boolean },
): ShippingMode | null {
  return stored ?? (hasCarrier ? "company" : hasZones ? "self" : null);
}
