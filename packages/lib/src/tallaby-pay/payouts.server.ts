/**
 * Tallaby Pay withdrawals and KYC (ROADMAP.md F-100e; design §7, §10 and the
 * owner's answers in §14). Server-only.
 *
 * Invariants:
 *   1. Balances move only through `postTallabyPayEntry` (ledger.server.ts):
 *      a request posts `payout_reserve`, a cancel or reject `payout_unreserve`,
 *      mark paid `payout` (−available, −reserved) and a bounced transfer
 *      `payout_reversal` (+available). The status change and its entry commit
 *      together or not at all.
 *   2. Every status change is a claim: `UPDATE … WHERE status = '<from>'`.
 *      A double click, a second admin or a replay finds no row and changes
 *      nothing.
 *   3. Lock order is always wallet row, then payout row, so two of these
 *      never deadlock. One open request per store: the wallet lock
 *      serializes requests and the partial unique index is the backstop.
 *   4. Tenant isolation (rule 5): the seller is always the session's seller,
 *      passed by the caller; a store is used only when `stores.seller_id`
 *      matches; every payout read and write is filtered by store and seller.
 *   5. Admin writes re-check the actor in the database (`assertAdminActor`),
 *      refuse an admin acting on their own account, and write
 *      admin_audit_log in the same transaction.
 *   6. Never cached (rule 8). Destinations are returned masked to sellers.
 */
import { db, sql } from "@workspace/db";

import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "../admin/admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit } from "../admin/guard.server";
import { amountToPiastres, piastresToAmount } from "./fee.lib";
import {
  TallabyPayBalanceError,
  TallabyPayStoreMismatchError,
  TallabyPayWalletFrozenError,
  postTallabyPayEntry,
} from "./ledger.server";
import {
  holderMatchesLegalName,
  maskTallabyPayDestination,
  resolveTallabyPayPayoutAmount,
  tallabyPayDestinationSchema,
  tallabyPayKycSchema,
  tallabyPayPayoutRequestSchema,
  tallabyPayWithdrawBlock,
  tallabyPayWithdrawable,
  type TallabyPayKycIdType,
  type TallabyPayKycStatus,
  type TallabyPayPayoutMethod,
  type TallabyPayPayoutStatus,
  type TallabyPayWithdrawBlock,
} from "./payouts.lib";
import { getTallabyPaySettings } from "./settings.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type TallabyPayResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

/** Thrown inside a transaction to roll it back and return a typed error. */
class Failure<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

/** The store, only when it is a live store of this seller (rule 5). */
async function ownedStore(q: Queryable, sellerId: string, storeId: string): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return false;
  const rows = await q.execute<{ id: string }>(sql`
    SELECT id FROM stores WHERE id = ${storeId} AND seller_id = ${sellerId} AND deleted_at IS NULL
  `);
  return rows.length > 0;
}

type WalletRow = { id: string; status: string; pending: string; available: string; reserved: string };

/** Locks the store's wallet row (lock order: wallet first). */
async function lockWallet(q: Queryable, storeId: string, sellerId: string): Promise<WalletRow | undefined> {
  const [row] = await q.execute<WalletRow>(sql`
    SELECT id, status, pending::text, available::text, reserved::text
      FROM tallaby_pay_wallets WHERE store_id = ${storeId} AND seller_id = ${sellerId}
       FOR UPDATE
  `);
  return row;
}

type KycRow = { status: TallabyPayKycStatus; legal_name: string };

async function readKyc(q: Queryable, sellerId: string): Promise<KycRow | undefined> {
  const [row] = await q.execute<KycRow>(sql`
    SELECT status, legal_name FROM tallaby_pay_kyc WHERE seller_id = ${sellerId}
  `);
  return row;
}

async function hasOpenRequest(q: Queryable, storeId: string): Promise<boolean> {
  const rows = await q.execute<{ id: string }>(sql`
    SELECT id FROM tallaby_pay_payouts WHERE store_id = ${storeId} AND status = 'requested' LIMIT 1
  `);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Seller: request and cancel
// ---------------------------------------------------------------------------

export type RequestTallabyPayPayoutError = TallabyPayWithdrawBlock | "invalid_input" | "not_found";

export interface RequestTallabyPayPayoutInput {
  /** The session's seller; never from the client. */
  sellerId: string;
  /** From the route; checked against the seller here. */
  storeId: string;
  /** The session user (stored as the entry's creator). */
  userId?: string | null;
  /** The form: `{ amount?, destination }`. Untrusted. */
  input: unknown;
}

/**
 * Opens a withdrawal request and reserves its amount, in one transaction.
 * Refused unless the account's KYC is verified, the destination is in the
 * legal name, the wallet is active and the amount is between the minimum and
 * available − reserved.
 */
export async function requestTallabyPayPayout(
  args: RequestTallabyPayPayoutInput,
  q: typeof db = db,
): Promise<TallabyPayResult<{ payoutId: string; amount: string }, RequestTallabyPayPayoutError>> {
  const parsed = tallabyPayPayoutRequestSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const sellerId = String(args.sellerId).toLowerCase();
  const { storeId } = args;

  try {
    return await q.transaction(async (tx) => {
      if (!(await ownedStore(tx, sellerId, storeId))) throw new Failure("not_found");

      const kyc = await readKyc(tx, sellerId);
      // No wallet yet means nothing was ever earned: available is 0.
      const wallet = await lockWallet(tx, storeId, sellerId);
      const settings = await getTallabyPaySettings(tx);
      const state = {
        available: wallet ? amountToPiastres(wallet.available) : 0,
        reserved: wallet ? amountToPiastres(wallet.reserved) : 0,
        walletStatus: wallet?.status ?? "active",
        kycStatus: kyc?.status ?? null,
        hasOpenRequest: wallet ? await hasOpenRequest(tx, storeId) : false,
        minPayoutPiastres: settings.minPayoutPiastres,
      };
      const resolved = resolveTallabyPayPayoutAmount(state, parsed.data.amount);
      if (!resolved.ok) throw new Failure(resolved.error);
      if (!holderMatchesLegalName(parsed.data.destination.holderName, kyc!.legal_name)) throw new Failure("name_mismatch");

      const amount = piastresToAmount(resolved.amount);
      const [payout] = await tx.execute<{ id: string }>(sql`
        INSERT INTO tallaby_pay_payouts (wallet_id, store_id, seller_id, amount, method, destination)
        VALUES (${wallet!.id}, ${storeId}, ${sellerId}, ${amount}::numeric, ${parsed.data.destination.method},
          ${JSON.stringify(parsed.data.destination)}::jsonb)
        RETURNING id
      `);
      await postTallabyPayEntry(tx, {
        storeId,
        sellerId,
        kind: "payout_reserve",
        reservedPiastres: resolved.amount,
        payoutId: payout!.id,
        referenceType: "payout",
        referenceId: payout!.id,
        description: "Withdrawal requested",
        createdBy: args.userId ?? null,
      });
      return { success: true as const, data: { payoutId: payout!.id, amount } };
    });
  } catch (error) {
    if (error instanceof Failure) return { success: false, error: error.code as RequestTallabyPayPayoutError };
    if (error instanceof TallabyPayWalletFrozenError) return { success: false, error: "frozen" };
    if (error instanceof TallabyPayBalanceError) return { success: false, error: "above_withdrawable" };
    if (error instanceof TallabyPayStoreMismatchError) return { success: false, error: "not_found" };
    // A concurrent request won the one-open-per-store index.
    if (pgCode(error) === "23505") return { success: false, error: "open_request" };
    throw error;
  }
}

export type CancelTallabyPayPayoutError = "invalid_input" | "not_found" | "already_handled";

/** The seller cancels their own open request; the reservation is released. */
export async function cancelTallabyPayPayout(
  args: { sellerId: string; storeId: string; payoutId: string; userId?: string | null },
  q: typeof db = db,
): Promise<TallabyPayResult<{ payoutId: string }, CancelTallabyPayPayoutError>> {
  if (!isUuid(args.payoutId)) return { success: false, error: "invalid_input" };
  const sellerId = String(args.sellerId).toLowerCase();
  const { storeId, payoutId } = args;
  try {
    return await q.transaction(async (tx) => {
      if (!(await ownedStore(tx, sellerId, storeId))) throw new Failure("not_found");
      await lockWallet(tx, storeId, sellerId);
      const [row] = await tx.execute<{ id: string; amount: string }>(sql`
        UPDATE tallaby_pay_payouts SET status = 'cancelled'
         WHERE id = ${payoutId} AND store_id = ${storeId} AND seller_id = ${sellerId} AND status = 'requested'
        RETURNING id, amount::text
      `);
      if (!row) {
        const exists = await tx.execute(sql`
          SELECT 1 FROM tallaby_pay_payouts WHERE id = ${payoutId} AND store_id = ${storeId} AND seller_id = ${sellerId}
        `);
        throw new Failure(exists.length ? "already_handled" : "not_found");
      }
      await postTallabyPayEntry(tx, {
        storeId,
        sellerId,
        kind: "payout_unreserve",
        reservedPiastres: -amountToPiastres(row.amount),
        payoutId,
        referenceType: "payout",
        referenceId: payoutId,
        description: "Withdrawal cancelled",
        createdBy: args.userId ?? null,
      });
      return { success: true as const, data: { payoutId } };
    });
  } catch (error) {
    if (error instanceof Failure) return { success: false, error: error.code as CancelTallabyPayPayoutError };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Admin: mark paid, reject, reverse
// ---------------------------------------------------------------------------

export type TallabyPayAdminError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "already_reviewed"
  | "own_account"
  | "wallet_frozen"
  | "insufficient_balance";

export const TALLABY_PAY_ADMIN_ERROR_MESSAGES: Record<TallabyPayAdminError | "generic", string> = {
  not_admin: "You don't have permission to manage Tallaby Pay.",
  invalid_input: "Check the form: a reference (2–120 characters) or a reason (at least 3 characters) is required.",
  not_found: "This record no longer exists.",
  already_reviewed: "This was already handled by someone else.",
  own_account: "You can't review your own account.",
  wallet_frozen: "This store's earnings are frozen. Unfreeze them first, or reject the request.",
  insufficient_balance: "The store's available earnings are below this amount now. Reject the request instead.",
  generic: "Something went wrong. Try again.",
};

const REFERENCE_MIN = 2;
const REFERENCE_MAX = 120;

function cleanText(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s+/g, " ");
  return t.length >= min && t.length <= max ? t : null;
}

async function runAdmin<T>(fn: () => Promise<T>): Promise<TallabyPayResult<T, TallabyPayAdminError>> {
  try {
    return { success: true, data: await fn() };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof Failure) return { success: false, error: error.code as TallabyPayAdminError };
    if (error instanceof TallabyPayBalanceError) return { success: false, error: "insufficient_balance" };
    throw error;
  }
}

type PayoutRow = {
  id: string;
  store_id: string;
  seller_id: string;
  amount: string;
  status: TallabyPayPayoutStatus;
  /** The wallet's status, read under its lock. */
  wallet_status: string;
};

/** Reads the payout, refuses the admin's own account, then locks the wallet (wallet before payout). */
async function preparePayoutReview(tx: Tx, adminId: string, payoutId: string): Promise<PayoutRow> {
  await assertAdminActor(tx, adminId);
  const [payout] = await tx.execute<Omit<PayoutRow, "wallet_status">>(sql`
    SELECT id, store_id, seller_id, amount::text, status FROM tallaby_pay_payouts WHERE id = ${payoutId}
  `);
  if (!payout) throw new Failure<TallabyPayAdminError>("not_found");
  if (payout.seller_id === adminId.toLowerCase()) throw new Failure<TallabyPayAdminError>("own_account");
  const wallet = await lockWallet(tx, payout.store_id, payout.seller_id);
  if (!wallet) throw new Failure<TallabyPayAdminError>("not_found");
  return { ...payout, wallet_status: wallet.status };
}

/**
 * The team sent the money: `requested` → `paid` with the transfer reference,
 * and the `payout` entry takes the amount out of available and reserved. If
 * available fell below the amount (a refund since), nothing changes and the
 * admin must reject instead.
 */
export async function markTallabyPayPayoutPaid(
  args: { payoutId: string; adminId: string; reference: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ payoutId: string }, TallabyPayAdminError>> {
  const reference = cleanText(args.reference, REFERENCE_MIN, REFERENCE_MAX);
  if (!isUuid(args.payoutId) || !reference) return { success: false, error: "invalid_input" };
  return runAdmin(() =>
    q.transaction(async (tx) => {
      const payout = await preparePayoutReview(tx, args.adminId, args.payoutId);
      // Frozen blocks money leaving the store (design §4.2); a reject still works.
      if (payout.status === "requested" && payout.wallet_status !== "active") {
        throw new Failure<TallabyPayAdminError>("wallet_frozen");
      }
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_payouts
           SET status = 'paid', reference = ${reference}, reviewed_by = ${args.adminId}, reviewed_at = now()
         WHERE id = ${payout.id} AND status = 'requested'
        RETURNING id
      `);
      if (!row) throw new Failure<TallabyPayAdminError>("already_reviewed");
      const piastres = amountToPiastres(payout.amount);
      await postTallabyPayEntry(tx, {
        storeId: payout.store_id,
        sellerId: payout.seller_id,
        kind: "payout",
        availablePiastres: -piastres,
        reservedPiastres: -piastres,
        payoutId: payout.id,
        referenceType: "payout",
        referenceId: payout.id,
        description: "Withdrawal paid",
        metadata: { reference },
        createdBy: args.adminId,
      });
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: payout.seller_id,
        storeId: payout.store_id,
        action: "tallaby_pay_payout_paid",
        before: { status: "requested", amount: payout.amount },
        after: { status: "paid", payoutId: payout.id, reference },
        reason: `Paid, reference ${reference}`,
      });
      return { payoutId: payout.id };
    }),
  );
}

/** Declines a request with a reason; the reservation is released. */
export async function rejectTallabyPayPayout(
  args: { payoutId: string; adminId: string; reason: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ payoutId: string }, TallabyPayAdminError>> {
  const reason = cleanText(args.reason, ADMIN_REASON_MIN, ADMIN_REASON_MAX);
  if (!isUuid(args.payoutId) || !reason) return { success: false, error: "invalid_input" };
  return runAdmin(() =>
    q.transaction(async (tx) => {
      const payout = await preparePayoutReview(tx, args.adminId, args.payoutId);
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_payouts
           SET status = 'rejected', rejection_reason = ${reason}, reviewed_by = ${args.adminId}, reviewed_at = now()
         WHERE id = ${payout.id} AND status = 'requested'
        RETURNING id
      `);
      if (!row) throw new Failure<TallabyPayAdminError>("already_reviewed");
      await postTallabyPayEntry(tx, {
        storeId: payout.store_id,
        sellerId: payout.seller_id,
        kind: "payout_unreserve",
        reservedPiastres: -amountToPiastres(payout.amount),
        payoutId: payout.id,
        referenceType: "payout",
        referenceId: payout.id,
        description: "Withdrawal rejected",
        createdBy: args.adminId,
      });
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: payout.seller_id,
        storeId: payout.store_id,
        action: "tallaby_pay_payout_rejected",
        before: { status: "requested", amount: payout.amount },
        after: { status: "rejected", payoutId: payout.id },
        reason,
      });
      return { payoutId: payout.id };
    }),
  );
}

/** A paid transfer came back: `paid` → `reversed`, and the amount returns to available. */
export async function reverseTallabyPayPayout(
  args: { payoutId: string; adminId: string; reason: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ payoutId: string }, TallabyPayAdminError>> {
  const reason = cleanText(args.reason, ADMIN_REASON_MIN, ADMIN_REASON_MAX);
  if (!isUuid(args.payoutId) || !reason) return { success: false, error: "invalid_input" };
  return runAdmin(() =>
    q.transaction(async (tx) => {
      const payout = await preparePayoutReview(tx, args.adminId, args.payoutId);
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_payouts SET status = 'reversed', reversed_at = now(), reversal_reason = ${reason}
         WHERE id = ${payout.id} AND status = 'paid'
        RETURNING id
      `);
      if (!row) throw new Failure<TallabyPayAdminError>("already_reviewed");
      await postTallabyPayEntry(tx, {
        storeId: payout.store_id,
        sellerId: payout.seller_id,
        kind: "payout_reversal",
        availablePiastres: amountToPiastres(payout.amount),
        payoutId: payout.id,
        referenceType: "payout",
        referenceId: payout.id,
        description: "Withdrawal reversed",
        metadata: { reason },
        createdBy: args.adminId,
      });
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: payout.seller_id,
        storeId: payout.store_id,
        action: "tallaby_pay_payout_reversed",
        before: { status: "paid", amount: payout.amount },
        after: { status: "reversed", payoutId: payout.id },
        reason,
      });
      return { payoutId: payout.id };
    }),
  );
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

export type SubmitTallabyPayKycError = "invalid_input" | "not_found" | "already_verified";

/**
 * The seller submits (or, after a rejection, resubmits) the account's legal
 * name and ID. A verified identity can't be changed by the seller.
 */
export async function submitTallabyPayKyc(
  args: { sellerId: string; input: unknown },
  q: typeof db = db,
): Promise<TallabyPayResult<{ status: "submitted" }, SubmitTallabyPayKycError>> {
  const parsed = tallabyPayKycSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const sellerId = String(args.sellerId).toLowerCase();
  if (!isUuid(sellerId)) return { success: false, error: "not_found" };
  const { legalName, idType, idNumber } = parsed.data;
  try {
    const rows = await q.execute<{ seller_id: string }>(sql`
      INSERT INTO tallaby_pay_kyc (seller_id, legal_name, id_type, id_number, status, submitted_at, updated_at)
      SELECT s.id, ${legalName}, ${idType}, ${idNumber}, 'submitted', now(), now() FROM sellers s WHERE s.id = ${sellerId}
      ON CONFLICT (seller_id) DO UPDATE
        SET legal_name = EXCLUDED.legal_name, id_type = EXCLUDED.id_type, id_number = EXCLUDED.id_number,
            status = 'submitted', submitted_at = now(), updated_at = now(),
            verified_at = NULL, verified_by = NULL, rejection_reason = NULL
        WHERE tallaby_pay_kyc.status <> 'verified'
      RETURNING seller_id
    `);
    if (rows.length) return { success: true, data: { status: "submitted" } };
    const existing = await readKyc(q, sellerId);
    return { success: false, error: existing ? "already_verified" : "not_found" };
  } catch (error) {
    // A CHECK the schema should have caught: treat as bad input.
    if (pgCode(error) === "23514") return { success: false, error: "invalid_input" };
    throw error;
  }
}

/** Admin: the ID matches the legal name. Only a `submitted` KYC can be verified. */
export async function verifyTallabyPayKyc(
  args: { sellerId: string; adminId: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ sellerId: string }, TallabyPayAdminError>> {
  if (!isUuid(args.sellerId)) return { success: false, error: "invalid_input" };
  const sellerId = args.sellerId.toLowerCase();
  return runAdmin(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      if (sellerId === args.adminId.toLowerCase()) throw new Failure<TallabyPayAdminError>("own_account");
      const [row] = await tx.execute<{ legal_name: string; id_type: string }>(sql`
        UPDATE tallaby_pay_kyc
           SET status = 'verified', verified_at = now(), verified_by = ${args.adminId}, rejection_reason = NULL, updated_at = now()
         WHERE seller_id = ${sellerId} AND status = 'submitted'
        RETURNING legal_name, id_type
      `);
      if (!row) throw new Failure<TallabyPayAdminError>((await readKyc(tx, sellerId)) ? "already_reviewed" : "not_found");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId,
        action: "tallaby_pay_kyc_verified",
        before: { status: "submitted" },
        after: { status: "verified", legalName: row.legal_name, idType: row.id_type },
        reason: "KYC verified",
      });
      return { sellerId };
    }),
  );
}

/**
 * Admin: rejects a submitted KYC, or revokes a verified one (for example a
 * fraud finding), with a reason. The seller may resubmit. Open withdrawal
 * requests are not touched; reject them separately.
 */
export async function rejectTallabyPayKyc(
  args: { sellerId: string; adminId: string; reason: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ sellerId: string }, TallabyPayAdminError>> {
  const reason = cleanText(args.reason, ADMIN_REASON_MIN, ADMIN_REASON_MAX);
  if (!isUuid(args.sellerId) || !reason) return { success: false, error: "invalid_input" };
  const sellerId = args.sellerId.toLowerCase();
  return runAdmin(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      if (sellerId === args.adminId.toLowerCase()) throw new Failure<TallabyPayAdminError>("own_account");
      const [before] = await tx.execute<{ status: TallabyPayKycStatus }>(sql`
        SELECT status FROM tallaby_pay_kyc WHERE seller_id = ${sellerId} FOR UPDATE
      `);
      if (!before) throw new Failure<TallabyPayAdminError>("not_found");
      const [row] = await tx.execute<{ seller_id: string }>(sql`
        UPDATE tallaby_pay_kyc
           SET status = 'rejected', rejection_reason = ${reason}, verified_at = NULL, verified_by = NULL, updated_at = now()
         WHERE seller_id = ${sellerId} AND status IN ('submitted', 'verified')
        RETURNING seller_id
      `);
      if (!row) throw new Failure<TallabyPayAdminError>("already_reviewed");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId,
        action: "tallaby_pay_kyc_rejected",
        before: { status: before.status },
        after: { status: "rejected" },
        reason,
      });
      return { sellerId };
    }),
  );
}

// ---------------------------------------------------------------------------
// Reads for the Earnings page (store-scoped, never cached)
// ---------------------------------------------------------------------------

export interface TallabyPayPayoutView {
  id: string;
  amount: string;
  method: TallabyPayPayoutMethod;
  /** Masked: method holder and last digits only. */
  destination: string;
  holderName: string | null;
  status: TallabyPayPayoutStatus;
  reference: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reversedAt: string | null;
}

export interface TallabyPayWalletSummary {
  storeId: string;
  currency: "EGP";
  pending: string;
  /** May be negative after a refund. */
  available: string;
  reserved: string;
  /** available − reserved, never below zero. */
  withdrawable: string;
  /** Σ paid (not reversed) withdrawals. */
  withdrawn: string;
  walletStatus: "active" | "frozen";
  frozenReason: string | null;
  minPayout: string;
  openPayout: TallabyPayPayoutView | null;
  kyc: {
    status: TallabyPayKycStatus | null;
    legalName: string | null;
    idType: TallabyPayKycIdType | null;
    rejectionReason: string | null;
  };
  /** Why a new withdrawal can't be requested now, or null. */
  withdrawBlock: TallabyPayWithdrawBlock | null;
}

type PayoutViewRow = {
  id: string;
  amount: string;
  method: TallabyPayPayoutMethod;
  destination: unknown;
  status: TallabyPayPayoutStatus;
  reference: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reversed_at: string | null;
};

const PAYOUT_VIEW_COLUMNS = sql`id, amount::text, method, destination, status, reference, rejection_reason,
  created_at::text, reviewed_at::text, reversed_at::text`;

function toPayoutView(row: PayoutViewRow): TallabyPayPayoutView {
  const parsed = tallabyPayDestinationSchema.safeParse(row.destination);
  return {
    id: row.id,
    amount: row.amount,
    method: row.method,
    destination: parsed.success ? maskTallabyPayDestination(parsed.data) : "",
    holderName: parsed.success ? parsed.data.holderName : null,
    status: row.status,
    reference: row.reference,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reversedAt: row.reversed_at,
  };
}

/**
 * The store's earnings balances, open request, KYC and minimum. Null when the
 * store is not a live store of this seller. A store with no sale yet shows
 * zeros (the wallet is created on the first sale).
 */
export async function getTallabyPayWalletSummary(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<TallabyPayWalletSummary | null> {
  const seller = String(sellerId).toLowerCase();
  if (!(await ownedStore(q, seller, storeId))) return null;

  const [[wallet], [withdrawn], [open], kyc, settings] = await Promise.all([
    q.execute<{ status: string; frozen_reason: string | null; pending: string; available: string; reserved: string }>(sql`
      SELECT status, frozen_reason, pending::text, available::text, reserved::text
        FROM tallaby_pay_wallets WHERE store_id = ${storeId} AND seller_id = ${seller}
    `),
    q.execute<{ total: string }>(sql`
      SELECT coalesce(sum(amount), 0)::numeric(12,2)::text AS total
        FROM tallaby_pay_payouts WHERE store_id = ${storeId} AND seller_id = ${seller} AND status = 'paid'
    `),
    q.execute<PayoutViewRow>(sql`
      SELECT ${PAYOUT_VIEW_COLUMNS} FROM tallaby_pay_payouts
       WHERE store_id = ${storeId} AND seller_id = ${seller} AND status = 'requested'
       LIMIT 1
    `),
    q.execute<{ status: TallabyPayKycStatus; legal_name: string; id_type: TallabyPayKycIdType; rejection_reason: string | null }>(sql`
      SELECT status, legal_name, id_type, rejection_reason FROM tallaby_pay_kyc WHERE seller_id = ${seller}
    `),
    getTallabyPaySettings(q),
  ]);
  const k = kyc[0];
  const available = wallet ? amountToPiastres(wallet.available) : 0;
  const reserved = wallet ? amountToPiastres(wallet.reserved) : 0;
  const walletStatus = wallet?.status === "frozen" ? "frozen" : "active";
  return {
    storeId,
    currency: "EGP",
    pending: wallet?.pending ?? "0.00",
    available: wallet?.available ?? "0.00",
    reserved: wallet?.reserved ?? "0.00",
    withdrawable: piastresToAmount(tallabyPayWithdrawable(available, reserved)),
    withdrawn: withdrawn?.total ?? "0.00",
    walletStatus,
    frozenReason: wallet?.frozen_reason ?? null,
    minPayout: piastresToAmount(settings.minPayoutPiastres),
    openPayout: open ? toPayoutView(open) : null,
    kyc: {
      status: k?.status ?? null,
      legalName: k?.legal_name ?? null,
      idType: k?.id_type ?? null,
      rejectionReason: k?.rejection_reason ?? null,
    },
    withdrawBlock: tallabyPayWithdrawBlock({
      available,
      reserved,
      walletStatus,
      kycStatus: k?.status ?? null,
      hasOpenRequest: Boolean(open),
      minPayoutPiastres: settings.minPayoutPiastres,
    }),
  };
}

export const TALLABY_PAY_PAYOUTS_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** The store's withdrawal history, newest first. Empty when the store is not this seller's. */
export async function listTallabyPayPayouts(
  args: { sellerId: string; storeId: string; page?: number; pageSize?: number },
  q: Queryable = db,
): Promise<{ rows: TallabyPayPayoutView[]; total: number; page: number; pageSize: number }> {
  const seller = String(args.sellerId).toLowerCase();
  const pageSize = Math.min(Math.max(Math.trunc(args.pageSize ?? TALLABY_PAY_PAYOUTS_PAGE_SIZE) || 1, 1), MAX_PAGE_SIZE);
  const page = Math.max(Math.trunc(args.page ?? 1) || 1, 1);
  if (!(await ownedStore(q, seller, args.storeId))) return { rows: [], total: 0, page, pageSize };

  const [rows, [count]] = await Promise.all([
    q.execute<PayoutViewRow>(sql`
      SELECT ${PAYOUT_VIEW_COLUMNS} FROM tallaby_pay_payouts
       WHERE store_id = ${args.storeId} AND seller_id = ${seller}
       ORDER BY created_at DESC, id DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `),
    q.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM tallaby_pay_payouts WHERE store_id = ${args.storeId} AND seller_id = ${seller}
    `),
  ]);
  return { rows: rows.map(toPayoutView), total: count?.n ?? 0, page, pageSize };
}
