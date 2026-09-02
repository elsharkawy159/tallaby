import { Skeleton } from "@workspace/ui/components/skeleton";

export const ProductHeroSkeleton = () => {
  return (
    <section className="bg-white py-8">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Skeleton */}
          <div className="relative">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />

            {/* Action Buttons Skeleton */}
            <div className="absolute top-4 right-4 flex flex-col gap-3">
              <div className="w-10 h-10 bg-white/90 rounded-full shadow-md" />
              <div className="w-10 h-10 bg-white/90 rounded-full shadow-md" />
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            {/* Title and Rating Skeleton */}
            <div>
              <Skeleton className="h-8 w-3/4 mb-3" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-5 rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            {/* Description Skeleton */}
            <div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Color Selection Skeleton */}
            <div>
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="flex gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>

            {/* Size Selection Skeleton */}
            <div>
              <Skeleton className="h-6 w-20 mb-3" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="w-12 h-10 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Quantity Skeleton */}
            <div>
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
