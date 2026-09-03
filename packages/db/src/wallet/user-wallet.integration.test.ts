import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import {
  DuplicateWalletTransactionError,
  InsufficientWalletBalanceError,
  InvalidWalletAmountError,
  WalletNotActiveError,
  WALLET_REFERENCE_TYPES,
  getOrCreateUserWallet,
  getUserWalletSummary,
  hasOpenPayoutRequest,
  postWalletTransaction,
  releasePayoutReservation,
  reservePayoutAmount,
  settlePayout,
  toWalletAmount,
} from "./user-wallet";

// Mirrors packages/db/src/drizzle/database.ts's schema merge exactly — the
// production db.transaction()'s `tx` type only structurally matches this
// merged shape (schema + relations), not the raw schema module alone.
// Built locally rather than importing database.ts itself, which opens a
// connection to DATABASE_URL as a side effect of import.
const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Integration tests against a REAL Postgres instance — these exercise the
 * actual financial guarantees (atomic UPDATE ... WHERE, CHECK constraints, the
 * idempotency index, the append-only trigger) that cannot be verified against a
 * mock. Skipped entirely when TEST_DATABASE_URL is not set.
 *
 * Point TEST_DATABASE_URL at a disposable database — this suite creates and
 * deletes real rows in users, user_wallets, user_wallet_transactions and
 * wallet_payout_requests. Never point it at production.
 *
 * Setting up a scratch database:
 *   1. createdb tallaby_wallet_test
 *   2. Apply the schema it needs (at minimum the `users` table and migration
 *      0025_user_wallet.sql).
 *   3. On a plain Postgres there is no Supabase `auth` schema, so 0025's RLS
 *      policies cannot resolve auth.uid(). Create a stub first:
 *        CREATE SCHEMA IF NOT EXISTS auth;
 *        CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
 *          LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
 *      The policies themselves are not exercised here — Drizzle connects as the
 *      database owner and bypasses RLS, exactly as the apps do. RLS is verified
 *      separately with the anon key against Supabase.
 *   4. TEST_DATABASE_URL=postgres://... pnpm --filter @workspace/db test
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("user wallet ledger (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused");
  const db = drizzle(client, { schema });

  const createdUserIds: string[] = [];

  /** A registered (non-guest) user, which the 0025 trigger auto-provisions. */
  async function makeUser(overrides: { isGuest?: boolean } = {}) {
    const id = randomUUID();
    await db.insert(schema.users).values({
      id,
      email: `wallet-test-${id}@example.com`,
      fullName: "Wallet Test User",
      isGuest: overrides.isGuest ?? false,
    });
    createdUserIds.push(id);
    return id;
  }

  async function makeFundedWallet(amount: string) {
    const userId = await makeUser();
    const wallet = await getOrCreateUserWallet(db, userId);
    await db.transaction((tx) =>
      postWalletTransaction(tx, {
        walletId: wallet.id,
        userId,
        type: "adjustment",
        amount,
        direction: "credit",
        referenceType: WALLET_REFERENCE_TYPES.adminAdjustment,
        referenceId: randomUUID(),
        description: "Test funding",
      })
    );
    return { userId, walletId: wallet.id };
  }

  async function readWallet(walletId: string) {
    const [row] = await db
      .select({
        balance: schema.userWallets.balance,
        reservedBalance: schema.userWallets.reservedBalance,
      })
      .from(schema.userWallets)
      .where(eq(schema.userWallets.id, walletId));
    return row;
  }

  async function countLedgerRows(walletId: string): Promise<number> {
    const rows = await db.execute<{ count: string }>(
      sql`select count(*)::text as count from user_wallet_transactions where wallet_id = ${walletId}`
    );
    return Number(rows[0]?.count ?? 0);
  }

  beforeAll(async () => {
    // Fail loudly rather than silently passing against a database without 0025.
    const [applied] = await db.execute<{ exists: boolean }>(
      sql`select to_regclass('public.user_wallets') is not null as exists`
    );
    if (!applied?.exists) {
      throw new Error(
        "TEST_DATABASE_URL is missing migration 0025_user_wallet.sql"
      );
    }
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      // user_wallets / transactions / payout requests all cascade from users.
      await db.delete(schema.users).where(eq(schema.users.id, id));
    }
    await client.end();
  });

  // -------------------------------------------------------------------------
  // Provisioning
  // -------------------------------------------------------------------------

  it("auto-provisions exactly one wallet for a new registered user", async () => {
    const userId = await makeUser();

    const wallets = await db
      .select({ id: schema.userWallets.id, balance: schema.userWallets.balance })
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, userId));

    expect(wallets).toHaveLength(1);
    expect(Number(wallets[0]?.balance)).toBe(0);
  });

  it("does not provision a wallet for a guest, and provisions one on conversion", async () => {
    const guestId = await makeUser({ isGuest: true });

    let wallets = await db
      .select({ id: schema.userWallets.id })
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, guestId));
    expect(wallets).toHaveLength(0);

    await db
      .update(schema.users)
      .set({ isGuest: false })
      .where(eq(schema.users.id, guestId));

    wallets = await db
      .select({ id: schema.userWallets.id })
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, guestId));
    expect(wallets).toHaveLength(1);
  });

  it("getOrCreateUserWallet is idempotent under concurrency", async () => {
    const guestId = await makeUser({ isGuest: true }); // no trigger-created wallet

    const results = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateUserWallet(db, guestId))
    );

    const ids = new Set(results.map((w) => w.id));
    expect(ids.size).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Ledger correctness
  // -------------------------------------------------------------------------

  it("records accurate balance_before and balance_after across a credit and a debit", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");

    await db.transaction((tx) =>
      postWalletTransaction(tx, {
        walletId,
        userId,
        type: "order_payment",
        amount: "30.50",
        direction: "debit",
        referenceType: WALLET_REFERENCE_TYPES.order,
        referenceId: randomUUID(),
      })
    );

    const rows = await db
      .select({
        amount: schema.userWalletTransactions.amount,
        direction: schema.userWalletTransactions.direction,
        before: schema.userWalletTransactions.balanceBefore,
        after: schema.userWalletTransactions.balanceAfter,
      })
      .from(schema.userWalletTransactions)
      .where(eq(schema.userWalletTransactions.walletId, walletId))
      .orderBy(schema.userWalletTransactions.createdAt);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      amount: "100.00",
      direction: "credit",
      before: "0.00",
      after: "100.00",
    });
    expect(rows[1]).toMatchObject({
      amount: "-30.50",
      direction: "debit",
      before: "100.00",
      after: "69.50",
    });

    expect((await readWallet(walletId))?.balance).toBe("69.50");
  });

  it("refuses a debit larger than the available balance and leaves the balance untouched", async () => {
    const { userId, walletId } = await makeFundedWallet("50.00");

    await expect(
      db.transaction((tx) =>
        postWalletTransaction(tx, {
          walletId,
          userId,
          type: "order_payment",
          amount: "50.01",
          direction: "debit",
          referenceType: WALLET_REFERENCE_TYPES.order,
          referenceId: randomUUID(),
        })
      )
    ).rejects.toBeInstanceOf(InsufficientWalletBalanceError);

    expect((await readWallet(walletId))?.balance).toBe("50.00");
  });

  it("refuses any movement on a wallet that is not active", async () => {
    const { userId, walletId } = await makeFundedWallet("50.00");
    await db
      .update(schema.userWallets)
      .set({ status: "frozen" })
      .where(eq(schema.userWallets.id, walletId));

    await expect(
      db.transaction((tx) =>
        postWalletTransaction(tx, {
          walletId,
          userId,
          type: "bonus",
          amount: "5.00",
          direction: "credit",
          referenceType: WALLET_REFERENCE_TYPES.adminAdjustment,
          referenceId: randomUUID(),
        })
      )
    ).rejects.toBeInstanceOf(WalletNotActiveError);

    expect((await readWallet(walletId))?.balance).toBe("50.00");
  });

  it("the non-negative CHECK rejects a raw write that would drive the balance negative", async () => {
    const { walletId } = await makeFundedWallet("10.00");

    await expect(
      db.execute(
        sql`update user_wallets set balance = balance - 100 where id = ${walletId}`
      )
    ).rejects.toThrow();
  });

  it("the reserved-within-balance CHECK rejects a raw write that would over-reserve", async () => {
    const { walletId } = await makeFundedWallet("10.00");

    await expect(
      db.execute(
        sql`update user_wallets set reserved_balance = 25 where id = ${walletId}`
      )
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Concurrency
  // -------------------------------------------------------------------------

  it("exactly one of N concurrent debits succeeds when only one is affordable", async () => {
    const { userId, walletId } = await makeFundedWallet("10.00");
    const attempts = 5;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        db.transaction((tx) =>
          postWalletTransaction(tx, {
            walletId,
            userId,
            type: "order_payment",
            amount: "10.00",
            direction: "debit",
            referenceType: WALLET_REFERENCE_TYPES.order,
            referenceId: randomUUID(),
          })
        )
      )
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const failure of results.filter((r) => r.status === "rejected")) {
      expect((failure as PromiseRejectedResult).reason).toBeInstanceOf(
        InsufficientWalletBalanceError
      );
    }

    expect((await readWallet(walletId))?.balance).toBe("0.00");
  });

  it("N concurrent credits sum exactly — no lost update", async () => {
    const { userId, walletId } = await makeFundedWallet("0.01");
    const attempts = 20;

    await Promise.all(
      Array.from({ length: attempts }, () =>
        db.transaction((tx) =>
          postWalletTransaction(tx, {
            walletId,
            userId,
            type: "bonus",
            amount: "1.00",
            direction: "credit",
            referenceType: WALLET_REFERENCE_TYPES.adminAdjustment,
            referenceId: randomUUID(),
          })
        )
      )
    );

    expect((await readWallet(walletId))?.balance).toBe("20.01");

    expect(await countLedgerRows(walletId)).toBe(attempts + 1);
  });

  // -------------------------------------------------------------------------
  // Idempotency
  // -------------------------------------------------------------------------

  it("refuses a duplicate (type, reference) and does not double-credit", async () => {
    const { userId, walletId } = await makeFundedWallet("0.01");
    const referenceId = randomUUID();

    const credit = () =>
      db.transaction((tx) =>
        postWalletTransaction(tx, {
          walletId,
          userId,
          type: "top_up",
          amount: "500.00",
          direction: "credit",
          referenceType: WALLET_REFERENCE_TYPES.topUp,
          referenceId,
        })
      );

    await credit();
    await expect(credit()).rejects.toBeInstanceOf(
      DuplicateWalletTransactionError
    );

    expect((await readWallet(walletId))?.balance).toBe("500.01");
  });

  it("concurrent deliveries of the same event credit exactly once", async () => {
    const { userId, walletId } = await makeFundedWallet("0.01");
    const referenceId = randomUUID();

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        db.transaction((tx) =>
          postWalletTransaction(tx, {
            walletId,
            userId,
            type: "top_up",
            amount: "100.00",
            direction: "credit",
            referenceType: WALLET_REFERENCE_TYPES.topUp,
            referenceId,
          })
        )
      )
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await readWallet(walletId))?.balance).toBe("100.01");
  });

  it("a failure later in the caller's transaction rolls the balance movement fully back", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");

    await expect(
      db.transaction(async (tx) => {
        await postWalletTransaction(tx, {
          walletId,
          userId,
          type: "order_payment",
          amount: "40.00",
          direction: "debit",
          referenceType: WALLET_REFERENCE_TYPES.order,
          referenceId: randomUUID(),
        });
        throw new Error("downstream step failed");
      })
    ).rejects.toThrow("downstream step failed");

    expect((await readWallet(walletId))?.balance).toBe("100.00");

    expect(await countLedgerRows(walletId)).toBe(1); // only the funding row survives
  });

  // -------------------------------------------------------------------------
  // Reservations and payout settlement
  // -------------------------------------------------------------------------

  it("reserving holds funds without moving the balance, and blocks spending them", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");

    await db.transaction((tx) => reservePayoutAmount(tx, walletId, "80.00"));

    const wallet = await readWallet(walletId);
    expect(wallet?.balance).toBe("100.00");
    expect(wallet?.reservedBalance).toBe("80.00");

    const summary = await getUserWalletSummary(db, userId);
    expect(summary?.availableBalance).toBe("20.00");

    await expect(
      db.transaction((tx) =>
        postWalletTransaction(tx, {
          walletId,
          userId,
          type: "order_payment",
          amount: "25.00",
          direction: "debit",
          referenceType: WALLET_REFERENCE_TYPES.order,
          referenceId: randomUUID(),
        })
      )
    ).rejects.toBeInstanceOf(InsufficientWalletBalanceError);
  });

  it("cannot reserve more than the available balance", async () => {
    const { walletId } = await makeFundedWallet("100.00");
    await db.transaction((tx) => reservePayoutAmount(tx, walletId, "60.00"));

    await expect(
      db.transaction((tx) => reservePayoutAmount(tx, walletId, "41.00"))
    ).rejects.toBeInstanceOf(InsufficientWalletBalanceError);

    expect((await readWallet(walletId))?.reservedBalance).toBe("60.00");
  });

  it("releasing a reservation restores availability without a ledger row", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");
    await db.transaction((tx) => reservePayoutAmount(tx, walletId, "40.00"));
    await db.transaction((tx) =>
      releasePayoutReservation(tx, walletId, "40.00")
    );

    const wallet = await readWallet(walletId);
    expect(wallet?.balance).toBe("100.00");
    expect(wallet?.reservedBalance).toBe("0.00");

    expect(await countLedgerRows(walletId)).toBe(1);
  });

  it("settling a payout debits and releases in one step, and is idempotent", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");
    const payoutRequestId = randomUUID();

    await db.transaction((tx) => reservePayoutAmount(tx, walletId, "60.00"));
    await db.transaction((tx) =>
      settlePayout(tx, { walletId, userId, amount: "60.00", payoutRequestId })
    );

    const wallet = await readWallet(walletId);
    expect(wallet?.balance).toBe("40.00");
    expect(wallet?.reservedBalance).toBe("0.00");

    await expect(
      db.transaction((tx) =>
        settlePayout(tx, { walletId, userId, amount: "60.00", payoutRequestId })
      )
    ).rejects.toBeInstanceOf(DuplicateWalletTransactionError);

    expect((await readWallet(walletId))?.balance).toBe("40.00");
  });

  // -------------------------------------------------------------------------
  // Auditability
  // -------------------------------------------------------------------------

  it("the ledger is append-only — UPDATE and DELETE are rejected", async () => {
    const { walletId } = await makeFundedWallet("25.00");

    await expect(
      db.execute(
        sql`update user_wallet_transactions set amount = 9999 where wallet_id = ${walletId}`
      )
    ).rejects.toThrow();

    await expect(
      db.execute(
        sql`delete from user_wallet_transactions where wallet_id = ${walletId}`
      )
    ).rejects.toThrow();

    expect(await countLedgerRows(walletId)).toBe(1);
  });

  it("rejects a reference_id without a reference_type, which would bypass the idempotency index", async () => {
    const { walletId } = await makeFundedWallet("10.00");

    await expect(
      db.execute(
        sql`insert into user_wallet_transactions
              (wallet_id, user_id, type, amount, balance_before, balance_after, reference_id)
            select ${walletId}, user_id, 'bonus', 1, balance, balance + 1, gen_random_uuid()
            from user_wallets where id = ${walletId}`
      )
    ).rejects.toThrow();
  });

  it("allows at most one open payout request per user", async () => {
    const { userId, walletId } = await makeFundedWallet("100.00");

    await db.insert(schema.walletPayoutRequests).values({
      walletId,
      userId,
      amount: "10.00",
      method: "bank_transfer",
    });

    expect(await hasOpenPayoutRequest(db, userId)).toBe(true);

    await expect(
      db.insert(schema.walletPayoutRequests).values({
        walletId,
        userId,
        amount: "5.00",
        method: "bank_transfer",
      })
    ).rejects.toThrow();

    // A settled request frees the slot.
    await db
      .update(schema.walletPayoutRequests)
      .set({ status: "rejected" })
      .where(
        and(
          eq(schema.walletPayoutRequests.userId, userId),
          eq(schema.walletPayoutRequests.status, "pending")
        )
      );

    expect(await hasOpenPayoutRequest(db, userId)).toBe(false);
    await db.insert(schema.walletPayoutRequests).values({
      walletId,
      userId,
      amount: "5.00",
      method: "bank_transfer",
    });
  });

  // -------------------------------------------------------------------------
  // Amount handling (no DB needed, but kept here beside what it protects)
  // -------------------------------------------------------------------------

  it("rejects amounts a money column cannot represent", () => {
    expect(toWalletAmount("10.5")).toBe("10.50");
    expect(toWalletAmount(10)).toBe("10.00");
    expect(() => toWalletAmount("0")).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount(-5)).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount("abc")).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount("")).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount(Number.NaN)).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount("10.005")).toThrow(InvalidWalletAmountError);
    expect(() => toWalletAmount(1e12)).toThrow(InvalidWalletAmountError);
  });
});
