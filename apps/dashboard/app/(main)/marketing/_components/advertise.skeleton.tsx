import { Skeleton } from "@workspace/ui/components/skeleton";

export function AdvertiseSkeleton() {
  return (
    <div className="mx-auto w-full max-w-310">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
              </div>
              {i === 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-80 rounded-2xl" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-72 rounded-2xl lg:block" />
      </div>
    </div>
  );
}
