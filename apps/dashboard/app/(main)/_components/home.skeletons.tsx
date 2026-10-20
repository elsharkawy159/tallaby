import { Skeleton } from "@workspace/ui/components/skeleton";
import { HomeCard } from "./home-ui";

/* Placeholders shaped like each home section, so streaming in causes no layout shift. */

export function RangeTabsSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
      <Skeleton className="h-[40px] rounded-[11px] sm:w-[180px]" />
      <Skeleton className="h-[40px] rounded-[11px] sm:w-[140px]" />
    </div>
  );
}

export function HomeHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <RangeTabsSkeleton />
        <Skeleton className="h-[42px] w-full rounded-xl sm:w-32" />
      </div>
    </div>
  );
}

export function KpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <HomeCard key={i} className="flex flex-col gap-3.5 p-3.5 sm:px-5 sm:py-[18px]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-9 rounded-[10px]" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-[22px] w-36" />
        </HomeCard>
      ))}
    </div>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="space-y-1.5 px-5 pt-[18px]">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <HomeCard>
      <CardHeaderSkeleton />
      <div className="flex gap-7 px-5 pt-3.5">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="px-5 pb-[18px] pt-2">
        <Skeleton className="h-[240px] w-full rounded-xl" />
      </div>
    </HomeCard>
  );
}

export function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <HomeCard>
      <CardHeaderSkeleton />
      <div className="flex flex-col gap-4 px-5 pb-5 pt-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-[10px]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </HomeCard>
  );
}

export function TableCardSkeleton() {
  return (
    <HomeCard className="overflow-hidden">
      <CardHeaderSkeleton />
      <div className="mt-3.5 border-t">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-[30px] rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </HomeCard>
  );
}

/** Whole-page fallback for `loading.tsx`. */
export function HomeSkeleton() {
  return (
    <HomeLayout
      header={<HomeHeaderSkeleton />}
      kpis={<KpisSkeleton />}
      chart={<ChartSkeleton />}
      attention={<ListCardSkeleton />}
      orders={<TableCardSkeleton />}
      topProducts={<ListCardSkeleton />}
      questions={<ListCardSkeleton rows={2} />}
    />
  );
}

/** Grid shared by the page and its skeleton. */
export function HomeLayout(slots: {
  header: React.ReactNode;
  setup?: React.ReactNode;
  kpis: React.ReactNode;
  chart: React.ReactNode;
  attention: React.ReactNode;
  orders: React.ReactNode;
  topProducts: React.ReactNode;
  questions: React.ReactNode;
}) {
  const row = "grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]";
  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-3.5 pb-20 pt-5 sm:px-6 sm:pb-[72px] sm:pt-7">
      {slots.header}
      {slots.setup}
      {slots.kpis}
      <div className={row}>
        {slots.chart}
        {slots.attention}
      </div>
      <div className={row}>
        {slots.orders}
        {slots.topProducts}
      </div>
      {slots.questions}
    </div>
  );
}
