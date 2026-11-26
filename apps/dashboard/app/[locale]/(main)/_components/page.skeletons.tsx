import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer, SellerCard } from "@/components/seller-ui";
import { CardHeaderSkeleton, ChartSkeleton, ListCardSkeleton } from "./home.skeletons";

/*
 * Neutral placeholders for `loading.tsx` files, sized like `PageContainer` + `PageHeader`
 * + `SellerCard` so the real page swaps in without a layout shift. No text.
 */

/** Where `PageHeader` sits: the title and its description line. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-48 max-w-full max-[600px]:h-7" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** A settings-style card: its header, then label + field rows. */
export function FormCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SellerCard>
      <CardHeaderSkeleton />
      <div className="flex flex-col gap-5 px-[22px] pb-6 pt-5 max-[600px]:px-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </SellerCard>
  );
}

/** A grid of tiles, as on the stores and App Center pages. */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-[24px] max-[600px]:rounded-[20px]" />
      ))}
    </div>
  );
}

/** Any page: a title bar and one card of rows. The default for `(main)` routes without their own. */
export function PageSkeleton({ narrow = false, rows = 5 }: { narrow?: boolean; rows?: number }) {
  return (
    <PageContainer narrow={narrow}>
      <PageHeaderSkeleton />
      <ListCardSkeleton rows={rows} />
    </PageContainer>
  );
}

/** A page with a header and a tile grid (App Center). */
export function GridPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={cards} />
    </PageContainer>
  );
}

/** A report page: header, chart card and a list card (store analytics). */
export function ChartPageSkeleton() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <ChartSkeleton />
      <ListCardSkeleton />
    </PageContainer>
  );
}

/** Store wallet: the dark balance banner, the top-up card and the entries list. */
export function WalletSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-[200px] w-full rounded-[28px] max-[720px]:rounded-[24px]" />
      <FormCardSkeleton rows={2} />
      <ListCardSkeleton rows={6} />
    </PageContainer>
  );
}
