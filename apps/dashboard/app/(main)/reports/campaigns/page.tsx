import { Suspense } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { EmptyState, HomeCard } from "../../_components/home-ui";
import { ReportsShell } from "../reports.client";
import { parseReportRange, pickReportStore } from "../reports.lib";
import { CampaignReportData } from "./campaigns.data";
import { ReportsTabs } from "./campaigns.client";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Reports › Campaigns (ROADMAP.md F-26a): a UTM link builder and the store's
 * orders, delivered orders and revenue per source and campaign, with the
 * same store and period pickers as /reports.
 */
export default async function CampaignReportPage({
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
      <div className="space-y-4">
        <ReportsTabs />
        {storeId ? (
          <Suspense key={`${storeId}:${range}`} fallback={<CampaignSkeleton />}>
            <CampaignReportData storeId={storeId} range={range} />
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
      </div>
    </ReportsShell>
  );
}

function CampaignSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[330px] rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}
