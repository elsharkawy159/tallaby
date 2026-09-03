import { and, eq, sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import {
  userWallets,
  userWalletTransactions,
  walletPayoutRequests,
} from "../drizzle/schema";

/**
 * Atomic primitives for the centralized user wallet.
 *
 * Financial invariants this file exists to hold:
 *
 *   1. `user_wallet_transactions` is the ledger and the source of truth.
 *      `user_wallets.balance` is a running total that ONLY this file moves.
 *   2. No read-then-write, anywhere. Every balance change is a single
 *      `UPDATE ... WHERE ... RETURNING`; the WHERE clause is the concurrency
 *      guard, so two simultaneous debits against the same wallet cannot both
 *      succeed past the available balance. Same discipline as
 *      ../inventory/stock.ts and ../coupons/claim.ts.
 *   3. `available = balance - reserved_balance`. A pending payout RESERVES
 *      funds; it never deducts them. Only completion debits.
 *   4. `balance_before` / `balance_after` come from the UPDATE's RETURNING
 *      value, never from a separate read, so they are always the true figures.
 *   5. `(type, reference_type, reference_id)` is a unique index in the database.
 *      A second attempt to apply the same domain event raises a unique
 *      violation, which surfaces here as DuplicateWalletTransactionError and
 *      rolls the caller's transaction back — so a retried webhook can never
 *      credit twice, and never credits partially.
 *   6. Money is a decimal string end to end. Never a JS number: 0.1 + 0.2 is
 *      not 0.3, and a wallet is not the place to find that out.
 *
 * Deliberately framework-free (no next/* import) so Vitest can exercise these
 * against a real Postgres instance without a Next.js runtime — see
 * user-wallet.integration.test.ts.
 */

/** The transaction callback's `tx` parameter type, derived from db.transaction itself. */
type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

/** Anything that can run a query: the pooled db or an open transaction. */
type Queryable = Tx | typeof dbType;

export type WalletTransactionType =
  | "top_up"
  | "payout"
  | "commission"
  | "order_payment"
  | "refund"
  | "adjustment"
  | "bonus";

export type WalletStatus = "active" | "frozen" | "closed";

/** Postgres unique-violation. */
const PG_UNIQUE_VIOLATION = "23505";

export class WalletNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`No wallet for user ${userId}`);
    this.name = "WalletNotFoundError";
  }
}

export class WalletNotActiveError extends Error {
  constructor(
    public readonly walletId: string,
    public readonly status: string
  ) {
    super(`Wallet ${walletId} is ${status}, not active`);
    this.name = "WalletNotActiveError";
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor(public readonly walletId: string) {
    super(`Insufficient available balance in wallet ${walletId}`);
    this.name = "InsufficientWalletBalanceError";
  }
}

export class DuplicateWalletTransactionError extends Error {
  constructor(
    public readonly type: WalletTransactionType,
    public readonly referenceType: string,
    public readonly referenceId: string
  ) {
    super(
      `Wallet transaction ${type} for ${referenceType}:${referenceId} already exists`
    );
    this.name = "DuplicateWalletTransactionError";
  }
}

export class InvalidWalletAmountError extends Error {
  constructor(value: unknown) {
    super(`Invalid wallet amount: ${String(value)}`);
    this.name = "InvalidWalletAmountError";
  }
}

/** numeric(10,2) tops out below 100,000,000. */
const MAX_WALLET_AMOUNT = 99_999_999.99;

/**
 * Normalizes a caller-supplied amount to the exact decimal string the database
 * column expects. Rejects NaN/Infinity, more than two decimal places, and
 * anything that would overflow numeric(10,2) — a silent overflow in a money
 * column is a corruption, not a rounding detail.
 *
 * Accepts a positive magnitude only; direction is expressed by the calling
 * function, not by the caller's sign.
 */
export function toWalletAmount(value: string | number): string {
  const numeric = typeof value === "string" ? Number(value) : value;

  if (typeof value === "string" && value.trim() === "") {
    throw new InvalidWalletAmountError(value);
  }
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new InvalidWalletAmountError(value);
  }
  if (numeric > MAX_WALLET_AMOUNT) {
    throw new InvalidWalletAmountError(value);
  }
  // Reject sub-cent precision rather than silently rounding someone's money.
  if (Math.abs(numeric * 100 - Math.round(numeric * 100)) > 1e-6) {
    throw new InvalidWalletAmountError(value);
  }

  return numeric.toFixed(2);
}

/** `"12.34"` -> `"-12.34"`. Operates on the normalized string, not a float. */
export function negateWalletAmount(amount: string): string {
  return amount.startsWith("-") ? amount.slice(1) : `-${amount}`;
}

export interface UserWalletRow {
  id: string;
  userId: string;
  balance: string;
  reservedBalance: string;
  currency: string;
  status: WalletStatus;
}

/**
 * Returns the user's wallet, creating it if the database trigger has not (rows
 * that predate migration 0025, or any path that inserts a user without firing
 * it). `ON CONFLICT DO NOTHING` makes concurrent callers safe: at most one row
 * can exist, and the loser simply reads it.
 */
export async function getOrCreateUserWallet(
  client: Queryable,
  userId: string
): Promise<UserWalletRow> {
  await client
    .insert(userWallets)
    .values({ userId })
    .onConflictDoNothing({ target: userWallets.userId });

  const wallet = await client.query.userWallets.findFirst({
    where: eq(userWallets.userId, userId),
    columns: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
      currency: true,
      status: true,
    },
  });

  if (!wallet) throw new WalletNotFoundError(userId);
  return wallet as UserWalletRow;
}

/**
 * The single atomic mutator every balance movement goes through.
 *
 * One UPDATE, no prior read. The WHERE clause enforces, at write time:
 *   - the wallet still exists and is active;
 *   - the resulting balance is not negative;
 *   - the resulting reservation is not negative;
 *   - the resulting reservation does not exceed the resulting balance
 *     (i.e. available stays >= 0, so reserved funds cannot be spent).
 *
 * Zero rows updated means one of those failed. Postgres serializes concurrent
 * updates to the same row, so N simultaneous debits for the last EGP cannot
 * both pass.
 */
async function applyBalanceDelta(
  tx: Tx,
  walletId: string,
  delta: string,
  reservedDelta: string
): Promise<string> {
  const [row] = await tx
    .update(userWallets)
    .set({
      balance: sql`${userWallets.balance} + ${delta}::numeric`,
      reservedBalance: sql`${userWallets.reservedBalance} + ${reservedDelta}::numeric`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(userWallets.id, walletId),
        eq(userWallets.status, "active"),
        sql`${userWallets.balance} + ${delta}::numeric >= 0`,
        sql`${userWallets.reservedBalance} + ${reservedDelta}::numeric >= 0`,
        sql`${userWallets.balance} + ${delta}::numeric >= ${userWallets.reservedBalance} + ${reservedDelta}::numeric`
      )
    )
    .returning({ balance: userWallets.balance });

  if (!row) {
    // Only on the failure path: classify why, so callers can tell "frozen"
    // from "not enough money". Cheap, and there is nothing left to race with.
    const current = await tx.query.userWallets.findFirst({
      where: eq(userWallets.id, walletId),
      columns: { id: true, status: true },
    });
    if (!current) throw new WalletNotFoundError(walletId);
    if (current.status !== "active") {
      throw new WalletNotActiveError(walletId, current.status);
    }
    throw new InsufficientWalletBalanceError(walletId);
  }

  return row.balance;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export interface PostWalletTransactionInput {
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  /** Positive magnitude. `direction` decides the sign. */
  amount: string;
  direction: "credit" | "debit";
  /**
   * Together with `type`, the idempotency key. Supply both whenever the
   * movement corresponds to a domain event that could be delivered twice
   * (a provider webhook, a queued job, a retried action).
   *
   * They must be supplied together or not at all — a database CHECK enforces
   * it, because a reference_id without a reference_type would slip past the
   * unique index (NULLs compare as distinct) and silently lose the guard.
   */
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  /**
   * Amount of reservation to release alongside the movement. Used when settling
   * a payout, where the debit and the release must happen in one statement —
   * releasing first would briefly expose the funds to a concurrent spend.
   */
  releaseReserved?: string;
}

export interface WalletTransactionRow {
  id: string;
  walletId: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
}

/**
 * Moves the balance and writes the matching ledger row, in that order, inside
 * the caller's transaction.
 *
 * If the ledger insert hits the idempotency index, the whole transaction is
 * doomed and the balance change goes with it — the wallet is never left
 * credited without a ledger row, and never credited twice. Callers that expect
 * duplicates (webhooks) should pre-check the reference for the happy path and
 * treat DuplicateWalletTransactionError as "already processed".
 */
export async function postWalletTransaction(
  tx: Tx,
  input: PostWalletTransactionInput
): Promise<WalletTransactionRow> {
  const magnitude = toWalletAmount(input.amount);
  const signed =
    input.direction === "credit" ? magnitude : negateWalletAmount(magnitude);
  const reservedDelta = input.releaseReserved
    ? negateWalletAmount(toWalletAmount(input.releaseReserved))
    : "0";

  const balanceAfter = await applyBalanceDelta(
    tx,
    input.walletId,
    signed,
    reservedDelta
  );

  // Derived from the authoritative post-update value, so it is exact even under
  // concurrency — a re-read could see another transaction's write. Subtracted
  // in integer cents rather than floats; the database's
  // `balance_after = balance_before + amount` CHECK is the backstop if this
  // ever drifts.
  const balanceBefore = (
    (Math.round(Number(balanceAfter) * 100) - Math.round(Number(signed) * 100)) /
    100
  ).toFixed(2);

  try {
    const [row] = await tx
      .insert(userWalletTransactions)
      .values({
        walletId: input.walletId,
        userId: input.userId,
        type: input.type,
        amount: signed,
        balanceBefore,
        balanceAfter,
        currency: "EGP",
        status: "completed",
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        description: input.description ?? null,
        metadata: input.metadata ?? null,
      })
      .returning({
        id: userWalletTransactions.id,
        walletId: userWalletTransactions.walletId,
        amount: userWalletTransactions.amount,
        balanceBefore: userWalletTransactions.balanceBefore,
        balanceAfter: userWalletTransactions.balanceAfter,
      });

    if (!row) throw new Error("Wallet transaction insert returned no row");
    return row;
  } catch (error) {
    if (isUniqueViolation(error) && input.referenceId) {
      throw new DuplicateWalletTransactionError(
        input.type,
        input.referenceType ?? "",
        input.referenceId
      );
    }
    throw error;
  }
}

/**
 * Holds funds against an open payout request. Writes no ledger row: the balance
 * has not moved, only its availability. Fails when available < amount.
 */
export async function reservePayoutAmount(
  tx: Tx,
  walletId: string,
  amount: string
): Promise<void> {
  await applyBalanceDelta(tx, walletId, "0", toWalletAmount(amount));
}

/** Frees a reservation whose payout was rejected, cancelled or failed. */
export async function releasePayoutReservation(
  tx: Tx,
  walletId: string,
  amount: string
): Promise<void> {
  await applyBalanceDelta(
    tx,
    walletId,
    "0",
    negateWalletAmount(toWalletAmount(amount))
  );
}

export interface SettlePayoutInput {
  walletId: string;
  userId: string;
  amount: string;
  payoutRequestId: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Completes a payout: debits the balance and releases the reservation in one
 * atomic step, then records the ledger row. Idempotent per payout request via
 * the ledger's (type, reference_type, reference_id) index.
 */
export async function settlePayout(
  tx: Tx,
  input: SettlePayoutInput
): Promise<WalletTransactionRow> {
  const amount = toWalletAmount(input.amount);

  return postWalletTransaction(tx, {
    walletId: input.walletId,
    userId: input.userId,
    type: "payout",
    amount,
    direction: "debit",
    releaseReserved: amount,
    referenceType: WALLET_REFERENCE_TYPES.payoutRequest,
    referenceId: input.payoutRequestId,
    description: input.description ?? "Wallet payout",
    metadata: input.metadata ?? null,
  });
}

/** Reference-type namespaces. Kept here so writers and readers cannot drift. */
export const WALLET_REFERENCE_TYPES = {
  topUp: "wallet_top_up",
  payoutRequest: "wallet_payout_request",
  order: "order",
  adminAdjustment: "admin_adjustment",
} as const;

/** Payout request statuses that hold a reservation on the wallet. */
export const OPEN_PAYOUT_STATUSES = [
  "pending",
  "approved",
  "processing",
] as const;

/**
 * Payment providers give us one reference field per payment (Paymob's
 * `special_reference`, surfaced back as `merchant_order_id`). Orders put their
 * raw uuid there, so wallet top-ups need a namespace that cannot be confused
 * with one — hence the prefix. Defined here, in the package both the storefront
 * (which writes the reference) and the backend webhook (which reads it) already
 * depend on, so the two can never drift apart.
 */
export const WALLET_TOP_UP_REFERENCE_PREFIX = "topup_";

export function buildTopUpReference(topUpId: string): string {
  return `${WALLET_TOP_UP_REFERENCE_PREFIX}${topUpId}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the top-up id when `reference` is one of ours, else null. Validates
 * the shape rather than trusting it: the value arrives from a provider payload.
 */
export function parseTopUpReference(
  reference: string | null | undefined
): string | null {
  if (!reference?.startsWith(WALLET_TOP_UP_REFERENCE_PREFIX)) return null;

  const id = reference.slice(WALLET_TOP_UP_REFERENCE_PREFIX.length);
  return UUID_PATTERN.test(id) ? id : null;
}

/**
 * Convenience read: the wallet plus its derived available balance. Not part of
 * any write path — callers that mutate must go through the primitives above.
 */
export async function getUserWalletSummary(
  client: Queryable,
  userId: string
): Promise<(UserWalletRow & { availableBalance: string }) | null> {
  const wallet = await client.query.userWallets.findFirst({
    where: eq(userWallets.userId, userId),
    columns: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
      currency: true,
      status: true,
    },
  });

  if (!wallet) return null;

  return {
    ...(wallet as UserWalletRow),
    availableBalance: (
      Number(wallet.balance) - Number(wallet.reservedBalance)
    ).toFixed(2),
  };
}

/** True when the user already has a payout request holding a reservation. */
export async function hasOpenPayoutRequest(
  client: Queryable,
  userId: string
): Promise<boolean> {
  const existing = await client.query.walletPayoutRequests.findFirst({
    where: and(
      eq(walletPayoutRequests.userId, userId),
      sql`${walletPayoutRequests.status} IN ('pending', 'approved', 'processing')`
    ),
    columns: { id: true },
  });

  return Boolean(existing);
}
