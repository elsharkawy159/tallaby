import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AttentionData } from "./_components/attention.data";
import { HomeGreeting, HomeHeaderView, HomeSubtitle } from "./_components/home-header.data";
import { HomeKpisData } from "./_components/home-kpis.data";
import { HomeRangeProvider, RangePending, RangeTabs } from "./_components/home-range.client";
import { parseHomeRange } from "./_components/home.shared";
import {
  ChartSkeleton,
  HomeLayout,
  KpisSkeleton,
  ListCardSkeleton,
  TableCardSkeleton,
} from "./_components/home.skeletons";
import { RecentOrdersData } from "./_components/recent-orders.data";
import { SalesChartData } from "./_components/sales-chart.data";
import { SetupChecklistData } from "./_components/setup-checklist.data";
import { TopProductsData } from "./_components/top-products.data";
import { UnansweredQuestionsData } from "./_components/unanswered-questions.data";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Seller home. Each section streams in behind its own Suspense boundary; the
 * period (`?range=7|30|90`) only re-renders the sections that depend on it.
 */
export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const [{ range: rawRange }, t] = await Promise.all([
    searchParams,
    getTranslations("home.header"),
  ]);
  const range = parseHomeRange(rawRange);

  return (
    <HomeRangeProvider range={range}>
      <HomeLayout
        header={
          <HomeHeaderView
            title={
              <Suspense fallback={<Skeleton className="h-8 w-48" />}>
                <HomeGreeting />
              </Suspense>
            }
            subtitle={
              <Suspense fallback={<Skeleton className="mt-2 h-4 w-64" />}>
                <HomeSubtitle />
              </Suspense>
            }
            addLabel={t("addProduct")}
            rangeControl={<RangeTabs />}
          />
        }
        setup={
          <Suspense fallback={null}>
            <SetupChecklistData />
          </Suspense>
        }
        kpis={
          <RangePending>
            <Suspense fallback={<KpisSkeleton />}>
              <HomeKpisData range={range} />
            </Suspense>
          </RangePending>
        }
        chart={
          <RangePending>
            <Suspense fallback={<ChartSkeleton />}>
              <SalesChartData range={range} />
            </Suspense>
          </RangePending>
        }
        attention={
          <Suspense fallback={<ListCardSkeleton />}>
            <AttentionData />
          </Suspense>
        }
        orders={
          <Suspense fallback={<TableCardSkeleton />}>
            <RecentOrdersData />
          </Suspense>
        }
        topProducts={
          <RangePending>
            <Suspense fallback={<ListCardSkeleton />}>
              <TopProductsData range={range} />
            </Suspense>
          </RangePending>
        }
        questions={
          <Suspense fallback={<ListCardSkeleton rows={2} />}>
            <UnansweredQuestionsData />
          </Suspense>
        }
      />
    </HomeRangeProvider>
  );
}
