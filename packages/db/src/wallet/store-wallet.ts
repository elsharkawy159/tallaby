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
 *   6. An amount is in the wallet's own currency (seller_wallet.currency, 0136).
 *      A caller that priced in one currency passes `currency`, and a wallet in
 *      the other one refuses the entry, so a fee can't land in the wrong money.
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
  /** The EGP 100 welcome gift (0119); reference id = seller id. */
  welcomeGift: "welcome_gift",
  /** Its expiry: the unspent part taken back after 30 days (0119). */
  welcomeGiftExpiry: "welcome_gift_expiry",
  /** A Pro plan period (0137); reference id = "<seller>:<period start>". */
  plan: "plan",
  /** A bought pack of AI credits (0137). */
  aiCredits: "ai_credits",
  /** A store app's charge (0139, F-47); reference id = appChargeReference(). */
  storeApp: "store_app",
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

/** Overdraft allowed for optional purchases when seller_wallet.negative_limit is NULL (D21). */
export const DEFAULT_NEGATIVE_LIMIT = "0";

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

export class StoreWalletCurrencyError extends Error {
  constructor(public readonly sellerId: string, public readonly expected: string, public readonly actual: string) {
    super(`Store wallet of seller ${sellerId} is in ${actual}, not ${expected}`);
    this.name = "StoreWalletCurrencyError";
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
  /** The currency this amount was priced in; a wallet in another currency refuses it. */
  currency?: "EGP" | "USD";
  /** Optional purchases only: refuse if the balance would pass -negative_limit (NULL = DEFAULT_NEGATIVE_LIMIT). Fees never set this. */
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
        // The column default picks the currency (billing_wallet_currency, 0136).
        .values({ sellerId: input.sellerId, balance: "0" })
        .onConflictDoNothing({ target: sellerWallet.sellerId });

      // D21: optional purchases may not take the balance below -negative_limit;
      // without a limit set by an admin, that is zero (no overdraft).
      const limitGuard = input.enforceNegativeLimit
        ? sql`AND balance + ${amount} >= -coalesce(negative_limit, ${DEFAULT_NEGATIVE_LIMIT}::numeric)`
        : sql``;

      const moved = await sp.execute<{ balance_before: string; balance_after: string; currency: string }>(sql`
        UPDATE seller_wallet
           SET balance = balance + ${amount}, updated_at = now()
         WHERE seller_id = ${input.sellerId} AND status = 'active' ${limitGuard}
        RETURNING (balance - ${amount})::text AS balance_before, balance::text AS balance_after, currency
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
      // Thrown inside the savepoint, so the balance move above rolls back.
      if (input.currency && row.currency !== input.currency) {
        throw new StoreWalletCurrencyError(input.sellerId, input.currency, row.currency);
      }

      const [entry] = await sp
        .insert(walletTransactions)
        .values({
          sellerId: input.sellerId,
          storeId: input.storeId ?? null,
          type: input.type,
          amount: input.amount,
          currency: row.currency,
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
      currency: sellerWallet.currency,
      // Only entries in the wallet's currency: a converted wallet's EGP rows net to zero (0136).
      // The table name is written out: drizzle drops it from a column in a single-table select.
      ledgerTotal: sql<string>`(SELECT coalesce(sum(t.amount), 0)::text FROM wallet_transactions t WHERE t.seller_id = ${sellerId} AND coalesce(t.currency, 'EGP') = seller_wallet.currency)`,
    })
    .from(sellerWallet)
    .where(eq(sellerWallet.sellerId, sellerId));
  return row ?? null;
}
