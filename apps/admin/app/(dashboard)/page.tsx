import Link from 'next/link'
import { Suspense } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { parseOverviewPeriodKey, periodLabel, resolveOverviewPeriod } from '@/lib/analytics/overview.lib'
import { DEFAULT_OVERVIEW_PERIOD, OVERVIEW_PERIOD_GROUPS } from '@/lib/analytics/overview.types'
import { AnalyticsRefreshButton } from './_components/analytics-refresh-button'
import {
  AttentionSection,
  GrowthSection,
  KpiSection,
  MixSection,
  SnapshotSection,
  StoresSection,
  TrendSection
} from './dashboard.sections'
import { CreditsSection, LeadersSection, RecentTopUpsSection, TopUpsSection } from './dashboard.money'
import {
  OverviewKpisSkeleton,
  OverviewMixSkeleton,
  OverviewPanelSkeleton,
  OverviewSnapshotSkeleton,
  OverviewStoresSkeleton
} from './dashboard.skeleton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Admin home, "Platform overview" (docs/admin-saas.md §3.9). The page fetches
 * nothing itself: each section streams behind its own Suspense boundary, and
 * the analytics queries share one process-wide concurrency limit
 * (analytics.lib.ts `runLimited`). `?range=` picks the period (Cairo days, see
 * resolveOverviewPeriod), compared with the one before; old `7|30|90` links still work.
 */
export default async function DashboardPage ({ searchParams }: PageProps) {
  const key = parseOverviewPeriodKey((await searchParams).range)
  const period = resolveOverviewPeriod(key, new Date())

  return (
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[22px] font-bold">Platform overview</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
            <b className="font-semibold text-foreground">{period.rangeLabel}</b> · compared with {period.prevLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <nav className="flex flex-wrap gap-2" aria-label="Period">
            {OVERVIEW_PERIOD_GROUPS.map((group, g) => (
              <div key={g} className="inline-flex flex-wrap gap-0.5 rounded-[11px] border bg-card p-[3px]">
                {group.map((option) => (
                  <Link
                    key={option}
                    href={option === DEFAULT_OVERVIEW_PERIOD ? '/' : `/?range=${option}`}
                    aria-current={option === key ? 'page' : undefined}
                    className={cn(
                      'flex h-8 items-center rounded-lg px-2.5 text-[13px] whitespace-nowrap text-muted-foreground hover:text-foreground sm:px-3',
                      option === key && 'bg-primary-soft font-semibold text-primary-ink hover:text-primary-ink'
                    )}
                  >
                    {periodLabel(option)}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <AnalyticsRefreshButton />
        </div>
      </div>

      <Suspense fallback={<OverviewSnapshotSkeleton />}>
        <SnapshotSection />
      </Suspense>

      <Suspense key={`kpis-${key}`} fallback={<OverviewKpisSkeleton />}>
        <KpiSection period={period} />
      </Suspense>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Suspense key={`trend-${key}`} fallback={<OverviewPanelSkeleton />}>
          <TrendSection period={period} />
        </Suspense>
        <Suspense fallback={<OverviewPanelSkeleton />}>
          <AttentionSection />
        </Suspense>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Suspense key={`growth-${key}`} fallback={<OverviewPanelSkeleton height="h-[240px]" />}>
          <GrowthSection period={period} />
        </Suspense>
        <Suspense key={`topups-${key}`} fallback={<OverviewPanelSkeleton height="h-[240px]" />}>
          <TopUpsSection period={period} />
        </Suspense>
      </section>

      <Suspense key={`credits-${key}`} fallback={<OverviewPanelSkeleton height="h-72" />}>
        <CreditsSection period={period} />
      </Suspense>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Suspense key={`recent-${key}`} fallback={<OverviewPanelSkeleton height="h-64" />}>
          <RecentTopUpsSection period={period} />
        </Suspense>
        <Suspense fallback={<OverviewPanelSkeleton height="h-64" />}>
          <LeadersSection />
        </Suspense>
      </section>

      <Suspense key={`mix-${key}`} fallback={<OverviewMixSkeleton />}>
        <MixSection period={period} />
      </Suspense>

      <Suspense key={`stores-${key}`} fallback={<OverviewStoresSkeleton />}>
        <StoresSection period={period} />
      </Suspense>
    </div>
  )
}
