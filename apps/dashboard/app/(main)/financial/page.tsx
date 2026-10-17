import { redirect } from "next/navigation";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { FinancialSection } from "./financial.data";
import { StoreWalletSection } from "./store-wallet.data";
import { parseEntryFilter } from "./store-wallet.server";

export const dynamic = "force-dynamic";

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ entries?: string | string[]; before?: string | string[] }>;
}) {
  const [{ entries, before }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;

  return (
    <div className="space-y-8">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <StoreWalletSection
          sellerId={seller.sellerId}
          filter={parseEntryFilter(entries)}
          before={typeof before === "string" ? before : null}
        />
      </div>
      <FinancialSection />
    </div>
  );
}
