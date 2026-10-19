import { Skeleton } from "@workspace/ui/components/skeleton";

export const ProductsListSkeleton = () => {
  return (
    <section className="space-y-6 w-full" aria-hidden>
      <div className="grid gap-3 lg:gap-5 2xl:gap-6 sm:grid-cols-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
};

export const ProductsFilterSkeleton = () => {
  return (
    <div className="w-64 space-y-6" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
};
