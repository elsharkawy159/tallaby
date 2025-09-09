import { Skeleton } from "@workspace/ui/components/skeleton";

export const HeaderSkeleton = () => {
  return (
    <header className="bg-primary shadow-sm sticky top-0 z-50">
      <div className="container mx-auto py-3.5">
        {/* Mobile skeleton */}
        <div className="flex items-center md:hidden justify-between">
          <Skeleton className="h-8 w-20 bg-white/20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 bg-white/20" />
            <Skeleton className="h-10 w-10 bg-white/20 rounded" />
          </div>
        </div>

        {/* Mobile search skeleton */}
        <div className="md:mt-0 mt-4 md:hidden">
          <Skeleton className="h-10 w-full bg-white/20 rounded-full" />
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:flex items-center justify-between gap-8 md:mt-0 mt-4">
          <Skeleton className="h-8 w-20 bg-white/20" />
          <div className="flex-1">
            <Skeleton className="h-10 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-6 w-6 bg-white/20 rounded" />
            <Skeleton className="h-6 w-6 bg-white/20 rounded" />
            <Skeleton className="h-6 w-6 bg-white/20 rounded" />
            <Skeleton className="h-8 w-32 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Category navigation skeleton */}
      <div className="bg-secondary md:block hidden">
        <div className="container mx-auto py-2">
          <div className="flex gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-16 bg-white/20" />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export const BottomNavigationSkeleton = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="container mx-auto">
        <nav className="grid grid-cols-4 py-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-5 w-5 bg-gray-200 rounded" />
              <Skeleton className="h-3 w-8 mt-1 bg-gray-200" />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

