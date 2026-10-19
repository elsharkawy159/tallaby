/**
 * Filters for the admin store-wallet screens (/wallets in the admin app).
 * Pure: schemas and labels only. The reads are in `./wallet-view.server`.
 *
 * The store wallet is the seller ledger (`seller_wallet` +
 * `wallet_transactions` + `seller_wallet_top_ups`), not the customer
 * `user_wallets` ledger.
 */
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const STORE_WALLET_ENTRY_TYPES = [
  "sale",
  "fee",
  "top_up",
  "service_charge",
  "withdrawal",
  "adjustment",
  "refund",
  "fee_reversal",
] as const;

export const STORE_WALLET_STATUSES = ["active", "frozen", "closed"] as const;
export const STORE_TOP_UP_STATUSES = ["pending", "processing", "succeeded", "failed", "cancelled"] as const;
export const STORE_TOP_UP_PROVIDERS = ["vodafone_cash", "instapay", "kashier"] as const;
/** Sign of the balance: below zero, exactly zero, above zero. */
export const STORE_WALLET_BALANCE_FILTERS = ["negative", "zero", "positive"] as const;

/** Audit actions that touch the store wallet (shown on the wallet page). */
export const STORE_WALLET_AUDIT_ACTIONS = [
  "wallet_adjustment",
  "set_negative_limit",
  "approve_top_up",
  "reject_top_up",
] as const;

export const STORE_WALLET_MAX_PAGE_SIZE = 100;

const page = {
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(STORE_WALLET_MAX_PAGE_SIZE).optional(),
  offset: z.number().int().min(0).optional(),
};

const sort = <T extends readonly [string, ...string[]]>(ids: T) =>
  z.object({ id: z.enum(ids), desc: z.boolean() }).nullable().optional();

const sellerId = z.string().regex(UUID_RE, "Invalid id").optional();
const day = z.string().regex(DATE_RE).optional();

export const storeWalletListSchema = z.strictObject({
  ...page,
  balance: z.array(z.enum(STORE_WALLET_BALANCE_FILTERS)).optional(),
  status: z.array(z.enum(STORE_WALLET_STATUSES)).optional(),
  /** Only wallets whose balance differs from the sum of their ledger. */
  mismatchOnly: z.boolean().optional(),
  sort: sort(["balance", "lastEntryAt", "name"] as const),
});

export const storeWalletEntryListSchema = z.strictObject({
  ...page,
  sellerId,
  type: z.array(z.enum(STORE_WALLET_ENTRY_TYPES)).optional(),
  direction: z.enum(["credit", "debit"]).optional(),
  /** Inclusive calendar days (YYYY-MM-DD, Africa/Cairo). */
  from: day,
  to: day,
  sort: sort(["createdAt", "amount"] as const),
});

export const storeTopUpListSchema = z.strictObject({
  ...page,
  sellerId,
  status: z.array(z.enum(STORE_TOP_UP_STATUSES)).optional(),
  provider: z.array(z.enum(STORE_TOP_UP_PROVIDERS)).optional(),
  sort: sort(["createdAt", "amount"] as const),
});

export type StoreWalletListInput = z.input<typeof storeWalletListSchema>;
export type StoreWalletEntryListInput = z.input<typeof storeWalletEntryListSchema>;
export type StoreTopUpListInput = z.input<typeof storeTopUpListSchema>;

export type StoreWalletEntryType = (typeof STORE_WALLET_ENTRY_TYPES)[number];
