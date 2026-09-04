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
