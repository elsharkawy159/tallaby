import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

import { splitTallabyPay, piastresToAmount } from "./fee.lib";

/**
 * Tallaby Pay ledger primitive (F-100a) against a Postgres with 0175 applied.
 * Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows
 * (deleting the test users cascades through sellers to the wallets).
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type LedgerModule = typeof import("./ledger.server");
type AppDbModule = typeof import("@workspace/db");

describe.skipIf(!TEST_DATABASE_URL)("Tallaby Pay ledger (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 8 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  let ledger: LedgerModule;
  let app: AppDbModule;
  let saleCount = 0;

  async function makeStore() {
    const sellerId = randomUUID();
    const sub = `tp-${tag}-${created.length}`;
    await createAuthUsers(sellerId);
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    created.push(sellerId);
    // Plain SQL: only the columns it sets, so a later unrelated sellers column never breaks it.
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address,
        support_email, status)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb,
        ${`${sub}@example.com`}, 'approved')
    `);
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, sellerId));
    return { sellerId, storeId: store!.id };
  }

  type Store = Awaited<ReturnType<typeof makeStore>>;

  /** A paid sale row (what the callback writes), returning its net in piastres. */
  async function newSale(store: Store, grossPiastres: number) {
    const walletId = await ledger.ensureTallabyPayWallet(app.db, store.storeId, store.sellerId);
    const { feePiastres, netPiastres } = splitTallabyPay(grossPiastres, 300);
    const [row] = await db.execute<{ id: string }>(sql`
      INSERT INTO tallaby_pay_sales (wallet_id, store_id, seller_id, easykash_ref, gross, fee, net, fee_bps, hold_days, paid_at)
      VALUES (${walletId}, ${store.storeId}, ${store.sellerId}, ${`tpay-it-${tag}-${saleCount++}`},
        ${piastresToAmount(grossPiastres)}::numeric, ${piastresToAmount(feePiastres)}::numeric,
        ${piastresToAmount(netPiastres)}::numeric, 300, 0, now())
      RETURNING id
    `);
    return { id: row!.id, net: netPiastres, walletId };
  }

  async function newPayout(store: Store, walletId: string, amountPiastres: number) {
    const [row] = await db.execute<{ id: string }>(sql`
      INSERT INTO tallaby_pay_payouts (wallet_id, store_id, seller_id, amount, method, destination)
      VALUES (${walletId}, ${store.storeId}, ${store.sellerId}, ${piastresToAmount(amountPiastres)}::numeric,
        'instapay', '{"address":"test@instapay"}'::jsonb)
      RETURNING id
    `);
    return row!.id;
  }

  type Input = Parameters<LedgerModule["postTallabyPayEntry"]>[1];
  const post = (store: Store, input: Omit<Input, "storeId" | "sellerId">) =>
    app.db.transaction((tx) => ledger.postTallabyPayEntry(tx, { storeId: store.storeId, sellerId: store.sellerId, ...input }));

  const saleEntry = (sale: { id: string; net: number }) =>
    ({ kind: "sale", pendingPiastres: sale.net, saleId: sale.id, referenceType: "sale", referenceId: sale.id }) as const;
  const releaseEntry = (sale: { id: string; net: number }) =>
    ({
      kind: "release",
      pendingPiastres: -sale.net,
      availablePiastres: sale.net,
      saleId: sale.id,
      referenceType: "sale",
      referenceId: sale.id,
    }) as const;

  async function balances(store: Store) {
    const totals = await ledger.getTallabyPayLedgerTotals(app.db, store.storeId);
    return totals!;
  }

  /** The ledger sums equal the balances (design §4.5). */
  async function expectLedgerMatches(store: Store) {
    const t = await balances(store);
    expect(t.ledgerPending).toBe(t.pending);
    expect(t.ledgerAvailable).toBe(t.available);
    expect(t.ledgerReserved).toBe(t.reserved);
    return t;
  }

  const entryCount = async (store: Store) => {
    const [row] = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM tallaby_pay_entries WHERE store_id = ${store.storeId}`,
    );
    return row!.n;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ledger = await import("./ledger.server");
    app = await import("@workspace/db");
  }, 120_000);

  afterAll(async () => {
    if (created.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  }, 120_000);

  it("credits a sale to pending once; a replay returns the same entry and changes nothing", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    const first = await post(store, saleEntry(sale));
    expect(first).toMatchObject({ replayed: false, pendingAfter: "97.00", availableAfter: "0.00", reservedAfter: "0.00" });

    const replay = await post(store, saleEntry(sale));
    expect(replay).toMatchObject({ replayed: true, entryId: first.entryId });
    expect(await entryCount(store)).toBe(1);
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "97.00", available: "0.00" });
  });

  it("applies concurrent duplicates exactly once", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 25_000);
    const results = await Promise.all(Array.from({ length: 6 }, () => post(store, saleEntry(sale))));
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(new Set(results.map((r) => r.entryId)).size).toBe(1);
    expect(await entryCount(store)).toBe(1);
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "242.50" });
  });

  it("refuses the same claim with other amounts", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    await post(store, saleEntry(sale));
    await expect(post(store, { ...saleEntry(sale), pendingPiastres: sale.net + 1 })).rejects.toBeInstanceOf(
      ledger.TallabyPayEntryConflictError,
    );
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "97.00" });
  });

  it("releases pending to available, once", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    await post(store, saleEntry(sale));
    await post(store, releaseEntry(sale));
    expect((await post(store, releaseEntry(sale))).replayed).toBe(true);
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "0.00", available: "97.00" });
  });

  it("refunds before release from pending, and never below zero", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    await post(store, saleEntry(sale));
    const refund = { kind: "refund", saleId: sale.id, referenceType: "sale", referenceId: sale.id } as const;
    await expect(post(store, { ...refund, pendingPiastres: -(sale.net + 1) })).rejects.toBeInstanceOf(
      ledger.TallabyPayBalanceError,
    );
    await post(store, { ...refund, pendingPiastres: -sale.net });
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "0.00", available: "0.00" });
  });

  it("refunds after release from available, which may go negative; the next sale still credits and covers it", async () => {
    const store = await makeStore();
    const first = await newSale(store, 10_000);
    await post(store, saleEntry(first));
    await post(store, releaseEntry(first));
    // A larger refund than the balance (e.g. after a withdrawal) takes available below zero.
    const big = await newSale(store, 20_000);
    await post(store, saleEntry(big));
    await post(store, releaseEntry(big));
    await post(store, {
      kind: "adjustment",
      availablePiastres: -19_400,
      reason: "test: earnings already withdrawn",
      referenceType: "admin",
      referenceId: randomUUID(),
    });
    await post(store, { kind: "refund", availablePiastres: -big.net, saleId: big.id, referenceType: "sale", referenceId: big.id });
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "0.00", available: "-97.00" });

    const next = await newSale(store, 15_000);
    await post(store, saleEntry(next));
    await post(store, releaseEntry(next));
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "0.00", available: "48.50" });
  });

  it("lets only a refund or an adjustment push available below reserved", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 100_000);
    await post(store, saleEntry(sale));
    await post(store, releaseEntry(sale)); // available 970.00
    const payoutId = await newPayout(store, sale.walletId, 97_000);

    // More than available can't be reserved.
    await expect(
      post(store, { kind: "payout_reserve", reservedPiastres: 97_001, payoutId, referenceType: "payout", referenceId: `${payoutId}:big` }),
    ).rejects.toBeInstanceOf(ledger.TallabyPayBalanceError);
    await post(store, { kind: "payout_reserve", reservedPiastres: 97_000, payoutId, referenceType: "payout", referenceId: payoutId });

    // A refund may still take available below the reservation (and below zero)…
    const other = await newSale(store, 10_000);
    await post(store, saleEntry(other));
    await post(store, releaseEntry(other));
    await post(store, { kind: "refund", availablePiastres: -other.net, saleId: other.id, referenceType: "sale", referenceId: other.id });
    await post(store, { kind: "refund", availablePiastres: -sale.net, saleId: sale.id, referenceType: "sale", referenceId: sale.id });
    expect(await expectLedgerMatches(store)).toMatchObject({ available: "0.00", reserved: "970.00" });

    // …but the payout can then no longer be paid; an adjustment needs a reason.
    await expect(
      post(store, { kind: "payout", availablePiastres: -97_000, reservedPiastres: -97_000, payoutId, referenceType: "payout", referenceId: payoutId }),
    ).rejects.toBeInstanceOf(ledger.TallabyPayBalanceError);
    await expect(
      post(store, { kind: "adjustment", availablePiastres: -100, referenceType: "admin", referenceId: randomUUID() }),
    ).rejects.toBeInstanceOf(ledger.InvalidTallabyPayEntryError);

    await post(store, { kind: "payout_unreserve", reservedPiastres: -97_000, payoutId, referenceType: "payout", referenceId: payoutId });
    expect(await expectLedgerMatches(store)).toMatchObject({ pending: "0.00", available: "0.00", reserved: "0.00" });
  });

  it("pays a reserved withdrawal from available and reserved together", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 60_000);
    await post(store, saleEntry(sale));
    await post(store, releaseEntry(sale)); // 582.00
    const payoutId = await newPayout(store, sale.walletId, 50_000);
    await post(store, { kind: "payout_reserve", reservedPiastres: 50_000, payoutId, referenceType: "payout", referenceId: payoutId });
    await post(store, { kind: "payout", availablePiastres: -50_000, reservedPiastres: -50_000, payoutId, referenceType: "payout", referenceId: payoutId });
    expect(await expectLedgerMatches(store)).toMatchObject({ available: "82.00", reserved: "0.00" });
  });

  it("keeps store A and store B apart", async () => {
    const a = await makeStore();
    const b = await makeStore();
    const saleA = await newSale(a, 10_000);
    await post(a, saleEntry(saleA));
    await ledger.ensureTallabyPayWallet(app.db, b.storeId, b.sellerId);

    // Seller A can't post to store B, and can't open a wallet on it.
    await expect(
      app.db.transaction((tx) => ledger.postTallabyPayEntry(tx, { ...saleEntry(saleA), storeId: b.storeId, sellerId: a.sellerId })),
    ).rejects.toBeInstanceOf(ledger.TallabyPayStoreMismatchError);
    await expect(ledger.ensureTallabyPayWallet(app.db, b.storeId, a.sellerId)).rejects.toBeInstanceOf(
      ledger.TallabyPayStoreMismatchError,
    );
    // Store B's owner can't credit store A's sale into B's wallet (composite key).
    await expect(post(b, { ...saleEntry(saleA), referenceId: `${saleA.id}:b` })).rejects.toThrow();

    expect(await expectLedgerMatches(a)).toMatchObject({ pending: "97.00" });
    expect(await ledger.getTallabyPayLedgerTotals(app.db, b.storeId)).toMatchObject({ pending: "0.00", available: "0.00" });
    expect(await entryCount(b)).toBe(0);
  });

  it("keeps the ledger append-only", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    const { entryId } = await post(store, saleEntry(sale));
    // Drizzle wraps the Postgres error; the trigger's message is on the cause.
    const unwrap = (e: unknown) => {
      throw (e as { cause?: unknown }).cause ?? e;
    };
    await expect(db.execute(sql`UPDATE tallaby_pay_entries SET description = 'x' WHERE id = ${entryId}`).catch(unwrap)).rejects.toThrow(
      /append-only/,
    );
    await expect(db.execute(sql`DELETE FROM tallaby_pay_entries WHERE id = ${entryId}`).catch(unwrap)).rejects.toThrow(/append-only/);
  });

  it("refuses a second sale row for the same EasyKash payment", async () => {
    const store = await makeStore();
    const sale = await newSale(store, 10_000);
    const rows = await db.execute<{ ref: string }>(sql`SELECT easykash_ref AS ref FROM tallaby_pay_sales WHERE id = ${sale.id}`);
    const ref = rows[0]!.ref;
    await expect(
      db.execute(sql`
        INSERT INTO tallaby_pay_sales (wallet_id, store_id, seller_id, easykash_ref, gross, fee, net, fee_bps, hold_days, paid_at)
        VALUES (${sale.walletId}, ${store.storeId}, ${store.sellerId}, ${ref}, 100, 3, 97, 300, 0, now())
      `),
    ).rejects.toThrow();
  });
});
