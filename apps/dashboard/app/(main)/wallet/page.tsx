import { redirect } from "next/navigation";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { StoreWalletSection } from "./store-wallet.data";
import { parseEntryFilter } from "./store-wallet.server";

export const dynamic = "force-dynamic";

/** Store wallet: balance, top-up and every ledger entry (moved from /financial, 2026-10-18). */
export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ entries?: string | string[]; before?: string | string[] }>;
}) {
  const [{ entries, before }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;

  return (
    <div className="p-4 sm:p-6">
      <StoreWalletSection
        sellerId={seller.sellerId}
        filter={parseEntryFilter(entries)}
        before={typeof before === "string" ? before : null}
      />
    </div>
  );
}
