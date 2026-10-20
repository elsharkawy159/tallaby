/**
 * Admin overrides on seller accounts and stores (PLAN.md P9-01, P9-02).
 * Pure: input schemas, limits and money parsing. The server functions that
 * apply them (with the admin check and the audit row) are in `./server`.
 *
 * Every input carries a required `reason`, which goes to admin_audit_log.
 */
import { z } from "zod";
import { FEE_PLANS, type FeePlanId } from "../orders/platform-fee.lib";
import { PLANS, type PlanId } from "../plans";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Roles allowed to make audited admin changes (users.role). */
export const ADMIN_WRITE_ROLES = ["admin", "super_admin"] as const;

export function isAdminWriteRole(role: string | null | undefined): role is string {
  return (ADMIN_WRITE_ROLES as readonly string[]).includes(role ?? "");
}

export const ADMIN_AUDIT_ACTIONS = [
  "set_plan",
  "set_store_limit",
  "set_fee_plan",
  "extend_trial",
  "grant_trial",
  "revoke_trial",
  "set_commission_exempt",
  "set_negative_limit",
  "unpublish_store",
  "suspend_store",
  "unsuspend_store",
  "wallet_adjustment",
  "approve_top_up",
  "reject_top_up",
  // Phase 9B (docs/admin-saas.md)
  "deactivate_coupon",
  "reactivate_coupon",
  "disconnect_integration",
  "clear_integration_error",
  "remove_domain",
  "unpublish_cms_item",
  "set_ad_status",
  "update_template",
  "set_default_template",
  // tallaby.com blog (0073)
  "create_blog_post",
  "update_blog_post",
  "delete_blog_post",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_REASON_MIN = 3;
export const ADMIN_REASON_MAX = 500;
/** Highest per-seller store-limit exception (D27). */
export const MAX_STORES_OVERRIDE_LIMIT = 100;
/** A trial can be extended to at most this many days from now. */
export const MAX_TRIAL_EXTENSION_DAYS = 365;
/** Largest single admin wallet adjustment and negative limit: EGP 100,000. */
export const ADMIN_MONEY_MAX_PIASTRES = 10_000_000;

const DECIMAL_RE = /^(-)?(\d{1,8})(?:\.(\d{1,2}))?$/;

/** Exact decimal string → integer piastres ("-12.5" → -1250). Null if malformed. No floating point. */
export function decimalToPiastres(value: string): number | null {
  const match = DECIMAL_RE.exec(value.trim());
  if (!match) return null;
  const [, sign, whole, fraction = ""] = match;
  const piastres = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return sign && piastres !== 0 ? -piastres : piastres;
}

/** Integer piastres → 2-dp decimal string for numeric(10,2) columns (-1250 → "-12.50"). */
export function piastresToDecimal(piastres: number): string {
  const sign = piastres < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(piastres));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const uuid = z.string().regex(UUID_RE, "Invalid id");
const reason = z
  .string()
  .trim()
  .min(ADMIN_REASON_MIN, `Reason must be at least ${ADMIN_REASON_MIN} characters`)
  .max(ADMIN_REASON_MAX, `Reason must be at most ${ADMIN_REASON_MAX} characters`);

const PLAN_IDS = Object.keys(PLANS) as [PlanId, ...PlanId[]];
const FEE_PLAN_IDS = Object.keys(FEE_PLANS) as [FeePlanId, ...FeePlanId[]];

/** A non-negative EGP amount up to ADMIN_MONEY_MAX_PIASTRES, normalised to 2 dp. */
const nonNegativeMoney = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const piastres = decimalToPiastres(value);
    if (piastres === null || piastres < 0 || piastres > ADMIN_MONEY_MAX_PIASTRES) {
      ctx.addIssue({ code: "custom", message: "Enter an amount between 0 and 100,000" });
      return z.NEVER;
    }
    return piastresToDecimal(piastres);
  });

const base = { sellerId: uuid, reason };

/** P9-02 seller-account overrides. One audited action per call. */
export const sellerOverrideSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("set_plan"), ...base, plan: z.enum(PLAN_IDS) }),
  z.strictObject({
    action: z.literal("set_store_limit"),
    ...base,
    /** null = back to the plan limit. */
    maxStoresOverride: z.number().int().min(0).max(MAX_STORES_OVERRIDE_LIMIT).nullable(),
  }),
  z.strictObject({ action: z.literal("set_fee_plan"), ...base, feePlan: z.enum(FEE_PLAN_IDS) }),
  z.strictObject({ action: z.literal("extend_trial"), ...base, endsAt: z.iso.datetime({ offset: true }) }),
  z.strictObject({ action: z.literal("grant_trial"), ...base }),
  z.strictObject({ action: z.literal("revoke_trial"), ...base }),
  z.strictObject({ action: z.literal("set_commission_exempt"), ...base, exempt: z.boolean() }),
  z.strictObject({
    action: z.literal("set_negative_limit"),
    ...base,
    /** How far below zero optional purchases may go (D21); null = default (0). */
    negativeLimit: nonNegativeMoney.nullable(),
  }),
]);

export type SellerOverrideInput = z.input<typeof sellerOverrideSchema>;
export type SellerOverride = z.output<typeof sellerOverrideSchema>;

/** P9-01 single-store actions. */
export const adminStoreActionSchema = z.strictObject({
  action: z.enum(["unpublish_store", "suspend_store", "unsuspend_store"]),
  sellerId: uuid,
  storeId: uuid,
  reason,
});

export type AdminStoreActionInput = z.input<typeof adminStoreActionSchema>;

/**
 * P9-01 store-wallet `adjustment`. `amount` is signed ("-50", "120.50").
 * `idempotencyKey` is generated once per adjustment form and becomes the
 * ledger reference `admin:<key>`, so a double submit posts once.
 */
export const walletAdjustmentSchema = z.strictObject({
  sellerId: uuid,
  storeId: uuid.nullable().optional(),
  amount: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const piastres = decimalToPiastres(value);
      if (piastres === null || piastres === 0 || Math.abs(piastres) > ADMIN_MONEY_MAX_PIASTRES) {
        ctx.addIssue({ code: "custom", message: "Enter a non-zero amount up to 100,000 (use - for a debit)" });
        return z.NEVER;
      }
      return piastresToDecimal(piastres);
    }),
  reason,
  idempotencyKey: uuid,
});

export type WalletAdjustmentInput = z.input<typeof walletAdjustmentSchema>;

export type AdminResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };
