/**
 * Admin read models for the store wallet (the seller ledger): platform totals,
 * every seller's wallet, the full ledger, all top-ups and the wallet audit
 * trail. Used by the admin /wallets pages.
 *
 * Read-only. Callers must have checked the admin session first. Balances are
 * never cached (CLAUDE.md rule 8). Money comes back as numeric text from
 * Postgres; nothing here does float arithmetic on it.
 */
import {
  adminAuditLog,
  and,
  asc,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sellerWallet,
  sellerWalletTopUps,
  sellers,
  sql,
  stores,
  users,
  walletTransactions,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import type { Queryable } from "./guard.server";
import {
  STORE_WALLET_AUDIT_ACTIONS,
  storeTopUpListSchema,
  storeWalletEntryListSchema,
  storeWalletListSchema,
} from "./wallet-view.lib";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PAGE_SIZE = 20;
const MANUAL = [...MANUAL_TOP_UP_METHODS];

export type Paged<T> = { rows: T[]; totalCount: number };

/** Thrown for filters that fail the schema; the page shows it as a load error. */
export class InvalidWalletFiltersError extends Error {
  constructor() {
    super("Invalid wallet filters");
    this.name = "InvalidWalletFiltersError";
  }
}

const orderBy = (column: SQL | Parameters<typeof asc>[0], sort: { desc: boolean } | null | undefined, defaultDesc = true) =>
  sql`${(sort ? sort.desc : defaultDesc) ? desc(column) : asc(column)} nulls last`;

/** `%term%` with LIKE wildcards in the term escaped. */
const likeTerm = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Inclusive calendar-day bounds in Cairo time. */
function dayRange(column: SQL | Parameters<typeof asc>[0], from?: string, to?: string): SQL[] {
  const out: SQL[] = [];
  if (from) out.push(sql`${column} >= (${from}::date::timestamp AT TIME ZONE 'Africa/Cairo')`);
  if (to) out.push(sql`${column} < ((${to}::date + 1)::timestamp AT TIME ZONE 'Africa/Cairo')`);
  return out;
}

const sellerName = sql<string>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`;

// ---------------------------------------------------------------------------
// Platform totals
// ---------------------------------------------------------------------------

export type StoreWalletTotals = {
  walletCount: number;
  /** Sum of balances above zero: money Tallaby holds for sellers. */
  totalHeld: string;
  /** Sum of balances below zero (a negative number): what sellers owe. */
  totalOwed: string;
  netBalance: string;
  negativeCount: number;
  inactiveCount: number;
  /** Wallets whose balance differs from the sum of their ledger, or from the sellers.wallet_balance mirror. */
  mismatchCount: number;
  pendingReviewCount: number;
  pendingReviewAmount: string;
  /** Last 30 days. Fees are net of fee reversals (a positive number = earned). */
  fees30d: string;
  topUps30d: string;
  sales30d: string;
  feesAllTime: string;
};

export async function getStoreWalletTotals(q: Queryable = db): Promise<StoreWalletTotals> {
  const [wallets] = await q.execute<{
    wallet_count: number;
    total_held: string;
    total_owed: string;
    net_balance: string;
    negative_count: number;
    inactive_count: number;
  }>(sql`
    SELECT count(*)::int AS wallet_count,
           coalesce(sum(balance) FILTER (WHERE balance > 0), 0)::text AS total_held,
           coalesce(sum(balance) FILTER (WHERE balance < 0), 0)::text AS total_owed,
           coalesce(sum(balance), 0)::text AS net_balance,
           (count(*) FILTER (WHERE balance < 0))::int AS negative_count,
           (count(*) FILTER (WHERE status <> 'active'))::int AS inactive_count
      FROM seller_wallet
  `);

  const [mismatch] = await q.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n
      FROM seller_wallet w
      JOIN sellers s ON s.id = w.seller_id
      LEFT JOIN (SELECT seller_id, sum(amount) AS total FROM wallet_transactions GROUP BY seller_id) t
        ON t.seller_id = w.seller_id
     WHERE w.balance <> coalesce(t.total, 0)
        OR coalesce(s.wallet_balance, 0) <> w.balance
  `);

  const [pending] = await q
    .select({
      n: sql<number>`count(*)::int`,
      amount: sql<string>`coalesce(sum(${sellerWalletTopUps.amount}), 0)::text`,
    })
    .from(sellerWalletTopUps)
    .where(and(eq(sellerWalletTopUps.status, "pending"), inArray(sellerWalletTopUps.provider, MANUAL)));

  const [flows] = await q.execute<{ fees_30d: string; top_ups_30d: string; sales_30d: string; fees_all: string }>(sql`
    SELECT coalesce(-sum(amount) FILTER (WHERE type IN ('fee', 'fee_reversal') AND created_at >= now() - interval '30 days'), 0)::text AS fees_30d,
           coalesce(sum(amount) FILTER (WHERE type = 'top_up' AND created_at >= now() - interval '30 days'), 0)::text AS top_ups_30d,
           coalesce(sum(amount) FILTER (WHERE type = 'sale' AND created_at >= now() - interval '30 days'), 0)::text AS sales_30d,
           coalesce(-sum(amount) FILTER (WHERE type IN ('fee', 'fee_reversal')), 0)::text AS fees_all
      FROM wallet_transactions
  `);

  return {
    walletCount: Number(wallets?.wallet_count ?? 0),
    totalHeld: wallets?.total_held ?? "0",
    totalOwed: wallets?.total_owed ?? "0",
    netBalance: wallets?.net_balance ?? "0",
    negativeCount: Number(wallets?.negative_count ?? 0),
    inactiveCount: Number(wallets?.inactive_count ?? 0),
    mismatchCount: Number(mismatch?.n ?? 0),
    pendingReviewCount: Number(pending?.n ?? 0),
    pendingReviewAmount: pending?.amount ?? "0",
    fees30d: flows?.fees_30d ?? "0",
    topUps30d: flows?.top_ups_30d ?? "0",
    sales30d: flows?.sales_30d ?? "0",
    feesAllTime: flows?.fees_all ?? "0",
  };
}

// ---------------------------------------------------------------------------
// Every seller's wallet
// ---------------------------------------------------------------------------

export type AdminStoreWalletRow = {
  sellerId: string;
  sellerName: string;
  sellerEmail: string | null;
  sellerStatus: string | null;
  /** NULL when the seller has no wallet row yet (balance 0, created on the first entry). */
  walletStatus: string | null;
  balance: string;
  negativeLimit: string | null;
  ledgerTotal: string;
  mirrorBalance: string | null;
  mismatch: boolean;
  entryCount: number;
  lastEntryAt: string | null;
  pendingTopUps: number;
};

/** Sellers with their store wallet, paged. Sellers without a wallet row show balance 0. */
export async function listStoreWalletsForAdmin(input: unknown = {}, q: Queryable = db): Promise<Paged<AdminStoreWalletRow>> {
  const parsed = storeWalletListSchema.safeParse(input);
  if (!parsed.success) throw new InvalidWalletFiltersError();
  const f = parsed.data;

  const balance = sql`coalesce(${sellerWallet.balance}, 0)`;
  const ledgerTotal = sql`(SELECT coalesce(sum(t.amount), 0) FROM wallet_transactions t WHERE t.seller_id = ${sellers.id})`;
  const lastEntryAt = sql`(SELECT max(t.created_at) FROM wallet_transactions t WHERE t.seller_id = ${sellers.id})`;
  const mismatch = sql`(${balance} <> ${ledgerTotal} OR (${sellerWallet.id} IS NOT NULL AND coalesce(${sellers.walletBalance}, 0) <> ${sellerWallet.balance}))`;

  const conditions: SQL[] = [];
  if (f.search) {
    const term = likeTerm(f.search);
    conditions.push(
      or(ilike(sellers.displayName, term), ilike(sellers.businessName, term), ilike(sellers.supportEmail, term), ilike(users.email, term))!,
    );
  }
  const signs = new Set(f.balance ?? []);
  if (signs.size > 0 && signs.size < 3) {
    const parts: SQL[] = [];
    if (signs.has("negative")) parts.push(sql`${balance} < 0`);
    if (signs.has("zero")) parts.push(sql`${balance} = 0`);
    if (signs.has("positive")) parts.push(sql`${balance} > 0`);
    conditions.push(or(...parts)!);
  }
  if (f.status?.length) conditions.push(inArray(sellerWallet.status, f.status));
  if (f.mismatchOnly) conditions.push(mismatch);
  const where = conditions.length ? and(...conditions) : undefined;

  const sortColumn = f.sort?.id === "name" ? sellerName : f.sort?.id === "lastEntryAt" ? lastEntryAt : balance;
  const rows = await q
    .select({
      sellerId: sellers.id,
      sellerName,
      sellerEmail: sql<string | null>`coalesce(${users.email}, ${sellers.supportEmail})`,
      sellerStatus: sellers.status,
      walletStatus: sellerWallet.status,
      balance: sql<string>`${balance}::text`,
      negativeLimit: sellerWallet.negativeLimit,
      ledgerTotal: sql<string>`${ledgerTotal}::text`,
      mirrorBalance: sellers.walletBalance,
      mismatch: sql<boolean>`${mismatch}`,
      entryCount: sql<number>`(SELECT count(*)::int FROM wallet_transactions t WHERE t.seller_id = ${sellers.id})`,
      lastEntryAt: sql<string | null>`${lastEntryAt}::text`,
      // Manual top-ups waiting for review (MANUAL_TOP_UP_METHODS).
      pendingTopUps: sql<number>`(SELECT count(*)::int FROM seller_wallet_top_ups u WHERE u.seller_id = ${sellers.id} AND u.status = 'pending' AND u.provider IN ('vodafone_cash', 'instapay'))`,
    })
    .from(sellers)
    .leftJoin(sellerWallet, eq(sellerWallet.sellerId, sellers.id))
    .leftJoin(users, eq(users.id, sellers.id))
    .where(where)
    .orderBy(orderBy(sortColumn, f.sort, f.sort?.id !== "name"), desc(sellers.id))
    .limit(f.limit ?? DEFAULT_PAGE_SIZE)
    .offset(f.offset ?? 0);

  const [total] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(sellers)
    .leftJoin(sellerWallet, eq(sellerWallet.sellerId, sellers.id))
    .leftJoin(users, eq(users.id, sellers.id))
    .where(where);

  return {
    rows: rows.map((row) => ({
      ...row,
      sellerStatus: row.sellerStatus ?? null,
      mismatch: row.mismatch === true,
      entryCount: Number(row.entryCount),
      pendingTopUps: Number(row.pendingTopUps),
    })),
    totalCount: Number(total?.n ?? 0),
  };
}

// ---------------------------------------------------------------------------
// The ledger
// ---------------------------------------------------------------------------

export type AdminStoreWalletEntryRow = {
  id: string;
  sellerId: string;
  sellerName: string;
  storeId: string | null;
  storeName: string | null;
  type: string;
  amount: string;
  balanceBefore: string | null;
  balanceAfter: string | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  orderId: string | null;
  reason: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string | null;
};

/** Ledger entries of every seller (or one, with `sellerId`), newest first, paged. */
export async function listStoreWalletEntriesPagedForAdmin(
  input: unknown = {},
  q: Queryable = db,
): Promise<Paged<AdminStoreWalletEntryRow>> {
  const parsed = storeWalletEntryListSchema.safeParse(input);
  if (!parsed.success) throw new InvalidWalletFiltersError();
  const f = parsed.data;

  const conditions: SQL[] = [];
  if (f.sellerId) conditions.push(eq(walletTransactions.sellerId, f.sellerId));
  if (f.type?.length) conditions.push(inArray(walletTransactions.type, f.type));
  if (f.direction === "credit") conditions.push(sql`${walletTransactions.amount} > 0`);
  if (f.direction === "debit") conditions.push(sql`${walletTransactions.amount} < 0`);
  conditions.push(...dayRange(walletTransactions.createdAt, f.from, f.to));
  if (f.search) {
    const term = likeTerm(f.search);
    conditions.push(
      or(
        ilike(sellers.displayName, term),
        ilike(sellers.businessName, term),
        ilike(walletTransactions.description, term),
        ilike(walletTransactions.referenceId, term),
        sql`${walletTransactions.orderId}::text ilike ${term}`,
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await q
    .select({
      id: walletTransactions.id,
      sellerId: walletTransactions.sellerId,
      sellerName,
      storeId: walletTransactions.storeId,
      storeName: stores.name,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceBefore: walletTransactions.balanceBefore,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      referenceType: walletTransactions.referenceType,
      referenceId: walletTransactions.referenceId,
      orderId: walletTransactions.orderId,
      reason: sql<string | null>`${walletTransactions.metadata} ->> 'reason'`,
      createdBy: walletTransactions.createdBy,
      createdByName: sql<string | null>`(SELECT coalesce(u.full_name, u.email) FROM users u WHERE u.id = ${walletTransactions.createdBy})`,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .innerJoin(sellers, eq(sellers.id, walletTransactions.sellerId))
    // The store must belong to the entry's seller.
    .leftJoin(stores, and(eq(stores.id, walletTransactions.storeId), eq(stores.sellerId, walletTransactions.sellerId)))
    .where(where)
    .orderBy(
      orderBy(f.sort?.id === "amount" ? walletTransactions.amount : walletTransactions.createdAt, f.sort),
      desc(walletTransactions.id),
    )
    .limit(f.limit ?? DEFAULT_PAGE_SIZE)
    .offset(f.offset ?? 0);

  const [total] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(walletTransactions)
    .innerJoin(sellers, eq(sellers.id, walletTransactions.sellerId))
    .where(where);

  return { rows, totalCount: Number(total?.n ?? 0) };
}

// ---------------------------------------------------------------------------
// Top-ups (Kashier and manual)
// ---------------------------------------------------------------------------

export type AdminStoreTopUpRow = {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: string;
  status: string;
  provider: string;
  providerReference: string | null;
  providerTransactionId: string | null;
  transactionId: string | null;
  failureReason: string | null;
  /** Manual top-ups only: the receipt path in the private bucket and the sender's number. */
  proofPath: string | null;
  senderPhone: string | null;
  /** True for a manual (Vodafone Cash / InstaPay) top-up an admin can still review. */
  reviewable: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listStoreTopUpsPagedForAdmin(input: unknown = {}, q: Queryable = db): Promise<Paged<AdminStoreTopUpRow>> {
  const parsed = storeTopUpListSchema.safeParse(input);
  if (!parsed.success) throw new InvalidWalletFiltersError();
  const f = parsed.data;

  const conditions: SQL[] = [];
  if (f.sellerId) conditions.push(eq(sellerWalletTopUps.sellerId, f.sellerId));
  if (f.status?.length) conditions.push(inArray(sellerWalletTopUps.status, f.status));
  if (f.provider?.length) conditions.push(inArray(sellerWalletTopUps.provider, f.provider));
  if (f.search) {
    const term = likeTerm(f.search);
    conditions.push(
      or(
        ilike(sellers.displayName, term),
        ilike(sellers.businessName, term),
        ilike(sellerWalletTopUps.providerReference, term),
        sql`${sellerWalletTopUps.metadata} ->> 'senderPhone' ilike ${term}`,
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await q
    .select({
      id: sellerWalletTopUps.id,
      sellerId: sellerWalletTopUps.sellerId,
      sellerName,
      amount: sellerWalletTopUps.amount,
      status: sellerWalletTopUps.status,
      provider: sellerWalletTopUps.provider,
      providerReference: sellerWalletTopUps.providerReference,
      providerTransactionId: sellerWalletTopUps.providerTransactionId,
      transactionId: sellerWalletTopUps.transactionId,
      failureReason: sellerWalletTopUps.failureReason,
      metadata: sellerWalletTopUps.metadata,
      createdAt: sellerWalletTopUps.createdAt,
      updatedAt: sellerWalletTopUps.updatedAt,
    })
    .from(sellerWalletTopUps)
    .innerJoin(sellers, eq(sellers.id, sellerWalletTopUps.sellerId))
    .where(where)
    .orderBy(
      orderBy(f.sort?.id === "amount" ? sellerWalletTopUps.amount : sellerWalletTopUps.createdAt, f.sort),
      desc(sellerWalletTopUps.id),
    )
    .limit(f.limit ?? DEFAULT_PAGE_SIZE)
    .offset(f.offset ?? 0);

  const [total] = await q
    .select({ n: sql<number>`count(*)::int` })
    .from(sellerWalletTopUps)
    .innerJoin(sellers, eq(sellers.id, sellerWalletTopUps.sellerId))
    .where(where);

  return {
    rows: rows.map(({ metadata, ...row }) => {
      const meta = (metadata ?? {}) as { proofPath?: unknown; senderPhone?: unknown };
      return {
        ...row,
        proofPath: typeof meta.proofPath === "string" ? meta.proofPath : null,
        senderPhone: typeof meta.senderPhone === "string" ? meta.senderPhone : null,
        reviewable: row.status === "pending" && (MANUAL as string[]).includes(row.provider),
      };
    }),
    totalCount: Number(total?.n ?? 0),
  };
}

// ---------------------------------------------------------------------------
// One seller's wallet
// ---------------------------------------------------------------------------

export type StoreWalletBreakdown = {
  seller: { name: string; email: string | null; status: string | null; mirrorBalance: string | null } | null;
  /** Sum and count per entry type, all time. */
  byType: { type: string; total: string; count: number }[];
  /** Sum and count per store; storeId NULL = account-level entries. */
  byStore: { storeId: string | null; storeName: string | null; total: string; count: number }[];
  /** The seller's current stores, for the adjustment form. */
  stores: { id: string; name: string }[];
};

export async function getStoreWalletBreakdownForAdmin(sellerId: string, q: Queryable = db): Promise<StoreWalletBreakdown> {
  if (!UUID_RE.test(sellerId)) return { seller: null, byType: [], byStore: [], stores: [] };

  const [[seller], byType, byStore, storeRows] = await Promise.all([
    q
      .select({
        name: sellerName,
        email: sql<string | null>`coalesce(${users.email}, ${sellers.supportEmail})`,
        status: sellers.status,
        mirrorBalance: sellers.walletBalance,
      })
      .from(sellers)
      .leftJoin(users, eq(users.id, sellers.id))
      .where(eq(sellers.id, sellerId)),
    q
      .select({
        type: walletTransactions.type,
        total: sql<string>`sum(${walletTransactions.amount})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.sellerId, sellerId))
      .groupBy(walletTransactions.type)
      .orderBy(walletTransactions.type),
    q
      .select({
        storeId: stores.id,
        storeName: stores.name,
        total: sql<string>`sum(${walletTransactions.amount})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(walletTransactions)
      .leftJoin(stores, and(eq(stores.id, walletTransactions.storeId), eq(stores.sellerId, sellerId)))
      .where(eq(walletTransactions.sellerId, sellerId))
      .groupBy(stores.id, stores.name)
      .orderBy(sql`${stores.name} nulls first`),
    q
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
      .orderBy(desc(stores.isPrimary), stores.createdAt),
  ]);

  return {
    seller: seller ? { ...seller, status: seller.status ?? null } : null,
    byType: byType.map((row) => ({ ...row, count: Number(row.count) })),
    byStore: byStore.map((row) => ({ ...row, count: Number(row.count) })),
    stores: storeRows,
  };
}

// ---------------------------------------------------------------------------
// Wallet audit trail
// ---------------------------------------------------------------------------

export type StoreWalletAuditRow = {
  id: string;
  sellerId: string;
  sellerName: string | null;
  action: string;
  before: unknown;
  after: unknown;
  reason: string;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
};

/** Admin actions on store wallets (adjustments, negative limits, top-up reviews), newest first. */
export async function listStoreWalletAuditForAdmin(
  input: { sellerId?: string; limit?: number; offset?: number } = {},
  q: Queryable = db,
): Promise<Paged<StoreWalletAuditRow>> {
  if (input.sellerId !== undefined && !UUID_RE.test(input.sellerId)) return { rows: [], totalCount: 0 };
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? DEFAULT_PAGE_SIZE) || 1, 1), 100);
  const offset = Math.max(Math.trunc(input.offset ?? 0) || 0, 0);

  const where = and(
    inArray(adminAuditLog.action, [...STORE_WALLET_AUDIT_ACTIONS]),
    input.sellerId ? eq(adminAuditLog.sellerId, input.sellerId) : undefined,
  );

  const rows = await q
    .select({
      id: adminAuditLog.id,
      // Wallet actions always name a seller; only platform rows (0069) have none.
      sellerId: sql<string>`${adminAuditLog.sellerId}`,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      action: adminAuditLog.action,
      before: adminAuditLog.before,
      after: adminAuditLog.after,
      reason: adminAuditLog.reason,
      actorId: adminAuditLog.actorId,
      actorName: sql<string | null>`coalesce(${users.fullName}, ${users.email})`,
      createdAt: adminAuditLog.createdAt,
    })
    .from(adminAuditLog)
    .leftJoin(sellers, eq(sellers.id, adminAuditLog.sellerId))
    .leftJoin(users, eq(users.id, adminAuditLog.actorId))
    .where(where)
    .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
    .limit(limit)
    .offset(offset);

  const [total] = await q.select({ n: sql<number>`count(*)::int` }).from(adminAuditLog).where(where);
  return { rows, totalCount: Number(total?.n ?? 0) };
}
