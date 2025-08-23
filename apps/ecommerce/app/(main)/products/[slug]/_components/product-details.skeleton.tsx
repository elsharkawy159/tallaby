import { Skeleton } from "@workspace/ui/components/skeleton";

export const ProductDetailsSkeleton = () => {
  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Shipping Info Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Skeleton className="h-6 w-24 mb-4" />

              {/* Seller Info Skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 my-4" />

              {/* Shipping Details Skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Actions Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-20 mb-3" />
                  <Skeleton className="w-32 h-10 rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="w-full h-12 rounded-lg" />
                  <Skeleton className="w-full h-12 rounded-lg" />
                  <Skeleton className="w-full h-12 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Trust Badges Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
