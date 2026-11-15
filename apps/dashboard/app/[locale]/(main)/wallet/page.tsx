import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { StoreWalletSection } from "./store-wallet.data";
import { parseEntryFilter } from "./store-wallet.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store wallet: balance, top-up and every ledger entry (moved from /financial, 2026-10-18). */
export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ entries?: string | string[]; before?: string | string[]; topup?: string | string[] }>;
}) {
  const [{ entries, before, topup }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect({ href: seller.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (seller instanceof Error) throw seller;

  return (
    <PageContainer>
      <StoreWalletSection
        sellerId={seller.sellerId}
        filter={parseEntryFilter(entries)}
        before={typeof before === "string" ? before : null}
        openTopUp={topup === "1"}
      />
    </PageContainer>
  );
}
