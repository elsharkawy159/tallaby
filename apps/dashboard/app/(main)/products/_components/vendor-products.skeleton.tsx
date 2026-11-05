import { Skeleton } from "@workspace/ui/components/skeleton";

/** Matches the default card view: header, tabs, toolbar, product cards. */
export function VendorProductsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Skeleton className="h-14 w-64 rounded-2xl" />
        <div className="flex gap-2 max-[720px]:w-full">
          <Skeleton className="h-[42px] w-36 rounded-full" />
          <Skeleton className="h-[42px] w-36 rounded-full" />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-[42px] flex-[1_1_260px] rounded-full min-[721px]:max-w-[420px]" />
        <Skeleton className="h-[42px] w-32 rounded-full" />
        <Skeleton className="h-[42px] w-32 rounded-full" />
        <Skeleton className="ms-auto h-[42px] w-20 rounded-full" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5 max-[720px]:grid-cols-2 max-[720px]:gap-2.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-glass)">
            <Skeleton className="aspect-[1/1.02] rounded-none" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-24" />
              <div className="flex justify-between border-t border-(--s-line-soft) pt-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
