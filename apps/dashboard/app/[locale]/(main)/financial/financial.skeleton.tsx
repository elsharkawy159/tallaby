import { Skeleton } from "@workspace/ui/components/skeleton";
import { KpiGrid, PageContainer, TwoColumns } from "@/components/seller-ui";

export function FinancialSkeleton() {
  return (
    <PageContainer>
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <KpiGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-[24px]" />
        ))}
      </KpiGrid>
      <Skeleton className="h-64 rounded-[24px]" />
      <TwoColumns className="gap-3.5">
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </TwoColumns>
    </PageContainer>
  );
}
