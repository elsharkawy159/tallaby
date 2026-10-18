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

/**
 * Everything the seller page shows about the account, its stores, the store
 * wallet and the admin audit trail (PLAN.md P9-01, P9-02). Fresh reads, never
 * cached (wallets and audit data). Integration rows carry status and last
 * error only, never credentials or config.
 */
export async function getSellerAdminPanel(sellerId: string) {
  await getCurrentAdminUser();

  try {
    const [account, stores, integrations, walletEntries, topUps, audit] = await Promise.all([
      getSellerAccountForAdmin(sellerId),
      listSellerStoresForAdmin(sellerId),
      listSellerIntegrationsForAdmin(sellerId),
      listStoreWalletEntriesForAdmin(sellerId, 50),
      listStoreTopUpsForAdmin(sellerId, 20),
      listAdminAuditLog(sellerId, 50),
    ]);
    if (!account) return null;
    return { account, stores, integrations, walletEntries, topUps, audit };
  } catch (error) {
    logServerError("admin", "seller panel load failed", { sellerId }, error);
    return null;
  }
}

export type SellerAdminPanel = NonNullable<Awaited<ReturnType<typeof getSellerAdminPanel>>>;
