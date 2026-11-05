import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";

/** The choice of method while it loads; also the page's loading.tsx. */
export function AddMethodSkeleton() {
  return (
    <PageContainer narrow>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-5 w-64 max-w-full rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl max-[720px]:h-24" />
        ))}
      </div>
    </PageContainer>
  );
}
