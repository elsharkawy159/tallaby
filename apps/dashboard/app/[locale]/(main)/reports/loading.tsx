import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";

export default function Loading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-3 gap-3.5 max-[1180px]:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-[24px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1">
        <Skeleton className="h-[340px] rounded-[24px]" />
        <Skeleton className="h-[340px] rounded-[24px]" />
      </div>
    </PageContainer>
  );
}
