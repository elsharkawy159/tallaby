import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getStoreTopUp } from "@workspace/lib/store-wallet/server";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { formatMoney } from "@/lib/i18n/format";

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
  const Icon = state === "succeeded" ? CheckCircle2 : state === "failed" ? XCircle : Clock;

  return (
    <div className="mx-auto w-full max-w-md p-4 sm:p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Icon
            className={state === "succeeded" ? "size-10 text-success" : state === "failed" ? "size-10 text-destructive" : "size-10 text-muted-foreground"}
            aria-hidden
          />
          <h1 className="text-lg font-bold">{t(`result.${state}.title`)}</h1>
          <p className="text-pretty text-sm text-muted-foreground">
            {t(`result.${state}.description`, { amount: formatMoney(Number(row.amount), locale) })}
          </p>
          <div className="flex gap-2">
            {state === "processing" && (
              <Button asChild variant="outline">
                <Link href={`/wallet/top-up?topUp=${row.id}`}>{t("refresh")}</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/wallet">{t("backToWallet")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
