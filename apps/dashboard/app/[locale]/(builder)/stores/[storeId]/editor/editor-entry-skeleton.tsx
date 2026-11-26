import { Skeleton } from "@workspace/ui/components/skeleton";

/** The editor's choice (edit with AI or by hand) while the store loads. */
export function EditorEntrySkeleton() {
  return (
    <div className="seller-shell flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-8 px-6 pt-7 pb-12 max-[900px]:gap-[22px] max-[900px]:px-4 max-[900px]:pt-4 max-[900px]:pb-7">
        <Skeleton className="h-[34px] w-28 rounded-full max-[600px]:h-10" />
        <div className="m-auto flex w-full flex-col gap-8 max-[900px]:gap-[22px]">
          <div className="flex flex-col items-center gap-2.5">
            <Skeleton className="h-5 w-32 max-w-full rounded-full" />
            <Skeleton className="h-10 w-80 max-w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-[20px] max-[640px]:h-52" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
