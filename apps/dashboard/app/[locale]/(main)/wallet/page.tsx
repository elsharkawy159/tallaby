import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Note, PageContainer } from "@/components/seller-ui";
import { isAccessError, loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { TOP_UP_TO_GO_ONLINE_NOTICE } from "@/lib/billing/top-up-to-go-online.lib";
import { StoreWalletSection } from "./store-wallet.data";
import { parseEntryFilter } from "./store-wallet.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store wallet: balance, top-up and every ledger entry (moved from /financial, 2026-10-18). */
export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ entries?: string | string[]; before?: string | string[]; topup?: string | string[]; notice?: string | string[] }>;
}) {
  const [{ entries, before, topup, notice }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect({ href: seller.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (seller instanceof Error) throw seller;
  // Sent here by a refused Publish / "Website live" (docs/seller-top-up-rules.md §4). Only while it is
  // still true, so the line goes once the seller is activated (loadOrderLock is cached per request).
  const goOnlineNotice =
    notice === TOP_UP_TO_GO_ONLINE_NOTICE && (await loadOrderLock(seller.sellerId)).storeOffline
      ? (await getTranslations("orderLock"))("goOnlineTopUp")
      : null;

  return (
    <PageContainer>
      {goOnlineNotice && (
        <Note tone="amber">
          <span role="alert">{goOnlineNotice}</span>
        </Note>
      )}
      <StoreWalletSection
        sellerId={seller.sellerId}
        filter={parseEntryFilter(entries)}
        before={typeof before === "string" ? before : null}
        openTopUp={topup === "1"}
      />
    </PageContainer>
  );
}
