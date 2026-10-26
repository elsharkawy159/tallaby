import Link from 'next/link'
import { Suspense } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { parseOverviewRange } from '@/lib/analytics/overview.lib'
import { OVERVIEW_RANGES } from '@/lib/analytics/overview.types'
import { AnalyticsRefreshButton } from './_components/analytics-refresh-button'
import {
  AttentionSection,
  KpiSection,
  MixSection,
  StoresSection,
  TrendSection
} from './dashboard.sections'
import {
  OverviewKpisSkeleton,
  OverviewMixSkeleton,
  OverviewPanelSkeleton,
  OverviewStoresSkeleton
} from './dashboard.skeleton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Admin home, "Platform overview". The page fetches nothing itself: each
 * section streams behind its own Suspense boundary, and the analytics queries
 * share one process-wide concurrency limit (analytics.lib.ts `runLimited`).
 * `?range=7|30|90` picks the window (Cairo days), compared with the one before.
 */
export default async function DashboardPage ({ searchParams }: PageProps) {
  const range = parseOverviewRange((await searchParams).range)

  return (
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold">Platform overview</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Last {range} days, compared with the previous {range} days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <nav className="inline-flex gap-0.5 rounded-[11px] border bg-card p-[3px]" aria-label="Period">
            {OVERVIEW_RANGES.map((days) => (
              <Link
                key={days}
                href={days === 30 ? '/' : `/?range=${days}`}
                aria-current={days === range ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center rounded-lg px-3 text-[13px] whitespace-nowrap text-muted-foreground hover:text-foreground',
                  days === range && 'bg-primary-soft font-semibold text-primary-ink hover:text-primary-ink'
                )}
              >
                {days} days
              </Link>
            ))}
          </nav>
          <AnalyticsRefreshButton />
        </div>
      </div>

      <Suspense key={`kpis-${range}`} fallback={<OverviewKpisSkeleton />}>
        <KpiSection range={range} />
      </Suspense>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Suspense key={`trend-${range}`} fallback={<OverviewPanelSkeleton />}>
          <TrendSection range={range} />
        </Suspense>
        <Suspense fallback={<OverviewPanelSkeleton />}>
          <AttentionSection />
        </Suspense>
      </section>

      <Suspense key={`mix-${range}`} fallback={<OverviewMixSkeleton />}>
        <MixSection range={range} />
      </Suspense>

      <Suspense key={`stores-${range}`} fallback={<OverviewStoresSkeleton />}>
        <StoresSection range={range} />
      </Suspense>
    </div>
  )
}
