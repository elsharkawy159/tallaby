import { Suspense } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { EmptyState, HomeCard } from "../_components/home-ui";
import { ReportsShell } from "./reports.client";
import { StoreReportData } from "./reports.data";
import { ReportsTabs } from "./campaigns/campaigns.client";
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
      {/* Overview | Campaigns (ROADMAP.md F-26a). */}
      <div className="mb-4">
        <ReportsTabs />
      </div>
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
              <Button asChild size="sm">
                <Link href="/stores">{t("noStoreCta")}</Link>
              </Button>
            }
          />
        </HomeCard>
      )}
    </ReportsShell>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
      <Skeleton className="h-[320px] rounded-2xl" />
    </div>
  );
}
