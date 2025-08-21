import { Skeleton } from "@workspace/ui/components/skeleton";

export const SellersTableSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800">
              <th className="py-4 px-4 text-left text-sm font-medium">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="py-4 px-4 text-right text-sm font-medium">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="py-4 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => (
              <tr key={i} className="border-b">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <Skeleton className="h-6 w-16 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </td>
                <td className="py-4 px-4 text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton className="h-8 w-8" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SellerCardSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-16" />
        <div className="text-right space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
};

export const SellersGridSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }, (_, i) => (
          <SellerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
