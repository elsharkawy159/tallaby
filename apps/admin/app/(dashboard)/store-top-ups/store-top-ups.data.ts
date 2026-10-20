// Read-only, for the Server Component page; deliberately not "use server".
import { getServiceClient } from "@workspace/db/supabase/service";
import { listManualTopUpsForAdmin, type AdminTopUpRow } from "@workspace/lib/admin/server";
import { TOP_UP_PROOF_BUCKET } from "@workspace/lib/store-wallet";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

export type TopUpWithProof = AdminTopUpRow & { proofUrl: string | null };

/** The queue, with short-lived signed links to each receipt (private bucket). */
export async function getStoreTopUps(view: "pending" | "reviewed"): Promise<TopUpWithProof[]> {
  try {
    await validateAdminAccess("canManageUsers");
  } catch {
    return [];
  }
  const rows = await listManualTopUpsForAdmin(view);
  const paths = rows.map((r) => r.proofPath).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await getServiceClient().storage.from(TOP_UP_PROOF_BUCKET).createSignedUrls(paths, 60 * 30);
    for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return rows.map((r) => ({ ...r, proofUrl: r.proofPath ? (urls.get(r.proofPath) ?? null) : null }));
}

