/**
 * The Tallaby Pay earnings ledger primitive (ROADMAP.md F-100a; design §4.3).
 * Server-only.
 *
 * Invariants this file exists to hold (CLAUDE.md rule 7):
 *
 *   1. `postTallabyPayEntry` is the ONLY code that changes a Tallaby Pay
 *      wallet's `pending`, `available` or `reserved`. It never touches the
 *      store wallet (seller_wallet / wallet_transactions) or user_wallets.
 *   2. One savepoint inside the caller's transaction: the wallet row is
 *      created on first use (INSERT … ON CONFLICT DO NOTHING) and locked
 *      (SELECT … FOR UPDATE), the balances move in one guarded
 *      `UPDATE … RETURNING`, and the entry records the *_after values that
 *      UPDATE returned. Anything that fails rolls the savepoint back, so the
 *      balances never move without their entry, and the caller's transaction
 *      stays usable.
 *   3. Idempotent: (kind, reference_type, reference_id) is unique. A replay of
 *      an applied event returns the existing entry with `replayed: true` and
 *      changes nothing; concurrent duplicates serialize on the wallet lock, so
 *      exactly one applies. The same key with different amounts or another
 *      wallet is a bug and throws TallabyPayEntryConflictError.
 *   4. Pending and reserved never go below zero. `available` may fall below
 *      `reserved` (and below zero) only through a refund or an adjustment
 *      (ledger.lib.ts `balanceViolation`, repeated in the UPDATE's WHERE).
 *   5. Tenant isolation (rule 5): the wallet is created only for a store whose
 *      `seller_id` is the given seller, and a wallet whose seller differs is
 *      refused. Callers still check the session's seller owns the store.
 *   6. Money is integer piastres; a 2 dp string appears only at the SQL
 *      boundary. No floats.
 */
import { db, sql } from "@workspace/db";

import { amountToPiastres, piastresToAmount } from "./fee.lib";
import {
  balanceViolation,
  mayPushAvailableNegative,
  tallabyPayEntryProblem,
  type TallabyPayEntryKind,
} from "./ledger.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export interface PostTallabyPayEntryInput {
  /** The store whose earnings move (never from the client). */
  storeId: string;
  /** The store's owner; must equal stores.seller_id. */
  sellerId: string;
  kind: TallabyPayEntryKind;
  /** Signed integer piastres; omitted = 0. */
  pendingPiastres?: number;
  availablePiastres?: number;
  reservedPiastres?: number;
  /** Required for sale / release / refund. Must belong to the same wallet (composite FK). */
  saleId?: string | null;
  /** Required for the payout kinds. Must belong to the same wallet (composite FK). */
  payoutId?: string | null;
  /** The claim: (kind, referenceType, referenceId) is applied once. */
  referenceType: string;
  referenceId: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Required for an adjustment; stored as metadata.reason. */
  reason?: string | null;
  createdBy?: string | null;
}

export interface TallabyPayEntryResult {
  entryId: string;
  walletId: string;
  kind: TallabyPayEntryKind;
  pendingAfter: string;
  availableAfter: string;
  reservedAfter: string;
  /** True when the claim already existed and nothing changed. */
  replayed: boolean;
}

export class InvalidTallabyPayEntryError extends Error {
  constructor(message: string) {
    super(`Invalid Tallaby Pay entry: ${message}`);
    this.name = "InvalidTallabyPayEntryError";
  }
}

export class TallabyPayStoreMismatchError extends Error {
  constructor(public readonly storeId: string, public readonly sellerId: string) {
    super(`Store ${storeId} is not a store of seller ${sellerId}`);
    this.name = "TallabyPayStoreMismatchError";
  }
}

export class TallabyPayBalanceError extends Error {
  constructor(public readonly storeId: string, public readonly bucket: "pending" | "reserved" | "available") {
    super(`Tallaby Pay entry would break the ${bucket} balance of store ${storeId}`);
    this.name = "TallabyPayBalanceError";
  }
}

export class TallabyPayWalletFrozenError extends Error {
  constructor(public readonly storeId: string) {
    super(`Tallaby Pay wallet of store ${storeId} is frozen`);
    this.name = "TallabyPayWalletFrozenError";
  }
}

export class TallabyPayEntryConflictError extends Error {
  constructor(public readonly kind: string, public readonly referenceType: string, public readonly referenceId: string) {
    super(`Tallaby Pay claim ${kind} ${referenceType}:${referenceId} already exists with other amounts or another wallet`);
    this.name = "TallabyPayEntryConflictError";
  }
}

/** Thrown inside the savepoint when the entry insert lost a race, to roll the balance move back. */
class LostClaimRace extends Error {}

type WalletRow = {
  id: string;
  seller_id: string;
  status: string;
  pending: string;
  available: string;
  reserved: string;
};

type EntryRow = {
  id: string;
  wallet_id: string;
  kind: TallabyPayEntryKind;
  pending_delta: string;
  available_delta: string;
  reserved_delta: string;
  pending_after: string;
  available_after: string;
  reserved_after: string;
};

const ENTRY_COLUMNS = sql`id, wallet_id, kind, pending_delta::text, available_delta::text, reserved_delta::text,
  pending_after::text, available_after::text, reserved_after::text`;

function toResult(row: EntryRow, replayed: boolean): TallabyPayEntryResult {
  return {
    entryId: row.id,
    walletId: row.wallet_id,
    kind: row.kind,
    pendingAfter: row.pending_after,
    availableAfter: row.available_after,
    reservedAfter: row.reserved_after,
    replayed,
  };
}

async function findClaim(q: Queryable, input: PostTallabyPayEntryInput): Promise<EntryRow | undefined> {
  const rows = await q.execute<EntryRow>(sql`
    SELECT ${ENTRY_COLUMNS} FROM tallaby_pay_entries
     WHERE kind = ${input.kind} AND reference_type = ${input.referenceType} AND reference_id = ${input.referenceId}
  `);
  return rows[0];
}

/** A replay must be the same event: same wallet, same moves. Anything else is a reused key. */
function assertSameEvent(row: EntryRow, walletId: string | null, d: { p: number; a: number; r: number }, input: PostTallabyPayEntryInput) {
  const same =
    (walletId === null || row.wallet_id === walletId) &&
    amountToPiastres(row.pending_delta) === d.p &&
    amountToPiastres(row.available_delta) === d.a &&
    amountToPiastres(row.reserved_delta) === d.r;
  if (!same) throw new TallabyPayEntryConflictError(input.kind, input.referenceType, input.referenceId);
}

/** Creates the store's wallet on first use, only when the store belongs to this seller. */
async function insertWalletIfOwned(q: Queryable, storeId: string, sellerId: string): Promise<void> {
  await q.execute(sql`
    INSERT INTO tallaby_pay_wallets (store_id, seller_id)
    SELECT s.id, s.seller_id FROM stores s WHERE s.id = ${storeId} AND s.seller_id = ${sellerId}
    ON CONFLICT (store_id) DO NOTHING
  `);
}

/**
 * The store's Tallaby Pay wallet id, creating the wallet on first use (the
 * sale row needs it before its `sale` entry is posted). Moves no balance.
 * Throws TallabyPayStoreMismatchError unless the store belongs to the seller.
 */
export async function ensureTallabyPayWallet(q: Queryable, storeId: string, sellerId: string): Promise<string> {
  const seller = sellerId.toLowerCase();
  await insertWalletIfOwned(q, storeId, seller);
  const [wallet] = await q.execute<{ id: string; seller_id: string }>(sql`
    SELECT id, seller_id FROM tallaby_pay_wallets WHERE store_id = ${storeId}
  `);
  if (!wallet || wallet.seller_id !== seller) throw new TallabyPayStoreMismatchError(storeId, sellerId);
  return wallet.id;
}

/**
 * Posts one ledger entry and moves the store's Tallaby Pay balances, inside
 * the caller's transaction (as a savepoint). See the invariants above.
 */
export async function postTallabyPayEntry(q: Queryable, input: PostTallabyPayEntryInput): Promise<TallabyPayEntryResult> {
  const d = { p: input.pendingPiastres ?? 0, a: input.availablePiastres ?? 0, r: input.reservedPiastres ?? 0 };
  const problem = tallabyPayEntryProblem({
    kind: input.kind,
    pending: d.p,
    available: d.a,
    reserved: d.r,
    saleId: input.saleId ?? null,
    payoutId: input.payoutId ?? null,
    reason: input.reason ?? null,
  });
  if (problem) throw new InvalidTallabyPayEntryError(problem);
  if (!input.referenceType.trim() || !input.referenceId.trim()) throw new InvalidTallabyPayEntryError("empty reference");
  const sellerId = input.sellerId.toLowerCase();

  try {
    return await q.transaction(async (sp) => {
      await insertWalletIfOwned(sp, input.storeId, sellerId);
      const [wallet] = await sp.execute<WalletRow>(sql`
        SELECT id, seller_id, status, pending::text, available::text, reserved::text
          FROM tallaby_pay_wallets WHERE store_id = ${input.storeId}
           FOR UPDATE
      `);
      if (!wallet || wallet.seller_id !== sellerId) throw new TallabyPayStoreMismatchError(input.storeId, input.sellerId);

      // Replays serialize on the lock above, so this read sees a committed claim.
      const existing = await findClaim(sp, input);
      if (existing) {
        assertSameEvent(existing, wallet.id, d, input);
        return toResult(existing, true);
      }

      if (input.kind === "payout_reserve" && wallet.status !== "active") throw new TallabyPayWalletFrozenError(input.storeId);

      const bucket = balanceViolation(
        { pending: amountToPiastres(wallet.pending), available: amountToPiastres(wallet.available), reserved: amountToPiastres(wallet.reserved) },
        { pending: d.p, available: d.a, reserved: d.r },
        input.kind,
      );
      if (bucket) throw new TallabyPayBalanceError(input.storeId, bucket);

      const p = sql`${piastresToAmount(d.p)}::numeric`;
      const a = sql`${piastresToAmount(d.a)}::numeric`;
      const r = sql`${piastresToAmount(d.r)}::numeric`;
      // Same rule as balanceViolation; the database re-checks it under the lock.
      const skipFreeCheck = mayPushAvailableNegative(input.kind) || !(d.a < 0 || d.r > 0);
      const [moved] = await sp.execute<{ pending: string; available: string; reserved: string }>(sql`
        UPDATE tallaby_pay_wallets
           SET pending = pending + ${p}, available = available + ${a}, reserved = reserved + ${r}, updated_at = now()
         WHERE id = ${wallet.id}
           AND pending + ${p} >= 0
           AND reserved + ${r} >= 0
           AND (${skipFreeCheck}::boolean OR available + ${a} >= reserved + ${r})
        RETURNING pending::text, available::text, reserved::text
      `);
      if (!moved) throw new TallabyPayBalanceError(input.storeId, "available");

      const metadata =
        input.kind === "adjustment" ? { ...(input.metadata ?? {}), reason: input.reason!.trim() } : (input.metadata ?? null);
      const [entry] = await sp.execute<EntryRow>(sql`
        INSERT INTO tallaby_pay_entries (
          wallet_id, store_id, seller_id, sale_id, payout_id, kind,
          pending_delta, available_delta, reserved_delta,
          pending_after, available_after, reserved_after,
          reference_type, reference_id, description, metadata, created_by
        ) VALUES (
          ${wallet.id}, ${input.storeId}, ${sellerId}, ${input.saleId ?? null}, ${input.payoutId ?? null}, ${input.kind},
          ${p}, ${a}, ${r},
          ${moved.pending}::numeric, ${moved.available}::numeric, ${moved.reserved}::numeric,
          ${input.referenceType}, ${input.referenceId}, ${input.description ?? null},
          ${metadata === null ? null : JSON.stringify(metadata)}::jsonb, ${input.createdBy ?? null}
        )
        ON CONFLICT (kind, reference_type, reference_id) DO NOTHING
        RETURNING ${ENTRY_COLUMNS}
      `);
      if (!entry) throw new LostClaimRace();
      return toResult(entry, false);
    });
  } catch (error) {
    if (!(error instanceof LostClaimRace)) throw error;
    // The claim was taken outside this wallet's lock: the savepoint rolled the
    // balance move back. Same event → a replay; anything else → a reused key.
    const existing = await findClaim(q, input);
    if (!existing) throw new TallabyPayEntryConflictError(input.kind, input.referenceType, input.referenceId);
    assertSameEvent(existing, null, d, input);
    return toResult(existing, true);
  }
}

export interface TallabyPayLedgerTotals {
  walletId: string;
  pending: string;
  available: string;
  reserved: string;
  /** Σ of the entries' deltas; equal to the balances while the ledger is sound. */
  ledgerPending: string;
  ledgerAvailable: string;
  ledgerReserved: string;
}

/**
 * The store's balances next to the sums of its ledger (Admin checks and the
 * integration tests). Never cached (rule 8). The caller has already checked
 * the store belongs to the session's seller, or is a platform admin.
 */
export async function getTallabyPayLedgerTotals(q: Queryable, storeId: string): Promise<TallabyPayLedgerTotals | null> {
  const [row] = await q.execute<{
    wallet_id: string;
    pending: string;
    available: string;
    reserved: string;
    ledger_pending: string;
    ledger_available: string;
    ledger_reserved: string;
  }>(sql`
    SELECT w.id AS wallet_id, w.pending::text, w.available::text, w.reserved::text,
           coalesce(sum(e.pending_delta), 0)::numeric(12,2)::text AS ledger_pending,
           coalesce(sum(e.available_delta), 0)::numeric(12,2)::text AS ledger_available,
           coalesce(sum(e.reserved_delta), 0)::numeric(12,2)::text AS ledger_reserved
      FROM tallaby_pay_wallets w
      LEFT JOIN tallaby_pay_entries e ON e.wallet_id = w.id
     WHERE w.store_id = ${storeId}
     GROUP BY w.id
  `);
  if (!row) return null;
  return {
    walletId: row.wallet_id,
    pending: row.pending,
    available: row.available,
    reserved: row.reserved,
    ledgerPending: row.ledger_pending,
    ledgerAvailable: row.ledger_available,
    ledgerReserved: row.ledger_reserved,
  };
}
