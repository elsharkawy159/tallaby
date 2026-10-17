import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AttentionData } from "./_components/attention.data";
import { HomeGreeting, HomeHeaderView, HomeSubtitle } from "./_components/home-header.data";
import { HomeKpisData } from "./_components/home-kpis.data";
import { ChannelSelect, HomeRangeProvider, RangePending, RangeTabs } from "./_components/home-range.client";
import { parseHomeChannel, parseHomeRange, resolveHomeChannel } from "./_components/home.shared";
import { getSellerStores } from "@/lib/stores/current-store.server";
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
  searchParams: Promise<{ range?: string | string[]; channel?: string | string[] }>;
}) {
  const [{ range: rawRange, channel: rawChannel }, t, { stores }] = await Promise.all([
    searchParams,
    getTranslations("home.header"),
    getSellerStores(),
  ]);
  const range = parseHomeRange(rawRange);
  // A store channel must be one of the seller's own stores (never trust the URL).
  const channel = resolveHomeChannel(
    parseHomeChannel(rawChannel),
    stores.map((store) => store.id),
  );

  return (
    <HomeRangeProvider range={range} channel={channel}>
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
            rangeControl={
              <div className="flex flex-wrap items-center gap-2">
                <ChannelSelect stores={stores.map(({ id, name }) => ({ id, name }))} />
                <RangeTabs />
              </div>
            }
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
              <HomeKpisData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        chart={
          <RangePending>
            <Suspense fallback={<ChartSkeleton />}>
              <SalesChartData range={range} channel={channel} />
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
              <TopProductsData range={range} channel={channel} />
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
