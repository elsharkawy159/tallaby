import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export const WishlistSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="relative">
          <Card className="group bg-white shadow-sm h-full border-0 p-0 relative w-[285px] overflow-hidden rounded-[8px_8px_0_8px]">
            <CardContent className="p-2">
              {/* Product Image Skeleton */}
              <div className="relative rounded-md overflow-hidden">
                <Skeleton className="w-full aspect-[2.6/3] h-full" />

                {/* Wishlist button skeleton */}
                <Skeleton className="absolute top-3 right-3 h-8 w-8 rounded-full" />
              </div>

              {/* Product Info Skeleton */}
              <div className="space-y-2 mt-2.5">
                <div className="flex items-center gap-4.5 justify-between mb-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>

                {/* Rating skeleton */}
                <div className="flex text-sm items-center gap-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-12" />
                </div>

                {/* Add to Cart Button skeleton */}
                <Skeleton className="absolute text-sm bottom-0 right-0 h-10 w-24 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)]" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
