import { Skeleton } from "@workspace/ui/components/skeleton";

/** Mirrors the auth form column, so the page doesn't jump when it arrives. */
export default function Loading() {
  return (
    <div className="seller-shell grid min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center gap-[22px] px-[18px] py-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-[50px] w-full rounded-full" />
        <Skeleton className="h-[50px] w-full rounded-[14px]" />
        <Skeleton className="h-[50px] w-full rounded-[14px]" />
        <Skeleton className="h-[50px] w-full rounded-[14px]" />
        <Skeleton className="h-[52px] w-full rounded-full" />
      </div>
    </div>
  );
}
