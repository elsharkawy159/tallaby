import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AttentionData } from "../_components/attention.data";
import { HomeGreeting, HomeHeaderView, HomeSubtitle } from "../_components/home-header.data";
import { HomeKpisData, HomeLockedMetricsData, HomeMetricsData } from "../_components/home-kpis.data";
import { AffiliateCard } from "../_components/affiliate-card";
import { CommunityCard } from "../_components/community-card";
import { CustomerJourneyData } from "../_components/customer-journey.data";
import { TrafficSourcesData } from "../_components/traffic-sources.data";
import { ChannelSelect, HomeRangeProvider, RangePending, RangeSelect } from "../_components/home-range.client";
import { parseHomeChannel, parseHomeRange, resolveHomeChannel } from "../_components/home.shared";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLockedNotice, StoreOfflineHomeCard } from "@/components/orders/orders-locked";
import { currentGraceNoticeStoreReady } from "@/lib/billing/grace-notice.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import {
  ChartSkeleton,
  HomeLayout,
  HomeLockedLayout,
  HomeOfflineLayout,
  HomeSetupLayout,
  KpisSkeleton,
  MetricsSkeleton,
  ListCardSkeleton,
  TableCardSkeleton,
} from "../_components/home.skeletons";
import { RecentOrdersData } from "../_components/recent-orders.data";
import { SalesChartData } from "../_components/sales-chart.data";
import { SetupChecklistData } from "../_components/setup-checklist.data";
import { TopProductsData } from "../_components/top-products.data";
import { TrialBannerData } from "../_components/trial-banner.data";
import { UnansweredQuestionsData } from "../_components/unanswered-questions.data";
import { WelcomeBanner } from "../_components/welcome-banner.client";
import { SignupPixelData } from "../_components/signup-pixel.data";
import { getHomeSnapshot } from "../_components/home.queries";
import { isSetupDone, showSetupOnlyHome } from "../_components/setup-checklist.lib";
import { SetupHomeData } from "../_components/setup-home.data";
import { welcomeLandingHref } from "../stores/[storeId]/welcome/welcome.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Seller home. Each section streams in behind its own Suspense boundary; the
 * period (`?range=7|30|90`) only re-renders the sections that depend on it.
 */
export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[]; channel?: string | string[]; welcome?: string | string[]; signup?: string | string[] }>;
}) {
  const lockPromise = currentOrderLock();
  const [{ range: rawRange, channel: rawChannel, welcome, signup }, { stores }, orderLock, snapshot, graceStoreReady] = await Promise.all([
    searchParams,
    getSellerStores(),
    lockPromise,
    // Cached per request; the sections below read the same snapshot.
    getHomeSnapshot(),
    // The top-up notice waits for a published store with a product (owner, 2026-11-13).
    lockPromise.then(currentGraceNoticeStoreReady),
  ]);
  const range = parseHomeRange(rawRange);
  // A store channel must be one of the seller's own stores (never trust the URL).
  const channel = resolveHomeChannel(
    parseHomeChannel(rawChannel),
    stores.map((store) => store.id),
  );

  const setupOnly =
    snapshot !== null &&
    showSetupOnlyHome({ flags: snapshot.setup, storeId: snapshot.setupStoreId, hasRealOrders: snapshot.hasRealOrders });

  // Right after signup, a new seller lands on the store's welcome page once; the pixel and greeting go with it.
  const landing = welcomeLandingHref({ welcome, signup, setupOnly, storeId: snapshot?.setupStoreId ?? null });
  if (landing) redirect({ href: landing, locale: await getLocale() });

  const title = (
    <Suspense fallback={<Skeleton className="h-8 w-48" />}>
      <HomeGreeting />
    </Suspense>
  );
  const subtitle = (
    <Suspense fallback={<Skeleton className="mt-2 h-4 w-64" />}>
      <HomeSubtitle channel={channel} />
    </Suspense>
  );

  // Every store offline (the trial's days ended with no top-up, docs/seller-top-up-rules.md §4): only the
  // reason and the top-up, ahead of the setup-only home too; no metric, list or setup section renders, so
  // none of their queries run (ROADMAP.md F-84j). No subtitle: its "almost ready" and "how your store is
  // doing" lines don't fit an offline store.
  if (orderLock.storeOffline) {
    return (
      <HomeOfflineLayout
        header={<HomeHeaderView title={title} subtitle={null} rangeControl={null} />}
        offline={<StoreOfflineHomeCard lock={orderLock} />}
      />
    );
  }

  const notices = (
    <>
      {/* Before any order, the top-up notice also waits for the whole home setup (owner, 2026-11-18): sellers left on seeing it too early. */}
      <OrdersLockedNotice
        lock={orderLock}
        storeReady={graceStoreReady && snapshot !== null && isSetupDone(snapshot.setup, snapshot.setupStoreId)}
      />
      {/* Only when the welcome page didn't take over (no store, or setup already done). */}
      {welcome === "1" && <WelcomeBanner />}
      {welcome === "1" && signup && (
        <Suspense fallback={null}>
          <SignupPixelData signup={signup} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <TrialBannerData />
      </Suspense>
    </>
  );

  // New seller, setup open, no real order yet: only the four setup steps, so no metrics query runs
  // (ROADMAP.md F-86). The dismiss cookie never hides this; it only hides the checklist card below.
  if (setupOnly) {
    return (
      <HomeSetupLayout
        header={<HomeHeaderView title={title} subtitle={subtitle} rangeControl={null} />}
        notices={notices}
        steps={<SetupHomeData snapshot={snapshot} />}
        affiliate={<AffiliateCard />}
        community={<CommunityCard />}
      />
    );
  }

  const header = (
    <HomeHeaderView
      title={title}
      subtitle={subtitle}
      rangeControl={
        <>
          <RangeSelect />
          <ChannelSelect stores={stores.map(({ id, name }) => ({ id, name }))} />
        </>
      }
    />
  );
  const setup = (
    <>
      {notices}
      <Suspense fallback={null}>
        <SetupChecklistData />
      </Suspense>
    </>
  );
  const attention = (
    <Suspense fallback={<ListCardSkeleton />}>
      <AttentionData channel={channel} />
    </Suspense>
  );
  const sources = (
    <RangePending>
      <Suspense fallback={<ListCardSkeleton />}>
        <TrafficSourcesData range={range} channel={channel} />
      </Suspense>
    </RangePending>
  );
  const questions = (
    <Suspense fallback={<ListCardSkeleton rows={2} />}>
      <UnansweredQuestionsData />
    </Suspense>
  );

  // Orders locked (not activated): the sales sections aren't rendered, so their queries never run; the strip shows only the order count (ROADMAP.md F-68, F-84).
  if (orderLock.ordersLocked) {
    return (
      <HomeRangeProvider range={range} channel={channel}>
        <HomeLockedLayout
          header={header}
          setup={setup}
          metrics={
            <RangePending>
              <Suspense fallback={<MetricsSkeleton />}>
                <HomeLockedMetricsData range={range} channel={channel} />
              </Suspense>
            </RangePending>
          }
          attention={attention}
          sources={sources}
          questions={questions}
          affiliate={<AffiliateCard />}
          community={<CommunityCard />}
        />
      </HomeRangeProvider>
    );
  }

  return (
    <HomeRangeProvider range={range} channel={channel}>
      <HomeLayout
        header={header}
        setup={setup}
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
        attention={attention}
        topProducts={
          <RangePending>
            <Suspense fallback={<ListCardSkeleton />}>
              <TopProductsData range={range} channel={channel} />
            </Suspense>
          </RangePending>
        }
        sources={sources}
        orders={
          <Suspense fallback={<TableCardSkeleton />}>
            <RecentOrdersData />
          </Suspense>
        }
        questions={questions}
        affiliate={<AffiliateCard />}
        community={<CommunityCard />}
      />
    </HomeRangeProvider>
  );
}
