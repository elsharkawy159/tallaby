import { Skeleton } from "@workspace/ui/components/skeleton";

/** The choice of method while it loads; also the page's loading.tsx. */
export function AddMethodSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-68px)] flex-col max-[600px]:min-h-[calc(100dvh-60px)]">
      <div className="m-auto flex w-full max-w-[1000px] flex-col gap-8 px-6 py-12 max-[900px]:gap-[22px] max-[900px]:px-4 max-[900px]:py-7">
        <div className="flex flex-col items-center gap-2.5">
          <Skeleton className="h-10 w-72 max-w-full rounded-full" />
          <Skeleton className="h-5 w-64 max-w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-[20px] max-[900px]:h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
