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
  StoreWalletNotActiveError,
  postStoreWalletEntry,
} from "@workspace/db/wallet";
import { unpublishStoreSite } from "../store-sites/server";
import {
  MAX_TRIAL_EXTENSION_DAYS,
  adminStoreActionSchema,
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
    case "set_plan":
      if (o.plan === seller.plan) nothing();
      return {
        before: { plan: seller.plan },
        after: { plan: o.plan },
        set: { plan: o.plan, planStartedAt: now.toISOString() },
      };
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
    .values({ sellerId, balance: "0", currency: "EGP", negativeLimit: next })
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
// Store-wallet adjustment (P9-01)
// ---------------------------------------------------------------------------

export type WalletAdjustmentError = "not_admin" | "invalid_input" | "not_found" | "wallet_not_active";

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
          referenceType: STORE_WALLET_REFERENCE_TYPES.admin,
          referenceId: o.idempotencyKey,
          description: "Tallaby adjustment",
          metadata: { source: "admin", reason: o.reason },
          createdBy: actorId,
        });
      } catch (error) {
        if (error instanceof DuplicateStoreWalletEntryError) return { status: "already_applied" };
        if (error instanceof StoreWalletNotActiveError) throw new OverrideError("wallet_not_active");
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
