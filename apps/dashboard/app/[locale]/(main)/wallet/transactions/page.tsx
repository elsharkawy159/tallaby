import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { parseEntryFilter } from "../store-wallet.server";
import { WalletTransactionsSection } from "./transactions.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Wallet › Transactions: every store wallet entry, moved off /wallet (owner, 2026-11-27). */
export default async function WalletTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ entries?: string | string[]; before?: string | string[] }>;
}) {
  const [{ entries, before }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect({ href: seller.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (seller instanceof Error) throw seller;

  return (
    <PageContainer>
      <WalletTransactionsSection
        sellerId={seller.sellerId}
        filter={parseEntryFilter(entries)}
        before={typeof before === "string" ? before : null}
      />
    </PageContainer>
  );
}
