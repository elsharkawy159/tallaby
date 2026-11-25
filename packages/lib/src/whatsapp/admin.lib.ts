/**
 * Admin › WhatsApp (ROADMAP.md F-109, docs/whatsapp.md §6): the settings
 * rules and the usage money math. Pure, safe on the client (the settings form
 * shows the same limits).
 *
 * Money: the seller price is integer US cents and must stay 0 until the owner
 * approves charging (D3); Meta's cost is integer micro-USD. Profit is computed
 * in micro-USD integers and only turned into dollars for display.
 */
import { z } from "zod";
import { WHATSAPP_EVENTS, type WhatsAppEvent } from "./events.lib";

export { WHATSAPP_EVENTS };

/** Meta's pricing categories, the keys of `whatsapp_settings.meta_rate_micros`. */
export const WHATSAPP_RATE_CATEGORIES = ["utility", "authentication", "marketing", "service"] as const;
export type WhatsAppRateCategory = (typeof WHATSAPP_RATE_CATEGORIES)[number];

/** Highest Meta rate an admin can enter: $1 per message. */
export const META_RATE_MAX_MICROS = 1_000_000;
/** Highest seller price the form accepts at all ($1); anything above 0 is refused until approved. */
export const SELLER_PRICE_MAX_CENTS = 100;
export const MICROS_PER_CENT = 10_000;
export const MICROS_PER_USD = 1_000_000;

export const WHATSAPP_USAGE_DAYS = [7, 30, 90] as const;
export type WhatsAppUsageDays = (typeof WHATSAPP_USAGE_DAYS)[number];

export const WHATSAPP_FAILED_PAGE_SIZE = 50;
/** Most messages one retry may re-queue. */
export const WHATSAPP_RETRY_MAX = 100;

export type WhatsAppAdminSettings = {
  enabled: boolean;
  storesDefaultOn: boolean;
  sellerPriceUsdCents: number;
  metaRateMicros: Record<WhatsAppRateCategory, number>;
  eventsEnabled: WhatsAppEvent[];
};

export const DEFAULT_META_RATE_MICROS: Readonly<Record<WhatsAppRateCategory, number>> = {
  utility: 3600,
  authentication: 3600,
  marketing: 64400,
  service: 3600,
};

const rate = z.number().int().min(0).max(META_RATE_MAX_MICROS);

export const whatsAppAdminSettingsSchema = z
  .object({
    enabled: z.boolean(),
    storesDefaultOn: z.boolean(),
    sellerPriceUsdCents: z.number().int().min(0).max(SELLER_PRICE_MAX_CENTS),
    metaRateMicros: z.object({ utility: rate, authentication: rate, marketing: rate, service: rate }).strict(),
    eventsEnabled: z.array(z.enum(WHATSAPP_EVENTS)).max(WHATSAPP_EVENTS.length),
  })
  .strict();

export type WhatsAppSettingsError = "invalid_input" | "price_needs_approval";

export const WHATSAPP_SETTINGS_ERROR_MESSAGES: Readonly<
  Record<WhatsAppSettingsError | "backend_not_configured" | "not_admin" | "no_change", string>
> = {
  invalid_input: "Check the settings: Meta rates are whole micro-USD from 0 to 1,000,000.",
  price_needs_approval: "Charging sellers needs owner approval. The seller price must stay 0 (free).",
  backend_not_configured:
    "WhatsApp can't be turned on: the backend doesn't report every WhatsApp env value as set. Check the Connection tab.",
  not_admin: "You don't have permission to change WhatsApp settings.",
  no_change: "Nothing to save: these are the current settings.",
};

/**
 * Validates an admin settings form. A seller price above 0 is refused with its
 * own error (D3: charging needs the owner's approval). Events are de-duplicated
 * and kept in WHATSAPP_EVENTS order.
 */
export function parseWhatsAppAdminSettings(
  input: unknown,
): { success: true; data: WhatsAppAdminSettings } | { success: false; error: WhatsAppSettingsError } {
  const parsed = whatsAppAdminSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  if (parsed.data.sellerPriceUsdCents !== 0) return { success: false, error: "price_needs_approval" };
  const chosen = new Set(parsed.data.eventsEnabled);
  return {
    success: true,
    data: { ...parsed.data, eventsEnabled: WHATSAPP_EVENTS.filter((event) => chosen.has(event)) },
  };
}

/** The backend env flags `GET /api/whatsapp/connection` reports (booleans only, never values). */
export const WHATSAPP_BACKEND_ENV_KEYS = ["token", "phoneNumberId", "wabaId", "appSecret", "verifyToken", "payloadSecret"] as const;

/** Whether every WhatsApp env value is set in the backend: required before the global switch can go on. */
export function isBackendFullyConfigured(configured: Partial<Record<(typeof WHATSAPP_BACKEND_ENV_KEYS)[number], boolean>> | null | undefined): boolean {
  return !!configured && WHATSAPP_BACKEND_ENV_KEYS.every((key) => configured[key] === true);
}

/** A stored `meta_rate_micros` value read defensively: unknown or bad keys fall back to the defaults. */
export function normalizeMetaRates(value: unknown): Record<WhatsAppRateCategory, number> {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out = { ...DEFAULT_META_RATE_MICROS };
  for (const key of WHATSAPP_RATE_CATEGORIES) {
    const v = source[key];
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= META_RATE_MAX_MICROS) out[key] = v;
  }
  return out;
}

export function parseUsageDays(value: unknown): WhatsAppUsageDays {
  const n = typeof value === "string" ? Number(value) : value;
  return (WHATSAPP_USAGE_DAYS as readonly unknown[]).includes(n) ? (n as WhatsAppUsageDays) : 7;
}

// ── Usage money ──────────────────────────────────────────────────────────

/** Revenue (seller charges, cents) minus Meta's cost (micro-USD), in micro-USD. Integers only. */
export function profitMicros(revenueCents: number, costMicros: number): number {
  return Math.trunc(revenueCents) * MICROS_PER_CENT - Math.trunc(costMicros);
}

/** Micro-USD as dollars for display: 3600 → "$0.0036", -1_250_000 → "-$1.25". Up to 4 decimals. */
export function formatMicrosUsd(micros: number): string {
  const sign = micros < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(micros));
  const whole = Math.floor(abs / MICROS_PER_USD);
  // Round the fraction to 4 decimals (100 micros) without floating point.
  let frac = Math.round((abs % MICROS_PER_USD) / 100);
  let dollars = whole;
  if (frac === 10_000) {
    dollars += 1;
    frac = 0;
  }
  let fraction = String(frac).padStart(4, "0").replace(/0+$/, "");
  if (fraction.length < 2) fraction = fraction.padEnd(2, "0");
  return `${sign}$${dollars.toLocaleString("en-US")}.${fraction}`;
}

/** US cents as dollars for display: 0 → "$0.00". */
export function formatCentsUsd(cents: number): string {
  return formatMicrosUsd(Math.trunc(cents) * MICROS_PER_CENT);
}

/** Delivered (or read) share of the messages that left Tallaby, one decimal; null with none. */
export function deliveredPercent(delivered: number, attempted: number): number | null {
  if (attempted <= 0) return null;
  return Math.round((delivered / attempted) * 1000) / 10;
}

export type WhatsAppUsageCounts = {
  messages: number;
  /** Left Tallaby: sent, delivered, read, failed or unknown. */
  attempted: number;
  delivered: number;
  read: number;
  failed: number;
  costMicros: number;
  revenueCents: number;
  confirms: number;
  cancels: number;
};

export const EMPTY_USAGE_COUNTS: Readonly<WhatsAppUsageCounts> = {
  messages: 0,
  attempted: 0,
  delivered: 0,
  read: 0,
  failed: 0,
  costMicros: 0,
  revenueCents: 0,
  confirms: 0,
  cancels: 0,
};

/** Adds usage rows up (the totals cards). */
export function sumUsage(rows: readonly WhatsAppUsageCounts[]): WhatsAppUsageCounts {
  const total = { ...EMPTY_USAGE_COUNTS };
  for (const row of rows) {
    for (const key of Object.keys(total) as (keyof WhatsAppUsageCounts)[]) total[key] += row[key];
  }
  return total;
}

// ── Retry ────────────────────────────────────────────────────────────────

export const WHATSAPP_RETRYABLE_STATUSES = ["failed", "unknown"] as const;

export type WhatsAppRetryError = "invalid_input" | "not_found" | "not_retryable" | "unknown_needs_confirm";

export const WHATSAPP_RETRY_ERROR_MESSAGES: Readonly<Record<WhatsAppRetryError | "not_admin", string>> = {
  invalid_input: "Pick between 1 and 100 messages.",
  not_found: "Some of these messages no longer exist. Reload the page.",
  not_retryable: "Only failed or unknown messages can be retried. Reload the page.",
  unknown_needs_confirm: "Some messages have an unknown result and may have been delivered. Confirm to retry them.",
  not_admin: "You don't have permission to retry WhatsApp messages.",
};

/**
 * Whether these rows may be re-queued: every row must be failed or unknown,
 * and an unknown row (the request may have reached Meta) needs an explicit
 * confirmation, since retrying it can send a duplicate.
 */
export function checkRetryable(
  statuses: readonly string[],
  confirmUnknown: boolean,
): { ok: true } | { ok: false; error: "not_retryable" | "unknown_needs_confirm" } {
  if (statuses.some((s) => s !== "failed" && s !== "unknown")) return { ok: false, error: "not_retryable" };
  if (!confirmUnknown && statuses.includes("unknown")) return { ok: false, error: "unknown_needs_confirm" };
  return { ok: true };
}
