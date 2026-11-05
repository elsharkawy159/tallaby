import { Skeleton } from "@workspace/ui/components/skeleton";
import { KpiGrid } from "@/components/seller-ui";

export function ShippingSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <KpiGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-[24px]" />
        ))}
      </KpiGrid>
      <Skeleton className="h-12 w-80 max-w-full rounded-full" />
      <Skeleton className="h-80 w-full rounded-[24px]" />
    </>
  );
}
