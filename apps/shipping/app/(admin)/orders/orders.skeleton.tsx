import { Skeleton } from "@workspace/ui/components/skeleton";

export function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 w-full sm:w-80" />
        <Skeleton className="h-11 w-full sm:w-44" />
        <Skeleton className="h-11 w-full sm:w-44" />
        <Skeleton className="h-11 w-full sm:w-44" />
      </div>
      <div className="rounded-md border bg-white p-4 dark:bg-gray-950">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
