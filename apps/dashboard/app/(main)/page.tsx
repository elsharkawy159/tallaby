import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AttentionData } from "./_components/attention.data";
import { HomeGreeting, HomeHeaderView, HomeSubtitle } from "./_components/home-header.data";
import { HomeKpisData, HomeMetricsData } from "./_components/home-kpis.data";
import { CommunityCard } from "./_components/community-card";
import { CustomerJourneyData } from "./_components/customer-journey.data";
import { TrafficSourcesData } from "./_components/traffic-sources.data";
import { ChannelSelect, HomeRangeProvider, RangePending, RangeSelect } from "./_components/home-range.client";
import { parseHomeChannel, parseHomeRange, resolveHomeChannel } from "./_components/home.shared";
import { getSellerStores } from "@/lib/stores/current-store.server";
import {
  ChartSkeleton,
  HomeLayout,
  KpisSkeleton,
  MetricsSkeleton,
  ListCardSkeleton,
  TableCardSkeleton,
} from "./_components/home.skeletons";
import { RecentOrdersData } from "./_components/recent-orders.data";
import { SalesChartData } from "./_components/sales-chart.data";
import { SetupChecklistData } from "./_components/setup-checklist.data";
import { TopProductsData } from "./_components/top-products.data";
import { TrialBannerData } from "./_components/trial-banner.data";
import { UnansweredQuestionsData } from "./_components/unanswered-questions.data";
import { WelcomeBanner } from "./_components/welcome-banner.client";
import { SignupPixelData } from "./_components/signup-pixel.data";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Seller home. Each section streams in behind its own Suspense boundary; the
 * period (`?range=7|30|90`) only re-renders the sections that depend on it.
 */
export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[]; channel?: string | string[]; welcome?: string | string[]; signup?: string | string[] }>;
}) {
  const [{ range: rawRange, channel: rawChannel, welcome, signup }, t, { stores }] = await Promise.all([
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
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                <ChannelSelect stores={stores.map(({ id, name }) => ({ id, name }))} />
                <RangeSelect />
              </div>
            }
          />
        }
        setup={
          <>
            {welcome === "1" && <WelcomeBanner />}
            {welcome === "1" && signup && (
              <Suspense fallback={null}>
                <SignupPixelData signup={signup} />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <TrialBannerData />
            </Suspense>
            <Suspense fallback={null}>
              <SetupChecklistData />
            </Suspense>
          </>
        }
        kpis={
          <RangePending>
            <Suspense fallback={<KpisSkeleton />}>
              <HomeKpisData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        metrics={
          <RangePending>
            <Suspense fallback={<MetricsSkeleton />}>
              <HomeMetricsData range={range} channel={channel} />
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
        journey={
          <RangePending>
            <Suspense fallback={<ListCardSkeleton rows={3} />}>
              <CustomerJourneyData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        attention={
          <Suspense fallback={<ListCardSkeleton />}>
            <AttentionData />
          </Suspense>
        }
        topProducts={
          <RangePending>
            <Suspense fallback={<ListCardSkeleton />}>
              <TopProductsData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        sources={
          <RangePending>
            <Suspense fallback={<ListCardSkeleton />}>
              <TrafficSourcesData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        orders={
          <Suspense fallback={<TableCardSkeleton />}>
            <RecentOrdersData />
          </Suspense>
        }
        questions={
          <Suspense fallback={<ListCardSkeleton rows={2} />}>
            <UnansweredQuestionsData />
          </Suspense>
        }
        community={<CommunityCard />}
      />
    </HomeRangeProvider>
  );
}
