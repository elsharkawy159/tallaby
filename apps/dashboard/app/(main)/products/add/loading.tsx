import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@/components/seller-ui";

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton className="h-10 w-64 rounded-full" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[22px]">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-[46px] w-full rounded-[14px]" />
              <Skeleton className="h-24 w-full rounded-[14px]" />
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-72 rounded-[24px] lg:block" />
      </div>
    </PageContainer>
  );
}
