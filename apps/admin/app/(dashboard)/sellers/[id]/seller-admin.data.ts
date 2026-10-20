import { logServerError } from "@workspace/db/log";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import {
  getSellerAccountForAdmin,
  listAdminAuditLog,
  listSellerIntegrationsForAdmin,
  listSellerStoresForAdmin,
  listStoreTopUpsForAdmin,
  listStoreWalletEntriesForAdmin,
} from "@workspace/lib/admin/server";

/*
 * Per-tab loaders for the seller page (PLAN.md P9-01, P9-02; tabs from
 * docs/admin-saas.md §3.4). Each tab fetches only what it shows. Fresh reads,
 * never cached (wallets and audit data). Null when the read fails, so the
 * rest of the page still renders.
 */

async function safe<T>(label: string, sellerId: string, load: () => Promise<T>): Promise<T | null> {
  await getCurrentAdminUser();
  try {
    return await load();
  } catch (error) {
    logServerError("admin", `seller ${label} load failed`, { sellerId }, error);
    return null;
  }
}

/** Plan, trial, fee and wallet summary of the account (Overview tab). */
export function getSellerAccountTab(sellerId: string) {
  return safe("account", sellerId, () => getSellerAccountForAdmin(sellerId));
}

export function getSellerStoresTab(sellerId: string) {
  return safe("stores", sellerId, () => listSellerStoresForAdmin(sellerId));
}

/** Wallet tab: account wallet, recent entries, top-ups and the store names for the adjustment form. */
export function getSellerWalletTab(sellerId: string) {
  return safe("wallet", sellerId, async () => {
    const [account, entries, topUps, stores] = await Promise.all([
      getSellerAccountForAdmin(sellerId),
      listStoreWalletEntriesForAdmin(sellerId, 50),
      listStoreTopUpsForAdmin(sellerId, 20),
      listSellerStoresForAdmin(sellerId),
    ]);
    return account ? { account, entries, topUps, stores } : null;
  });
}

export function getSellerAuditTab(sellerId: string) {
  return safe("audit", sellerId, () => listAdminAuditLog(sellerId, 50));
}

export type SellerAuditRows = NonNullable<Awaited<ReturnType<typeof getSellerAuditTab>>>;

/** Shape the existing panels (wallet, audit, integrations card) were written against. */
export type SellerAdminPanel = {
  account: NonNullable<Awaited<ReturnType<typeof getSellerAccountForAdmin>>>;
  stores: Awaited<ReturnType<typeof listSellerStoresForAdmin>>;
  integrations: Awaited<ReturnType<typeof listSellerIntegrationsForAdmin>>;
  walletEntries: Awaited<ReturnType<typeof listStoreWalletEntriesForAdmin>>;
  topUps: Awaited<ReturnType<typeof listStoreTopUpsForAdmin>>;
  audit: Awaited<ReturnType<typeof listAdminAuditLog>>;
};
