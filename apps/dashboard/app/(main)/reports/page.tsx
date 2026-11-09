import { Suspense } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerButton } from "@/components/seller-ui";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { EmptyState, HomeCard } from "../_components/home-ui";
import { ReportsShell } from "./reports.client";
import { StoreReportData } from "./reports.data";
import { parseReportRange, pickReportStore } from "./reports.lib";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Reports (ROADMAP.md F-15a): one store's funnel, sales by source, refusals
 * by governorate and best/worst products for 7, 30 or 90 Cairo days.
 * `?store=` is only kept when it is one of the seller's own stores; the
 * sidebar's store is the default.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string | string[]; range?: string | string[] }>;
}) {
  // Sales totals wait for activation like the orders behind them (ROADMAP.md F-68).
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;

  const [params, { stores, selected }, t] = await Promise.all([
    searchParams,
    getSellerStores(),
    getTranslations("reports"),
  ]);
  const range = parseReportRange(params.range);
  const storeId = pickReportStore(
    params.store,
    stores.map((s) => s.id),
    selected?.id ?? null,
  );

  return (
    <ReportsShell stores={stores.map(({ id, name }) => ({ id, name }))} storeId={storeId} range={range}>
      {storeId ? (
        <Suspense key={`${storeId}:${range}`} fallback={<ReportSkeleton />}>
          <StoreReportData storeId={storeId} range={range} />
        </Suspense>
      ) : (
        <HomeCard>
          <EmptyState
            icon={Store}
            title={t("noStoreTitle")}
            description={t("noStoreDescription")}
            action={
              <SellerButton asChild size="sm">
                <Link href="/stores">{t("noStoreCta")}</Link>
              </SellerButton>
            }
          />
        </HomeCard>
      )}
    </ReportsShell>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-3.5 max-[1180px]:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-[24px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1">
        <Skeleton className="h-[340px] rounded-[24px]" />
        <Skeleton className="h-[340px] rounded-[24px]" />
      </div>
      <Skeleton className="h-[320px] rounded-[24px]" />
    </div>
  );
}
