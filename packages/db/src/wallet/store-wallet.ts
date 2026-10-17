import { eq, sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { sellerWallet, sellers, walletTransactions } from "../drizzle/schema";

/**
 * The store wallet (PLAN.md §11.10, §13.4, P6-05): one signed wallet per
 * seller account on the existing seller ledger (`seller_wallet` +
 * `wallet_transactions`). It is NOT the customer `user_wallets` ledger.
 *
 * Invariants:
 *
 *   1. `postStoreWalletEntry` is the only code that changes a store-wallet
 *      balance (CLAUDE.md rule 7). `sellers.wallet_balance` is a mirror it
 *      keeps in the same transaction.
 *   2. The balance may go negative: fees are always posted. Only callers that
 *      pass `enforceNegativeLimit` (optional purchases) can be refused.
 *   3. Every entry has a (reference_type, reference_id) claim, unique per
 *      seller and type in the database. A replay raises
 *      DuplicateStoreWalletEntryError and changes nothing; the entry runs in
 *      a savepoint, so the caller's transaction stays usable.
 *   4. The balance moves in one `UPDATE … RETURNING`; balance_before/after
 *      come from it, never from a separate read.
 *   5. Amounts are decimal strings (2 dp). No JS floating point.
 */

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

export type StoreWalletEntryType =
  | "sale"
  | "fee"
  | "top_up"
  | "service_charge"
  | "withdrawal"
  | "adjustment"
  | "refund"
  | "fee_reversal";

export const STORE_WALLET_REFERENCE_TYPES = {
  order: "order",
  topUp: "top_up",
  adRequest: "ad_request",
  theme: "theme",
  payout: "payout",
  admin: "admin",
} as const;

export type StoreWalletReferenceType =
  (typeof STORE_WALLET_REFERENCE_TYPES)[keyof typeof STORE_WALLET_REFERENCE_TYPES];

/** Which way each type may move the balance. `adjustment` goes either way. */
const DIRECTION: Record<StoreWalletEntryType, "credit" | "debit" | "either"> = {
  sale: "credit",
  top_up: "credit",
  fee_reversal: "credit",
  fee: "debit",
  service_charge: "debit",
  withdrawal: "debit",
  refund: "debit",
  adjustment: "either",
};

const AMOUNT_RE = /^-?\d{1,8}(\.\d{1,2})?$/;

export class InvalidStoreWalletEntryError extends Error {
  constructor(message: string) {
    super(`Invalid store wallet entry: ${message}`);
    this.name = "InvalidStoreWalletEntryError";
  }
}

export class DuplicateStoreWalletEntryError extends Error {
  constructor(
    public readonly sellerId: string,
    public readonly type: StoreWalletEntryType,
    public readonly referenceType: string,
    public readonly referenceId: string
  ) {
    super(`Store wallet entry already posted: ${type} ${referenceType}:${referenceId} for seller ${sellerId}`);
    this.name = "DuplicateStoreWalletEntryError";
  }
}

export class StoreWalletNotActiveError extends Error {
  constructor(public readonly sellerId: string, public readonly status: string) {
    super(`Store wallet of seller ${sellerId} is ${status}, not active`);
    this.name = "StoreWalletNotActiveError";
  }
}

export class StoreWalletLimitError extends Error {
  constructor(public readonly sellerId: string) {
    super(`Store wallet of seller ${sellerId} would go past its negative limit`);
    this.name = "StoreWalletLimitError";
  }
}

export interface PostStoreWalletEntryInput {
  sellerId: string;
  type: StoreWalletEntryType;
  /** Signed decimal string, e.g. "120.50" or "-5.00". Never zero. */
  amount: string;
  referenceType: StoreWalletReferenceType;
  referenceId: string;
  storeId?: string | null;
  orderId?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  /** Optional purchases only: refuse if the balance would pass -negative_limit. Fees never set this. */
  enforceNegativeLimit?: boolean;
}

export interface StoreWalletEntryResult {
  entryId: string;
  balanceBefore: string;
  balanceAfter: string;
}

function validate(input: PostStoreWalletEntryInput): void {
  if (!AMOUNT_RE.test(input.amount) || /^-?0+(\.0+)?$/.test(input.amount)) {
    throw new InvalidStoreWalletEntryError(`amount ${input.amount}`);
  }
  const negative = input.amount.startsWith("-");
  const direction = DIRECTION[input.type];
  if (!direction) throw new InvalidStoreWalletEntryError(`type ${input.type}`);
  if ((direction === "credit" && negative) || (direction === "debit" && !negative)) {
    throw new InvalidStoreWalletEntryError(`${input.type} must be a ${direction}`);
  }
  if (!input.referenceId.trim()) throw new InvalidStoreWalletEntryError("empty reference");
}

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

/**
 * Posts one entry and moves the balance, inside the caller's transaction
 * (as a savepoint). See the invariants at the top of this file.
 */
export async function postStoreWalletEntry(
  tx: Tx,
  input: PostStoreWalletEntryInput
): Promise<StoreWalletEntryResult> {
  validate(input);
  const amount = sql`${input.amount}::numeric`;

  try {
    return await tx.transaction(async (sp) => {
      // Wallets are created lazily (sellers that never had an entry).
      await sp
        .insert(sellerWallet)
        .values({ sellerId: input.sellerId, balance: "0", currency: "EGP" })
        .onConflictDoNothing({ target: sellerWallet.sellerId });

      const limitGuard = input.enforceNegativeLimit
        ? sql`AND (${sellerWallet.negativeLimit} IS NULL OR ${sellerWallet.balance} + ${amount} >= -${sellerWallet.negativeLimit})`
        : sql``;

      const moved = await sp.execute<{ balance_before: string; balance_after: string }>(sql`
        UPDATE seller_wallet
           SET balance = balance + ${amount}, updated_at = now()
         WHERE seller_id = ${input.sellerId} AND status = 'active' ${limitGuard}
        RETURNING (balance - ${amount})::text AS balance_before, balance::text AS balance_after
      `);
      const row = moved[0];

      if (!row) {
        const [wallet] = await sp
          .select({ status: sellerWallet.status })
          .from(sellerWallet)
          .where(eq(sellerWallet.sellerId, input.sellerId));
        if (wallet && wallet.status !== "active") throw new StoreWalletNotActiveError(input.sellerId, wallet.status);
        throw new StoreWalletLimitError(input.sellerId);
      }

      const [entry] = await sp
        .insert(walletTransactions)
        .values({
          sellerId: input.sellerId,
          storeId: input.storeId ?? null,
          type: input.type,
          amount: input.amount,
          currency: "EGP",
          orderId: input.orderId ?? null,
          description: input.description,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          balanceBefore: row.balance_before,
          balanceAfter: row.balance_after,
          metadata: input.metadata ?? null,
          createdBy: input.createdBy ?? null,
        })
        .returning({ id: walletTransactions.id });

      await sp
        .update(sellers)
        .set({ walletBalance: row.balance_after, updatedAt: sql`now()` })
        .where(eq(sellers.id, input.sellerId));

      return { entryId: entry!.id, balanceBefore: row.balance_before, balanceAfter: row.balance_after };
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw new DuplicateStoreWalletEntryError(input.sellerId, input.type, input.referenceType, input.referenceId);
    }
    throw error;
  }
}

/** Posts an entry; a replay of the same reference is treated as already applied. */
export async function postStoreWalletEntryOnce(
  tx: Tx,
  input: PostStoreWalletEntryInput
): Promise<StoreWalletEntryResult | null> {
  try {
    return await postStoreWalletEntry(tx, input);
  } catch (error) {
    if (error instanceof DuplicateStoreWalletEntryError) return null;
    throw error;
  }
}

/** The balance and whether it equals the sum of the ledger (for checks and the wallet page). */
export async function getStoreWalletSummary(tx: Tx | typeof dbType, sellerId: string) {
  const [row] = await tx
    .select({
      balance: sellerWallet.balance,
      status: sellerWallet.status,
      negativeLimit: sellerWallet.negativeLimit,
      ledgerTotal: sql<string>`(SELECT coalesce(sum(t.amount), 0)::text FROM wallet_transactions t WHERE t.seller_id = ${sellerId})`,
    })
    .from(sellerWallet)
    .where(eq(sellerWallet.sellerId, sellerId));
  return row ?? null;
}
