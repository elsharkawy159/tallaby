import { Skeleton } from "@workspace/ui/components/skeleton";

/**
 * The top bar's place while HeaderData streams in (the (main) layout's static
 * shell): the same sticky box and heights as DashboardHeader (68px, 60px up to
 * 600px), so the page below never moves. No text.
 */
export function HeaderSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-30 flex h-[68px] items-center gap-2.5 border-b border-(--s-topbar-line) bg-(--s-topbar) px-7 backdrop-blur-[14px] backdrop-saturate-[1.4] max-[1020px]:px-4 min-[1021px]:border-transparent min-[1021px]:bg-transparent min-[1021px]:backdrop-blur-none max-[600px]:h-[60px] max-[600px]:gap-1.5 max-[600px]:px-2.5 min-[1021px]:top-1 min-[1021px]:h-[60px] print:hidden"
    >
      {/* Menu button (drawer widths only). */}
      <Skeleton className="size-9 shrink-0 rounded-[11px] max-[600px]:size-10 min-[1021px]:hidden" />
      <div className="mx-auto flex min-w-0 flex-[1_1_0] justify-center max-[720px]:justify-start" />
      {/* Wallet pill, bell, then the tools hidden on phones. */}
      <div className="flex shrink-0 items-center gap-1">
        <Skeleton className="h-10 w-28 rounded-full max-[600px]:h-9 max-[600px]:w-20" />
        <Skeleton className="size-9 rounded-[11px] max-[600px]:size-10" />
        <div className="flex items-center gap-1 max-[600px]:hidden">
          <Skeleton className="size-9 rounded-[11px]" />
          <Skeleton className="size-9 rounded-[11px]" />
        </div>
      </div>
    </div>
  );
}
