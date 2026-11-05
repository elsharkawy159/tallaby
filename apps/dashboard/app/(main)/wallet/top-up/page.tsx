import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { topUpCredit } from "@workspace/lib/store-wallet";
import { getStoreTopUp } from "@workspace/lib/store-wallet/server";
import { IconTile, PageContainer, SellerButton, SellerCard } from "@/components/seller-ui";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { walletMoney } from "../store-wallet.lib";

export const dynamic = "force-dynamic";

/**
 * Kashier sends the seller back here (PLAN.md P6-09). The status shown is the
 * stored one, set only by the signed webhook; the redirect's query string is
 * never trusted.
 */
export default async function TopUpReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ topUp?: string | string[] }>;
}) {
  const [{ topUp }, seller] = await Promise.all([searchParams, requireSeller().catch((error) => error)]);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;

  const row = typeof topUp === "string" ? await getStoreTopUp(seller.sellerId, topUp) : null;
  if (!row) redirect("/wallet");

  const [t, locale] = await Promise.all([getTranslations("storeWallet.topUp"), getLocale()]);
  const state = row.status === "succeeded" ? "succeeded" : row.status === "failed" || row.status === "cancelled" ? "failed" : "processing";
  // What the wallet gets, not the EGP paid: the same until the USD switch.
  const credit = topUpCredit(row);

  return (
    <PageContainer className="max-w-[480px]">
      <SellerCard>
        <div className="flex flex-col items-center gap-2.5 px-[22px] py-8 text-center">
          <IconTile
            icon={state === "succeeded" ? CheckCircle2 : state === "failed" ? XCircle : Clock}
            tone={state === "succeeded" ? "success" : state === "failed" ? "danger" : "accent"}
            size="lg"
          />
          <h1 className="text-lg font-bold text-(--s-ink)">{t(`result.${state}.title`)}</h1>
          <p className="text-pretty text-[13px] text-(--s-muted)">
            {t(`result.${state}.description`, { amount: walletMoney(Number(credit.amount), credit.currency, locale) })}
          </p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            {state === "processing" && (
              <SellerButton asChild variant="outline">
                <Link href={`/wallet/top-up?topUp=${row.id}`}>{t("refresh")}</Link>
              </SellerButton>
            )}
            <SellerButton asChild variant="solid">
              <Link href="/wallet">{t("backToWallet")}</Link>
            </SellerButton>
          </div>
        </div>
      </SellerCard>
    </PageContainer>
  );
}
