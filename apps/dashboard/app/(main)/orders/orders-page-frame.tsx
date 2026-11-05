import { Skeleton } from "@workspace/ui/components/skeleton";

/*
 * PageContainer's frame and the list skeleton, free of "@/lib/utils" (and so of
 * seller-ui): that module creates a browser Supabase client on import, which the
 * page-lock tests have no env for. Keep the frame in step with PageContainer.
 */
const FRAME =
  "mx-auto flex w-full max-w-[1360px] flex-col gap-5 p-7 max-[1020px]:px-4 max-[1020px]:py-5 max-[600px]:gap-3.5 max-[600px]:px-3 max-[600px]:py-4";

export function OrdersPageFrame({ children }: { children: React.ReactNode }) {
  return <div className={FRAME}>{children}</div>;
}

/** What a list page looks like while it loads: header, chips, a grid of cards. */
export function ListPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[42px] w-full max-w-[420px] rounded-full" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-[24px] max-[600px]:rounded-[20px]" />
        ))}
      </div>
    </>
  );
}
