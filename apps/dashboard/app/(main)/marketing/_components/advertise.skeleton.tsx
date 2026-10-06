import { Skeleton } from "@workspace/ui/components/skeleton";

export function AdvertiseSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-5 w-full max-w-xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-4 pt-1">
                <Skeleton className="h-6 w-40" />
                {i === 0 && <Skeleton className="h-80 w-full rounded-2xl" />}
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-64 rounded-2xl lg:block" />
      </div>
    </div>
  );
}
