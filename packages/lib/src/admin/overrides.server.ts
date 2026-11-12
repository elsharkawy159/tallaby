/**
 * Audited admin writes on a seller account, its stores and its store wallet
 * (PLAN.md P9-01, P9-02).
 *
 * Every function:
 *   1. validates the input (strict Zod, required reason);
 *   2. re-checks the actor is an admin, inside the transaction;
 *   3. locks and re-reads the row it changes (ids come from the database,
 *      never trusted from the caller beyond lookup);
 *   4. writes exactly one admin_audit_log row in the same transaction.
 *
 * Store-wallet adjustments go only through postStoreWalletEntry (CLAUDE.md
 * rule 7) with the reference `admin:<idempotencyKey>`, so a replay posts
 * nothing and writes no second audit row.
 */
import {
  and,
  db,
  eq,
  isNull,
  sellerCustomDomains,
  sellerWallet,
  sellers,
  sql,
  stores,
} from "@workspace/db";
import {
  DuplicateStoreWalletEntryError,
  STORE_WALLET_REFERENCE_TYPES,
  StoreWalletCurrencyError,
  StoreWalletNotActiveError,
  postStoreWalletEntry,
} from "@workspace/db/wallet";
import { unpublishStoreSite } from "../store-sites/server";
import { updateStoreSubdomain } from "../stores/server";
import { normalizeSubdomain, validateSubdomain, type SubdomainProblem } from "../storefront";
import {
  MAX_TRIAL_EXTENSION_DAYS,
  adminStoreActionSchema,
  adminStoreSubdomainSchema,
  decimalToPiastres,
  sellerOverrideSchema,
  walletAdjustmentSchema,
  type AdminResult,
  type SellerOverride,
} from "./admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

const DAY_MS = 86_400_000;

class OverrideError<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

function failure<E extends string>(error: unknown): { success: false; error: E | "not_admin" } {
  if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
  if (error instanceof OverrideError) return { success: false, error: error.code as E };
  throw error;
}

const time = (value: string | null | undefined) => (value ? new Date(value).getTime() : null);

// ---------------------------------------------------------------------------
// Seller account overrides (P9-02)
// ---------------------------------------------------------------------------

export type SellerOverrideError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "no_change"
  | "trial_not_started"
  | "trial_already_started"
  | "end_not_later";

export type SellerOverrideResult = { auditId: string; before: Record<string, unknown>; after: Record<string, unknown> };

const SELLER_FIELDS = {
  id: sellers.id,
  plan: sellers.plan,
  planExpiresAt: sellers.planExpiresAt,
  planAdminGranted: sellers.planAdminGranted,
  maxStoresOverride: sellers.maxStoresOverride,
  feePlan: sellers.feePlan,
  feeTrialEligible: sellers.feeTrialEligible,
  feeTrialStartedAt: sellers.feeTrialStartedAt,
  feeTrialEndsAt: sellers.feeTrialEndsAt,
  isCommissionExempt: sellers.isCommissionExempt,
};

type SellerSnapshot = {
  id: string;
  plan: string;
  planExpiresAt: string | null;
  planAdminGranted: boolean;
  maxStoresOverride: number | null;
  feePlan: string;
  feeTrialEligible: boolean;
  feeTrialStartedAt: string | null;
  feeTrialEndsAt: string | null;
  isCommissionExempt: boolean;
};

type SellerChange = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  set: Partial<typeof sellers.$inferInsert>;
};

/** What one override changes on the sellers row. Throws OverrideError for refused changes. */
function sellerChange(o: SellerOverride, seller: SellerSnapshot, now: Date): SellerChange | null {
  const nothing = () => {
    throw new OverrideError("no_change");
  };
  switch (o.action) {
    case "set_plan": {
      // Pro set here is a free grant: never charged, not counted as income (ROADMAP.md F-55f).
      const grant = o.plan === "pro";
      const until = grant && o.planExpiresAt ? new Date(o.planExpiresAt) : null;
      if ((!grant && o.planExpiresAt) || (until && until.getTime() <= now.getTime())) {
        throw new OverrideError("invalid_input");
      }
      const planExpiresAt = until ? until.toISOString() : null;
      // Pro to Pro is a change when it turns a paid plan into a grant or moves the grant's end.
      const samePlan = o.plan === seller.plan;
      if (samePlan && (!grant || (seller.planAdminGranted && time(seller.planExpiresAt) === (until?.getTime() ?? null)))) {
        nothing();
      }
      return {
        before: { plan: seller.plan, planExpiresAt: seller.planExpiresAt, planAdminGranted: seller.planAdminGranted },
        after: { plan: o.plan, planExpiresAt, planAdminGranted: grant },
        set: {
          plan: o.plan,
          ...(samePlan ? {} : { planStartedAt: now.toISOString() }),
          planExpiresAt,
          planAdminGranted: grant,
          planCancelAtPeriodEnd: false,
          planGraceUntil: null,
        },
      };
    }
    case "set_store_limit":
      if (o.maxStoresOverride === seller.maxStoresOverride) nothing();
      return {
        before: { maxStoresOverride: seller.maxStoresOverride },
        after: { maxStoresOverride: o.maxStoresOverride },
        set: { maxStoresOverride: o.maxStoresOverride },
      };
    case "set_fee_plan":
      if (o.feePlan === seller.feePlan) nothing();
      return {
        before: { feePlan: seller.feePlan },
        after: { feePlan: o.feePlan },
        set: { feePlan: o.feePlan, feePlanEffectiveAt: now.toISOString() },
      };
    case "extend_trial": {
      const started = time(seller.feeTrialStartedAt);
      const currentEnd = time(seller.feeTrialEndsAt);
      if (started === null || currentEnd === null) throw new OverrideError("trial_not_started");
      const nextEnd = new Date(o.endsAt);
      if (nextEnd.getTime() <= currentEnd) throw new OverrideError("end_not_later");
      if (nextEnd.getTime() > now.getTime() + MAX_TRIAL_EXTENSION_DAYS * DAY_MS) {
        throw new OverrideError("invalid_input");
      }
      return {
        before: { feeTrialEndsAt: new Date(currentEnd).toISOString() },
        after: { feeTrialEndsAt: nextEnd.toISOString() },
        set: { feeTrialEndsAt: nextEnd.toISOString() },
      };
    }
    case "grant_trial":
    case "revoke_trial": {
      // §13.5: eligibility can only change before the trial starts.
      if (seller.feeTrialStartedAt) throw new OverrideError("trial_already_started");
      const eligible = o.action === "grant_trial";
      if (seller.feeTrialEligible === eligible) nothing();
      return {
        before: { feeTrialEligible: seller.feeTrialEligible },
        after: { feeTrialEligible: eligible },
        set: { feeTrialEligible: eligible },
      };
    }
    case "set_commission_exempt":
      if (o.exempt === seller.isCommissionExempt) nothing();
      return {
        before: { isCommissionExempt: seller.isCommissionExempt },
        after: { isCommissionExempt: o.exempt },
        set: { isCommissionExempt: o.exempt },
      };
    case "set_negative_limit":
      return null; // lives on seller_wallet, handled by the caller
  }
}

/** Applies one P9-02 override to a seller account and logs it. */
export async function applySellerOverride(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<SellerOverrideResult, SellerOverrideError>> {
  const parsed = sellerOverrideSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const o = parsed.data;

  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [seller] = await tx.select(SELLER_FIELDS).from(sellers).where(eq(sellers.id, o.sellerId)).for("update");
      if (!seller) throw new OverrideError("not_found");

      let change: Omit<SellerChange, "set">;
      if (o.action === "set_negative_limit") {
        change = await setNegativeLimit(tx, o.sellerId, o.negativeLimit);
      } else {
        const sellerUpdate = sellerChange(o, seller, new Date())!;
        await tx
          .update(sellers)
          .set({ ...sellerUpdate.set, updatedAt: sql`now()` })
          .where(eq(sellers.id, o.sellerId));
        change = sellerUpdate;
      }

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: o.sellerId,
        action: o.action,
        before: change.before,
        after: change.after,
        reason: o.reason,
      });
      return { auditId, before: change.before, after: change.after };
    });
    return { success: true, data };
  } catch (error) {
    return failure<SellerOverrideError>(error);
  }
}

/** D21 per-seller overdraft for optional purchases. Never touches the balance. */
async function setNegativeLimit(tx: Queryable, sellerId: string, next: string | null) {
  const [wallet] = await tx
    .select({ negativeLimit: sellerWallet.negativeLimit })
    .from(sellerWallet)
    .where(eq(sellerWallet.sellerId, sellerId))
    .for("update");
  const current = wallet?.negativeLimit ?? null;
  const same =
    current === null || next === null ? current === next : decimalToPiastres(current) === decimalToPiastres(next);
  if (same) throw new OverrideError("no_change");

  // Wallet rows are created lazily (balance 0), the same way postStoreWalletEntry does.
  await tx
    .insert(sellerWallet)
    .values({ sellerId, balance: "0", negativeLimit: next })
    .onConflictDoUpdate({ target: sellerWallet.sellerId, set: { negativeLimit: next, updatedAt: sql`now()` } });
  return { before: { negativeLimit: current }, after: { negativeLimit: next } };
}

// ---------------------------------------------------------------------------
// Single-store actions (P9-01)
// ---------------------------------------------------------------------------

export type AdminStoreActionError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "no_change"
  | "store_read_only"
  | "not_published";

export type AdminStoreActionResult = {
  auditId: string;
  sellerId: string;
  storeId: string;
  subdomain: string;
  /** Any custom domain on the store, for cache invalidation. */
  customDomain: string | null;
};

/** Force-unpublish, suspend or unsuspend one store, with a reason. */
export async function applyAdminStoreAction(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<AdminStoreActionResult, AdminStoreActionError>> {
  const parsed = adminStoreActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const o = parsed.data;

  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [store] = await tx
        .select({
          id: stores.id,
          sellerId: stores.sellerId,
          subdomain: stores.subdomain,
          status: stores.status,
          siteStatus: stores.siteStatus,
          publishedRevisionId: stores.publishedRevisionId,
        })
        .from(stores)
        .where(and(eq(stores.id, o.storeId), eq(stores.sellerId, o.sellerId), isNull(stores.deletedAt)))
        .for("update");
      if (!store) throw new OverrideError("not_found");

      let before: Record<string, unknown>;
      let after: Record<string, unknown>;
      if (o.action === "unpublish_store") {
        // Same function the seller's own Unpublish uses (store owner from the DB row).
        const result = await unpublishStoreSite(store.sellerId, store.id, tx);
        if (!result.success) throw new OverrideError(result.error);
        before = { siteStatus: store.siteStatus, publishedRevisionId: store.publishedRevisionId };
        after = { siteStatus: "unpublished", publishedRevisionId: null };
      } else {
        const next = o.action === "suspend_store" ? "suspended" : "active";
        // Unsuspend only lifts an admin suspension; suspend works from active or archived.
        if (o.action === "suspend_store" ? store.status === "suspended" : store.status !== "suspended") {
          throw new OverrideError("no_change");
        }
        await tx.update(stores).set({ status: next, updatedAt: sql`now()` }).where(eq(stores.id, store.id));
        before = { status: store.status };
        after = { status: next };
      }

      const [domain] = await tx
        .select({ domain: sellerCustomDomains.domain })
        .from(sellerCustomDomains)
        .where(eq(sellerCustomDomains.storeId, store.id))
        .limit(1);

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: store.sellerId,
        storeId: store.id,
        action: o.action,
        before,
        after,
        reason: o.reason,
      });
      return {
        auditId,
        sellerId: store.sellerId,
        storeId: store.id,
        subdomain: store.subdomain,
        customDomain: domain?.domain ?? null,
      };
    });
    return { success: true, data };
  } catch (error) {
    return failure<AdminStoreActionError>(error);
  }
}

// ---------------------------------------------------------------------------
// Store subdomain (owner request 2026-11-12)
// ---------------------------------------------------------------------------

export type AdminStoreSubdomainError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "no_change"
  | "store_read_only"
  | "taken"
  | SubdomainProblem;

export type AdminStoreSubdomainResult = {
  auditId: string;
  sellerId: string;
  storeId: string;
  subdomain: string;
  previous: string;
  /** Any custom domain on the store, for cache invalidation. */
  customDomain: string | null;
};

/**
 * Moves one store to a new `{subdomain}.tallaby.com` for the admin. The move
 * itself is the seller's own `updateStoreSubdomain` (same format and
 * reserved-name rules, same "taken" check across stores, sellers and other
 * sellers' redirects, and the old address kept as a redirect to this store),
 * run for the store's owner as read from the database, inside the same
 * transaction as the audit row. The seller flow has no cooldown, so there is
 * nothing to bypass.
 */
export async function changeStoreSubdomainByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<AdminStoreSubdomainResult, AdminStoreSubdomainError>> {
  const parsed = adminStoreSubdomainSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const o = parsed.data;
  // Format and reserved names first, so a typo never opens a transaction.
  const wanted = normalizeSubdomain(o.subdomain);
  const problem = validateSubdomain(wanted);
  if (problem) return { success: false, error: problem };

  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [store] = await tx
        .select({ id: stores.id, sellerId: stores.sellerId, subdomain: stores.subdomain })
        .from(stores)
        .where(and(eq(stores.id, o.storeId), isNull(stores.deletedAt)))
        .for("update");
      if (!store) throw new OverrideError("not_found");
      if (store.subdomain === wanted) throw new OverrideError("no_change");

      const moved = await updateStoreSubdomain(store.sellerId, store.id, wanted, tx);
      if (!moved.success) {
        throw new OverrideError(moved.error === "available" ? "invalid_input" : moved.error);
      }

      const [domain] = await tx
        .select({ domain: sellerCustomDomains.domain })
        .from(sellerCustomDomains)
        .where(eq(sellerCustomDomains.storeId, store.id))
        .limit(1);

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: store.sellerId,
        storeId: store.id,
        action: "change_store_subdomain",
        before: { subdomain: moved.data.previous },
        after: { subdomain: moved.data.subdomain, redirectFrom: moved.data.previous },
        reason: o.reason,
      });
      return {
        auditId,
        sellerId: store.sellerId,
        storeId: store.id,
        subdomain: moved.data.subdomain,
        previous: moved.data.previous,
        customDomain: domain?.domain ?? null,
      };
    });
    return { success: true, data };
  } catch (error) {
    return failure<AdminStoreSubdomainError>(error);
  }
}

// ---------------------------------------------------------------------------
// Store-wallet adjustment (P9-01)
// ---------------------------------------------------------------------------

export type WalletAdjustmentError = "not_admin" | "invalid_input" | "not_found" | "wallet_not_active" | "wallet_currency_changed";

export type WalletAdjustmentResult =
  | { status: "applied"; entryId: string; balanceBefore: string; balanceAfter: string; auditId: string }
  /** The same idempotency key was already posted for this seller: nothing changed. */
  | { status: "already_applied" };

/** An `adjustment` entry (credit or debit) with a required reason. Fees-style: no negative-limit check. */
export async function adjustStoreWalletByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<WalletAdjustmentResult, WalletAdjustmentError>> {
  const parsed = walletAdjustmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const o = parsed.data;

  try {
    const data = await q.transaction(async (tx): Promise<WalletAdjustmentResult> => {
      await assertAdminActor(tx, actorId);
      const [seller] = await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, o.sellerId));
      if (!seller) throw new OverrideError("not_found");
      if (o.storeId) {
        const [store] = await tx
          .select({ id: stores.id })
          .from(stores)
          .where(and(eq(stores.id, o.storeId), eq(stores.sellerId, o.sellerId)));
        if (!store) throw new OverrideError("not_found");
      }

      let entry;
      try {
        entry = await postStoreWalletEntry(tx, {
          sellerId: o.sellerId,
          storeId: o.storeId ?? null,
          type: "adjustment",
          amount: o.amount,
          // The currency the admin was shown, so a form left open across the USD switch is refused.
          ...(o.currency ? { currency: o.currency } : {}),
          referenceType: STORE_WALLET_REFERENCE_TYPES.admin,
          referenceId: o.idempotencyKey,
          description: "Tallaby adjustment",
          metadata: { source: "admin", reason: o.reason },
          createdBy: actorId,
        });
      } catch (error) {
        if (error instanceof DuplicateStoreWalletEntryError) return { status: "already_applied" };
        if (error instanceof StoreWalletNotActiveError) throw new OverrideError("wallet_not_active");
        if (error instanceof StoreWalletCurrencyError) throw new OverrideError("wallet_currency_changed");
        throw error;
      }

      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: o.sellerId,
        storeId: o.storeId ?? null,
        action: "wallet_adjustment",
        before: { balance: entry.balanceBefore },
        after: {
          balance: entry.balanceAfter,
          amount: o.amount,
          entryId: entry.entryId,
          reference: `${STORE_WALLET_REFERENCE_TYPES.admin}:${o.idempotencyKey}`,
        },
        reason: o.reason,
      });
      return { status: "applied", ...entry, auditId };
    });
    return { success: true, data };
  } catch (error) {
    return failure<WalletAdjustmentError>(error);
  }
}
