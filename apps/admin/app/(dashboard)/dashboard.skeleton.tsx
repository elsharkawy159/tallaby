import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'

/**
 * One skeleton per streamed section of the dashboard. Each mirrors the shape
 * and height of the real content so sections swap in without the page jumping.
 */

export function MetricsSkeleton () {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartCardSkeleton ({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="h-[300px]">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  )
}

export function RevenueAndStatusSkeleton () {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
      <ChartCardSkeleton className="col-span-full lg:col-span-4" />
      <ChartCardSkeleton className="col-span-full lg:col-span-3" />
    </div>
  )
}

export function TablesSkeleton () {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-md" />
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function CategoryAndActivitySkeleton () {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <ChartCardSkeleton />
      <ChartCardSkeleton />
    </div>
  )
}

/* Platform overview (admin home) skeletons, one per streamed section. */

const panel = 'rounded-[14px] border bg-card'

export function OverviewKpisSkeleton () {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`${panel} space-y-2.5 px-[18px] py-4`}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function OverviewPanelSkeleton ({ height = 'h-[360px]', className = '' }: { height?: string, className?: string }) {
  return (
    <div className={`${panel} space-y-4 p-5 ${className}`}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className={`${height} w-full`} />
    </div>
  )
}

export function OverviewMixSkeleton () {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <OverviewPanelSkeleton height="h-44" />
      <OverviewPanelSkeleton height="h-44" />
      <OverviewPanelSkeleton height="h-44" className="lg:col-span-2 xl:col-span-1" />
    </div>
  )
}

export function OverviewStoresSkeleton () {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <OverviewPanelSkeleton height="h-72" />
      <OverviewPanelSkeleton height="h-72" />
    </div>
  )
}
