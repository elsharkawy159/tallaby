import { Skeleton } from "@workspace/ui/components/skeleton";

/** Matches the default card view: tabs, toolbar, product cards. */
export function VendorProductsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="flex gap-2.5 max-sm:order-first max-sm:w-full">
          <Skeleton className="h-9.5 w-36 rounded-xl" />
          <Skeleton className="h-9.5 w-40 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-10 w-full rounded-[10px] sm:w-95" />
        <Skeleton className="h-10 w-36 rounded-[10px]" />
        <Skeleton className="h-10 w-36 rounded-[10px]" />
        <Skeleton className="ms-auto h-10 w-20 rounded-[11px]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card">
            <Skeleton className="aspect-square rounded-none" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-24" />
              <div className="flex justify-between border-t border-dashed pt-2.5">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
