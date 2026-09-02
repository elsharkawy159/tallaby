import { Skeleton } from "@workspace/ui/components/skeleton";

export const CheckoutSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Shipping Information Skeleton */}
      <div className="bg-white border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Payment Method Skeleton */}
      <div className="bg-white border rounded-lg p-6">
        <Skeleton className="h-6 w-36 mb-6" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Review Items Skeleton */}
      <div className="bg-white border rounded-lg p-6">
        <Skeleton className="h-6 w-28 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Place Order Skeleton */}
      <div className="bg-white border rounded-lg p-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};
