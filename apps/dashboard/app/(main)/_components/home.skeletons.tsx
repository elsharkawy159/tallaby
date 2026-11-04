import { Skeleton } from "@workspace/ui/components/skeleton";
import { KpiGrid, PageContainer, SellerCard } from "@/components/seller-ui";

/* Placeholders shaped like each home section, so streaming in causes no layout shift. */

export function HomeHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 max-[720px]:items-stretch">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2 max-[720px]:w-full">
        <Skeleton className="h-[42px] w-36 rounded-full max-[720px]:flex-1" />
        <Skeleton className="h-[42px] w-36 rounded-full max-[720px]:flex-1" />
        <Skeleton className="h-[42px] w-32 rounded-full max-[720px]:w-full" />
      </div>
    </div>
  );
}

export function KpisSkeleton() {
  return (
    <KpiGrid>
      {Array.from({ length: 4 }, (_, i) => (
        <SellerCard key={i} className="flex flex-col gap-2 px-5 pb-4 pt-[18px] max-[480px]:p-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-[22px] w-32 max-w-full" />
        </SellerCard>
      ))}
    </KpiGrid>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="space-y-1.5 px-[22px] pt-5 max-[600px]:px-4 max-[600px]:pt-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <SellerCard>
      <CardHeaderSkeleton />
      <div className="flex gap-[18px] px-[22px] pt-3.5 max-[600px]:px-4">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="px-[22px] pb-[18px] pt-2 max-[600px]:px-4">
        <Skeleton className="h-[230px] w-full rounded-2xl" />
      </div>
    </SellerCard>
  );
}

export function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SellerCard>
      <CardHeaderSkeleton />
      <div className="flex flex-col gap-4 px-[22px] pb-5 pt-4 max-[600px]:px-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </SellerCard>
  );
}

export function TableCardSkeleton() {
  return (
    <SellerCard className="overflow-hidden">
      <CardHeaderSkeleton />
      <div className="mt-3.5 border-t border-(--s-line-soft)">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-(--s-line-soft) px-[22px] py-3.5 last:border-b-0 max-[600px]:px-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-[30px] rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </SellerCard>
  );
}

export function MetricsSkeleton() {
  return (
    <SellerCard className="grid grid-cols-4 gap-px overflow-hidden bg-(--s-line-soft) max-[1180px]:grid-cols-2 max-[480px]:grid-cols-1">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 bg-(--s-surface) px-5 py-3.5">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </SellerCard>
  );
}

/** Whole-page fallback for `loading.tsx`. */
export function HomeSkeleton() {
  return (
    <HomeLayout
      header={<HomeHeaderSkeleton />}
      kpis={<KpisSkeleton />}
      metrics={<MetricsSkeleton />}
      chart={<ChartSkeleton />}
      journey={<ListCardSkeleton rows={3} />}
      attention={<ListCardSkeleton />}
      topProducts={<ListCardSkeleton />}
      sources={<ListCardSkeleton />}
      orders={<TableCardSkeleton />}
    />
  );
}

/** Stretches cards to their row's height; some are wrapped in a range-pending div. */
const STRETCH = "[&>*]:min-w-0 [&>section]:h-full [&>div>section]:h-full";

/** Grid shared by the page and its skeleton (Seller Home v3). */
export function HomeLayout(slots: {
  header: React.ReactNode;
  setup?: React.ReactNode;
  kpis: React.ReactNode;
  metrics: React.ReactNode;
  chart: React.ReactNode;
  journey: React.ReactNode;
  attention: React.ReactNode;
  topProducts: React.ReactNode;
  sources: React.ReactNode;
  orders: React.ReactNode;
  questions?: React.ReactNode;
  community?: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className="sui-rise">{slots.header}</div>
      {slots.setup}
      <div className="sui-rise [animation-delay:.1s]">{slots.kpis}</div>
      <div className="sui-rise [animation-delay:.14s]">{slots.metrics}</div>
      <div className={`sui-rise grid grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-3.5 [animation-delay:.18s] max-[1180px]:grid-cols-1 ${STRETCH}`}>
        {slots.chart}
        {slots.attention}
      </div>
      <div
        className={`sui-rise grid grid-cols-3 gap-3.5 [animation-delay:.22s] max-[1180px]:grid-cols-2 max-[1180px]:[&>:last-child]:col-span-full max-[720px]:grid-cols-1 ${STRETCH}`}
      >
        {slots.journey}
        {slots.topProducts}
        {slots.sources}
      </div>
      <div className="sui-rise [animation-delay:.26s]">{slots.orders}</div>
      {slots.questions}
      {slots.community && <div className="sui-rise [animation-delay:.3s]">{slots.community}</div>}
    </PageContainer>
  );
}
