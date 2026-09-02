import { Skeleton } from "@workspace/ui/components/skeleton";

export const ProductTabsSkeleton = () => {
  return (
    <section className="bg-white py-8">
      <div className="container">
        {/* Tab Navigation Skeleton */}
        <div className="flex border-b border-gray-200 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-3">
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="min-h-[400px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews List Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-9 w-28" />
              </div>

              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Skeleton key={j} className="h-4 w-4 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Skeleton key={j} className="w-8 h-8 rounded-lg" />
                      ))}
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}

              <div className="text-center">
                <Skeleton className="h-9 w-32 mx-auto" />
              </div>
            </div>

            {/* Rating Summary Skeleton */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center mb-4">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <div className="flex justify-center mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded mx-1" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>

                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 min-w-[20px]">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-4 rounded" />
                      </div>
                      <Skeleton className="flex-1 h-2 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <Skeleton className="h-5 w-28 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
