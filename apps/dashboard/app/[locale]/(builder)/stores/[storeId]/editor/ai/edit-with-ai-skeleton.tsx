import { Skeleton } from "@workspace/ui/components/skeleton";

/** The "Edit with AI" page while the editor loads: the top bar, the chat and the canvas. */
export function EditWithAiSkeleton() {
  return (
    <div className="seller-shell flex h-dvh flex-col overflow-hidden bg-(--s-surface-2)">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-(--s-line) bg-(--s-surface) px-3">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-5 w-36 rounded-full" />
        <div className="ms-auto flex gap-1.5">
          <Skeleton className="h-9 w-28 rounded-full max-[480px]:w-10" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-full flex-col gap-4 bg-(--s-surface) p-5 lg:w-[440px] lg:border-e lg:border-(--s-line)">
          <div className="m-auto flex w-full max-w-sm flex-col items-center gap-3">
            <Skeleton className="size-[72px] rounded-2xl" />
            <Skeleton className="h-6 w-56 max-w-full rounded-full" />
            <Skeleton className="h-4 w-72 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-[104px] rounded-[22px]" />
        </div>
        <div className="hidden min-w-0 flex-1 p-3 lg:block">
          <Skeleton className="h-full rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}
