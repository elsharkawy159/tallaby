import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-48 max-w-full" />
      <div className="grid grid-cols-2 gap-3.5 max-[860px]:grid-cols-1">
        <Skeleton className="h-44 rounded-[24px]" />
        <Skeleton className="h-44 rounded-[24px]" />
      </div>
      <Skeleton className="h-80 rounded-[24px]" />
    </PageContainer>
  );
}
