import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, orders, sellerWallet, sellers, stores, walletTransactions } from "@workspace/db";

/**
 * Store wallet reads for /wallet (PLAN.md §13.4, P6-06). Server-only and
 * always scoped to the session seller passed in by the page. Never cached:
 * wallet data is read fresh on every request (CLAUDE.md rule 8).
 */

export const ENTRY_FILTERS = ["all", "sales", "fees", "topups", "other"] as const;
export type EntryFilter = (typeof ENTRY_FILTERS)[number];

const FILTER_TYPES: Record<Exclude<EntryFilter, "all">, string[]> = {
  sales: ["sale"],
  fees: ["fee", "fee_reversal"],
  topups: ["top_up"],
  other: ["service_charge", "withdrawal", "adjustment", "refund"],
};

export function parseEntryFilter(value: string | string[] | undefined): EntryFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return (ENTRY_FILTERS as readonly string[]).includes(v ?? "") ? (v as EntryFilter) : "all";
}

export type StoreWalletOverview = {
  balance: string;
  status: string;
  negativeLimit: string | null;
  /** Sum of all entries; equals `balance` (shown so sellers can check it). */
  ledgerTotal: string;
  feesThisMonth: string;
  salesThisMonth: string;
  trial: { eligible: boolean; startedAt: string | null; endsAt: string | null };
};

export async function getStoreWalletOverview(sellerId: string): Promise<StoreWalletOverview | null> {
  const [row] = await db
    .select({
      balance: sql<string>`coalesce(${sellerWallet.balance}, 0)::text`,
      status: sql<string>`coalesce(${sellerWallet.status}::text, 'active')`,
      negativeLimit: sellerWallet.negativeLimit,
      trialEligible: sellers.feeTrialEligible,
      trialStartedAt: sellers.feeTrialStartedAt,
      trialEndsAt: sellers.feeTrialEndsAt,
    })
    .from(sellers)
    .leftJoin(sellerWallet, eq(sellerWallet.sellerId, sellers.id))
    .where(eq(sellers.id, sellerId));
  if (!row) return null;

  const [totals] = await db
    .select({
      ledgerTotal: sql<string>`coalesce(sum(${walletTransactions.amount}), 0)::text`,
      feesThisMonth: sql<string>`coalesce(-sum(${walletTransactions.amount}) FILTER (WHERE ${walletTransactions.type} IN ('fee', 'fee_reversal') AND ${walletTransactions.createdAt} >= date_trunc('month', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo'), 0)::text`,
      salesThisMonth: sql<string>`coalesce(sum(${walletTransactions.amount}) FILTER (WHERE ${walletTransactions.type} = 'sale' AND ${walletTransactions.createdAt} >= date_trunc('month', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo'), 0)::text`,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.sellerId, sellerId));

  return {
    balance: row.balance,
    status: row.status,
    negativeLimit: row.negativeLimit,
    ledgerTotal: totals?.ledgerTotal ?? "0",
    feesThisMonth: totals?.feesThisMonth ?? "0",
    salesThisMonth: totals?.salesThisMonth ?? "0",
    trial: { eligible: row.trialEligible, startedAt: row.trialStartedAt, endsAt: row.trialEndsAt },
  };
}

export type StoreWalletEntryRow = {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string | null;
  description: string | null;
  createdAt: string | null;
  orderId: string | null;
  orderNumber: string | null;
  storeName: string | null;
};

export const ENTRIES_PAGE_SIZE = 25;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?([+-]\d{2}(:?\d{2})?|Z)?$/;

/** Cursor for the next page: the last row shown. Entries of one delivery share created_at. */
export function entryCursor(row: Pick<StoreWalletEntryRow, "createdAt" | "id">): string {
  return `${row.createdAt}|${row.id}`;
}

function parseCursor(value: string | null | undefined): { at: string; id: string } | null {
  const [at, id] = (value ?? "").split("|");
  // Postgres text timestamps ("2026-10-17 14:38:26.41+00"); anything else is ignored.
  return at && id && UUID_RE.test(id) && TIMESTAMP_RE.test(at) ? { at, id } : null;
}

/** Newest first, ENTRIES_PAGE_SIZE + 1 rows (the extra one says there is more). */
export async function listStoreWalletEntries(
  sellerId: string,
  options: { filter: EntryFilter; before?: string | null },
): Promise<StoreWalletEntryRow[]> {
  const conditions = [eq(walletTransactions.sellerId, sellerId)];
  if (options.filter !== "all") {
    conditions.push(
      inArray(walletTransactions.type, FILTER_TYPES[options.filter] as (typeof walletTransactions.type.enumValues)[number][]),
    );
  }
  const cursor = parseCursor(options.before);
  if (cursor) {
    conditions.push(sql`(${walletTransactions.createdAt}, ${walletTransactions.id}) < (${cursor.at}::timestamptz, ${cursor.id}::uuid)`);
  }

  return db
    .select({
      id: walletTransactions.id,
      type: sql<string>`${walletTransactions.type}::text`,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
      orderId: walletTransactions.orderId,
      orderNumber: orders.orderNumber,
      storeName: stores.name,
    })
    .from(walletTransactions)
    .leftJoin(orders, eq(orders.id, walletTransactions.orderId))
    // The store must be this seller's (the 0060 trigger guarantees it; checked again here).
    .leftJoin(stores, and(eq(stores.id, walletTransactions.storeId), eq(stores.sellerId, sellerId)))
    .where(and(...conditions))
    .orderBy(desc(walletTransactions.createdAt), desc(walletTransactions.id))
    .limit(ENTRIES_PAGE_SIZE + 1);
}

/** The header's wallet box: the balance only, read fresh (never cached). */
export async function getStoreWalletBalance(sellerId: string): Promise<number | null> {
  const [row] = await db
    .select({ balance: sql<string>`coalesce(${sellerWallet.balance}, 0)::text` })
    .from(sellers)
    .leftJoin(sellerWallet, eq(sellerWallet.sellerId, sellers.id))
    .where(eq(sellers.id, sellerId));
  return row ? Number(row.balance) : null;
}
