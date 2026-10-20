/**
 * Admin SaaS alignment (docs/admin-saas.md, Phase 9B). Pure: input schemas,
 * list filters and labels for the admin views of seller-built data
 * (coupons, stores, integrations, domains, ads, templates, audit).
 * Server functions live in the matching `*-admin.server.ts` files.
 *
 * Every write carries a required `reason`, which goes to admin_audit_log.
 */
import { z } from "zod";
import { ADMIN_MONEY_MAX_PIASTRES, ADMIN_REASON_MAX, ADMIN_REASON_MIN, decimalToPiastres, piastresToDecimal } from "./admin.lib";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

const uuid = z.string().regex(UUID_RE, "Invalid id");
const reason = z
  .string()
  .trim()
  .min(ADMIN_REASON_MIN, `Reason must be at least ${ADMIN_REASON_MIN} characters`)
  .max(ADMIN_REASON_MAX, `Reason must be at most ${ADMIN_REASON_MAX} characters`);

export const ADMIN_LIST_PAGE_SIZE = 25;

/** Shared list params: search, page and one or two enum filters, all from the URL. */
export interface AdminListParams {
  q: string | null;
  page: number;
}

export function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value)?.trim() || null;
}

export function parseAdminListParams(params: Record<string, string | string[] | undefined>): AdminListParams {
  const q = firstParam(params.q);
  const page = Number.parseInt(firstParam(params.page) ?? "1", 10);
  return { q: q ? q.slice(0, 100) : null, page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1 };
}

/** Picks a value from an allow-list, or null. */
export function pickEnum<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | null {
  const raw = firstParam(value);
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

/** `%term%` for ILIKE with the wildcards escaped. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function pageCount(total: number, pageSize = ADMIN_LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// ---------------------------------------------------------------------------
// Coupons (§3.2)
// ---------------------------------------------------------------------------

export const COUPON_STATES = ["active", "scheduled", "expired", "inactive"] as const;
export type AdminCouponState = (typeof COUPON_STATES)[number];

/** Admin can only switch a seller's coupon off or back on (D-A1), never edit it. */
export const sellerCouponToggleSchema = z.strictObject({
  couponId: uuid,
  active: z.boolean(),
  reason,
});
export type SellerCouponToggleInput = z.input<typeof sellerCouponToggleSchema>;

// ---------------------------------------------------------------------------
// Stores (§3.3)
// ---------------------------------------------------------------------------

export const STORE_STATUSES = ["active", "archived", "suspended"] as const;
export const SITE_STATUSES = ["draft", "published", "unpublished"] as const;
export const STORE_DETAIL_TABS = ["overview", "website", "catalog", "commerce", "integrations", "forms", "content", "media", "audit"] as const;
export type StoreDetailTab = (typeof STORE_DETAIL_TABS)[number];

export const cmsUnpublishSchema = z.strictObject({
  sellerId: uuid,
  storeId: uuid,
  itemId: uuid,
  reason,
});

// ---------------------------------------------------------------------------
// Integrations (§3.5)
// ---------------------------------------------------------------------------

export const INTEGRATION_STATUSES = ["connected", "error", "disconnected"] as const;
export type AdminIntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const integrationAdminActionSchema = z.strictObject({
  action: z.enum(["disconnect_integration", "clear_integration_error"]),
  integrationId: uuid,
  reason,
});
export type IntegrationAdminActionInput = z.input<typeof integrationAdminActionSchema>;

/**
 * Config keys that are safe to show an admin: public tracking ids. Anything
 * else in `config` (tokens, sheet ids, shop domains with keys) stays hidden,
 * and `credentials_encrypted` is never selected.
 */
export const PUBLIC_INTEGRATION_CONFIG_KEYS = [
  "pixelId",
  "measurementId",
  "containerId",
  "shopDomain",
  "spreadsheetTitle",
  "exportedOrders",
  "importedProducts",
] as const;

export function publicIntegrationConfig(config: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config || typeof config !== "object") return out;
  for (const key of PUBLIC_INTEGRATION_CONFIG_KEYS) {
    const value = (config as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0 && value.length <= 200) out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = String(value);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Domains (§3.7)
// ---------------------------------------------------------------------------

export const DOMAIN_STATUSES = ["pending", "active", "failed"] as const;

export const domainAdminActionSchema = z.strictObject({
  action: z.enum(["recheck", "remove_domain"]),
  domainId: uuid,
  /** Required for remove; ignored for a re-check (which changes no setting). */
  reason: z.string().trim().max(ADMIN_REASON_MAX).optional(),
}).refine((value) => value.action !== "remove_domain" || (value.reason?.length ?? 0) >= ADMIN_REASON_MIN, {
  message: `Reason must be at least ${ADMIN_REASON_MIN} characters`,
  path: ["reason"],
});

// ---------------------------------------------------------------------------
// Ad campaigns (§3.8)
// ---------------------------------------------------------------------------

export const AD_REQUEST_STATUSES = ["pending", "approved", "active", "completed", "rejected"] as const;
export type AdRequestStatus = (typeof AD_REQUEST_STATUSES)[number];

/** Allowed moves. Rejection is only possible before the campaign runs. */
export const AD_STATUS_TRANSITIONS: Record<AdRequestStatus, readonly AdRequestStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["active", "rejected"],
  active: ["completed"],
  completed: [],
  rejected: [],
};

export function canMoveAdRequest(from: AdRequestStatus, to: AdRequestStatus): boolean {
  return AD_STATUS_TRANSITIONS[from].includes(to);
}

export const adStatusSchema = z.strictObject({
  requestId: uuid,
  status: z.enum(AD_REQUEST_STATUSES),
  reason,
});

// ---------------------------------------------------------------------------
// Templates (§3.6)
// ---------------------------------------------------------------------------

/** A non-negative EGP price, normalised to 2 dp, or null for free. */
const templatePrice = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const piastres = decimalToPiastres(value);
    if (piastres === null || piastres < 0 || piastres > ADMIN_MONEY_MAX_PIASTRES) {
      ctx.addIssue({ code: "custom", message: "Enter a price between 0 and 100,000" });
      return z.NEVER;
    }
    return piastresToDecimal(piastres);
  });

export const templateUpdateSchema = z.strictObject({
  templateId: uuid,
  isActive: z.boolean(),
  isPremium: z.boolean(),
  price: templatePrice.nullable(),
  sortOrder: z.number().int().min(0).max(10_000),
  reason,
}).refine((value) => !value.isPremium || value.price !== null, {
  message: "A premium template needs a price",
  path: ["price"],
});

export const templateDefaultSchema = z.strictObject({ templateId: uuid, reason });

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type SaasAdminError = "not_admin" | "invalid_input" | "not_found" | "no_change";

export const SAAS_ADMIN_ERROR_MESSAGES: Record<string, string> = {
  not_admin: "Only an active admin can do this.",
  invalid_input: "Check the form and try again.",
  not_found: "It no longer exists. Refresh the page.",
  no_change: "Nothing to change.",
  invalid_transition: "That status change is not allowed.",
  premium_without_price: "A premium template needs a price.",
  default_inactive: "Activate the template before making it the default.",
  migration_required: "Apply migration 0069 first (platform audit rows).",
  refund_failed: "The wallet refund failed, so nothing was changed.",
};
