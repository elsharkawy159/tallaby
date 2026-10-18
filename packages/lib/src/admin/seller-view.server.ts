/**
 * Admin read models for the seller page and monitoring (PLAN.md P9-01, P9-03).
 *
 * Callers must have checked the admin session first. Nothing here selects
 * integration credentials or config (`credentials_encrypted`, `config`):
 * only provider, status, timestamps and the last error.
 */
import {
  adminAuditLog,
  and,
  count,
  db,
  desc,
  eq,
  isNull,
  sellerCustomDomains,
  sellerWalletTopUps,
  sellers,
  sql,
  storeIntegrations,
  stores,
  users,
  walletTransactions,
} from "@workspace/db";
import { getStoreWalletSummary } from "@workspace/db/wallet";
import { getMaxStores, getPlanLimits } from "../plans";
import { getFeeTrialStatus } from "../sellers/fee-trial.lib";
import { listStoreRevisions, type StoreRevisionRow } from "../store-sites/server";
import { storeHostname } from "../storefront";
import type { Queryable } from "./guard.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clampLimit = (limit: number, max: number) => Math.min(Math.max(Math.trunc(limit) || 1, 1), max);

/** Plan, store limit, fee plan, trial, exemption and store wallet of one seller account. */
export async function getSellerAccountForAdmin(sellerId: string, q: Queryable = db) {
  if (!UUID_RE.test(sellerId)) return null;
  const [seller] = await q
    .select({
      plan: sellers.plan,
      planStartedAt: sellers.planStartedAt,
      planExpiresAt: sellers.planExpiresAt,
      maxStoresOverride: sellers.maxStoresOverride,
      feePlan: sellers.feePlan,
      feePlanEffectiveAt: sellers.feePlanEffectiveAt,
      feeTrialEligible: sellers.feeTrialEligible,
      feeTrialStartedAt: sellers.feeTrialStartedAt,
      feeTrialEndsAt: sellers.feeTrialEndsAt,
      feeTrialStartTrigger: sellers.feeTrialStartTrigger,
      isCommissionExempt: sellers.isCommissionExempt,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId));
  if (!seller) return null;

  const [[{ storeCount } = { storeCount: 0 }], wallet] = await Promise.all([
    q
      .select({ storeCount: count() })
      .from(stores)
      .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt))),
    getStoreWalletSummary(q, sellerId),
  ]);

  const trial = getFeeTrialStatus(seller);
  return {
    ...seller,
    planMaxStores: getPlanLimits(seller.plan).maxStores,
    maxStores: getMaxStores(seller.plan, { maxStoresOverride: seller.maxStoresOverride }),
    storeCount: Number(storeCount),
    trial: {
      state: trial.state,
      endsAt: "endsAt" in trial ? trial.endsAt.toISOString() : null,
      daysLeft: trial.state === "active" ? trial.daysLeft : null,
    },
    wallet: wallet && {
      balance: wallet.balance,
      status: wallet.status,
      negativeLimit: wallet.negativeLimit,
      ledgerTotal: wallet.ledgerTotal,
    },
  };
}

export type SellerAccountForAdmin = NonNullable<Awaited<ReturnType<typeof getSellerAccountForAdmin>>>;

export type AdminStoreRow = {
  id: string;
  name: string;
  subdomain: string;
  isPrimary: boolean;
  status: string;
  siteStatus: string;
  templateKey: string;
  host: string;
  customDomain: string | null;
  customDomainStatus: string | null;
  firstPublishedAt: string | null;
  lastPublishedAt: string | null;
  createdAt: string;
  revisionCount: number;
  /** Newest first, view-only. */
  revisions: StoreRevisionRow[];
};

/** The seller's stores (archived and suspended included, deleted excluded) with their last revisions. */
export async function listSellerStoresForAdmin(sellerId: string, q: Queryable = db): Promise<AdminStoreRow[]> {
  if (!UUID_RE.test(sellerId)) return [];
  const rows = await q
    .select({
      id: stores.id,
      name: stores.name,
      subdomain: stores.subdomain,
      isPrimary: stores.isPrimary,
      status: stores.status,
      siteStatus: stores.siteStatus,
      templateKey: stores.templateKey,
      firstPublishedAt: stores.firstPublishedAt,
      lastPublishedAt: stores.lastPublishedAt,
      createdAt: stores.createdAt,
      customDomain: sellerCustomDomains.domain,
      customDomainStatus: sellerCustomDomains.status,
      revisionCount: sql<number>`(SELECT count(*)::int FROM store_site_revisions r WHERE r.store_id = ${stores.id})`,
    })
    .from(stores)
    .leftJoin(sellerCustomDomains, eq(sellerCustomDomains.storeId, stores.id))
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .orderBy(desc(stores.isPrimary), stores.createdAt);

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      revisionCount: Number(row.revisionCount),
      host: storeHostname(row.subdomain, row.customDomainStatus === "active" ? row.customDomain : null),
      revisions: (await listStoreRevisions(sellerId, row.id, 10, q)) ?? [],
    })),
  );
}

const INTEGRATION_COLUMNS = {
  id: storeIntegrations.id,
  storeId: storeIntegrations.storeId,
  storeName: stores.name,
  subdomain: stores.subdomain,
  provider: storeIntegrations.provider,
  status: storeIntegrations.status,
  lastError: storeIntegrations.lastError,
  lastSyncedAt: storeIntegrations.lastSyncedAt,
  connectedAt: storeIntegrations.connectedAt,
  updatedAt: storeIntegrations.updatedAt,
};

/** Integrations of every store of the seller. Status and last error only, never secrets or config. */
export async function listSellerIntegrationsForAdmin(sellerId: string, q: Queryable = db) {
  if (!UUID_RE.test(sellerId)) return [];
  return q
    .select(INTEGRATION_COLUMNS)
    .from(storeIntegrations)
    .innerJoin(stores, and(eq(stores.id, storeIntegrations.storeId), eq(stores.sellerId, storeIntegrations.sellerId)))
    .where(eq(storeIntegrations.sellerId, sellerId))
    .orderBy(stores.name, storeIntegrations.provider);
}

/** P9-03: every store integration in `error`, newest first. No credentials. */
export async function listIntegrationErrors(limit = 100, q: Queryable = db) {
  return q
    .select({ ...INTEGRATION_COLUMNS, sellerId: storeIntegrations.sellerId, businessName: sellers.businessName })
    .from(storeIntegrations)
    .innerJoin(stores, and(eq(stores.id, storeIntegrations.storeId), eq(stores.sellerId, storeIntegrations.sellerId)))
    .innerJoin(sellers, eq(sellers.id, storeIntegrations.sellerId))
    .where(eq(storeIntegrations.status, "error"))
    .orderBy(desc(storeIntegrations.updatedAt))
    .limit(clampLimit(limit, 500));
}

export type IntegrationErrorRow = Awaited<ReturnType<typeof listIntegrationErrors>>[number];

/** Latest store-wallet entries, with the store each belongs to (checked to be the seller's). */
export async function listStoreWalletEntriesForAdmin(sellerId: string, limit = 50, q: Queryable = db) {
  if (!UUID_RE.test(sellerId)) return [];
  return q
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      referenceType: walletTransactions.referenceType,
      referenceId: walletTransactions.referenceId,
      orderId: walletTransactions.orderId,
      storeId: walletTransactions.storeId,
      storeName: stores.name,
      reason: sql<string | null>`${walletTransactions.metadata} ->> 'reason'`,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .leftJoin(stores, and(eq(stores.id, walletTransactions.storeId), eq(stores.sellerId, sellerId)))
    .where(eq(walletTransactions.sellerId, sellerId))
    .orderBy(desc(walletTransactions.createdAt), desc(walletTransactions.id))
    .limit(clampLimit(limit, 200));
}

/** Latest store-wallet top-ups (Kashier). */
export async function listStoreTopUpsForAdmin(sellerId: string, limit = 20, q: Queryable = db) {
  if (!UUID_RE.test(sellerId)) return [];
  return q
    .select({
      id: sellerWalletTopUps.id,
      amount: sellerWalletTopUps.amount,
      status: sellerWalletTopUps.status,
      provider: sellerWalletTopUps.provider,
      providerReference: sellerWalletTopUps.providerReference,
      failureReason: sellerWalletTopUps.failureReason,
      createdAt: sellerWalletTopUps.createdAt,
      updatedAt: sellerWalletTopUps.updatedAt,
    })
    .from(sellerWalletTopUps)
    .where(eq(sellerWalletTopUps.sellerId, sellerId))
    .orderBy(desc(sellerWalletTopUps.createdAt))
    .limit(clampLimit(limit, 100));
}

/** The seller's admin audit trail, newest first. */
export async function listAdminAuditLog(sellerId: string, limit = 50, q: Queryable = db) {
  if (!UUID_RE.test(sellerId)) return [];
  return q
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      storeId: adminAuditLog.storeId,
      storeName: stores.name,
      before: adminAuditLog.before,
      after: adminAuditLog.after,
      reason: adminAuditLog.reason,
      actorId: adminAuditLog.actorId,
      actorName: sql<string | null>`coalesce(${users.fullName}, ${users.email})`,
      createdAt: adminAuditLog.createdAt,
    })
    .from(adminAuditLog)
    .leftJoin(users, eq(users.id, adminAuditLog.actorId))
    .leftJoin(stores, eq(stores.id, adminAuditLog.storeId))
    .where(eq(adminAuditLog.sellerId, sellerId))
    .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
    .limit(clampLimit(limit, 200));
}

export type AdminAuditRow = Awaited<ReturnType<typeof listAdminAuditLog>>[number];
