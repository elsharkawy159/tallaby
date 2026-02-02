import { Skeleton } from "@workspace/ui/components/skeleton";

export default function EditProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50/30 pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container px-6 py-4">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Skeleton className="h-9 w-48" />
          </div>
        </div>
      </div>
      <div className="container py-6 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
