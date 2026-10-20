// Read-only, for the Server Component pages; deliberately not "use server".
import { getServiceClient } from "@workspace/db/supabase/service";
import { logServerError } from "@workspace/db/log";
import {
  getSellerAccountForAdmin,
  getStoreWalletBreakdownForAdmin,
  getStoreWalletTotals,
  InvalidWalletFiltersError,
  listStoreTopUpsPagedForAdmin,
  listStoreWalletAuditForAdmin,
  listStoreWalletEntriesPagedForAdmin,
  listStoreWalletsForAdmin,
  type AdminStoreTopUpRow,
  type Paged,
} from "@workspace/lib/admin/server";
import { TOP_UP_PROOF_BUCKET } from "@workspace/lib/store-wallet";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";

/**
 * Seller (store) wallet reads for /wallets and /wallets/sellers/[sellerId].
 * Every loader checks the admin session first. Fresh reads, never cached
 * (wallet data). Receipts live in a private bucket; the rows carry
 * short-lived signed links, only for the page being shown.
 */

export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type StoreTopUpWithProof = AdminStoreTopUpRow & { proofUrl: string | null };

async function load<T>(scope: string, run: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    await getCurrentAdminUser();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof InvalidWalletFiltersError) return { ok: false, error: "Invalid filters in the address bar." };
    logServerError("wallet", `admin ${scope} load failed`, {}, error);
    return { ok: false, error: `Could not load ${scope}.` };
  }
}

async function withProofUrls(page: Paged<AdminStoreTopUpRow>): Promise<Paged<StoreTopUpWithProof>> {
  const paths = page.rows.map((row) => row.proofPath).filter((path): path is string => !!path);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await getServiceClient().storage.from(TOP_UP_PROOF_BUCKET).createSignedUrls(paths, 60 * 30);
    for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return {
    totalCount: page.totalCount,
    rows: page.rows.map((row) => ({ ...row, proofUrl: row.proofPath ? (urls.get(row.proofPath) ?? null) : null })),
  };
}

export const loadStoreWalletTotals = () => load("wallet totals", () => getStoreWalletTotals());

export const loadStoreWallets = (filters: unknown) => load("seller wallets", () => listStoreWalletsForAdmin(filters));

export const loadStoreWalletEntries = (filters: unknown) =>
  load("wallet transactions", () => listStoreWalletEntriesPagedForAdmin(filters));

export const loadStoreTopUps = (filters: unknown) =>
  load("top-ups", async () => withProofUrls(await listStoreTopUpsPagedForAdmin(filters)));

export const loadStoreWalletAudit = (input: { sellerId?: string; limit?: number; offset?: number }) =>
  load("wallet audit log", () => listStoreWalletAuditForAdmin(input));

/** Header data of one seller's wallet page; `null` data = no such seller. */
export const loadSellerWallet = (sellerId: string) =>
  load("seller wallet", async () => {
    const account = await getSellerAccountForAdmin(sellerId);
    if (!account) return null;
    const breakdown = await getStoreWalletBreakdownForAdmin(sellerId);
    return { account, breakdown };
  });

export type SellerWalletHeader = NonNullable<Extract<Awaited<ReturnType<typeof loadSellerWallet>>, { ok: true }>["data"]>;
