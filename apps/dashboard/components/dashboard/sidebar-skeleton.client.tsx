"use client";

import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

const NAV_ROWS = 9;

/**
 * The desktop sidebar's place while SidebarData streams in (the (main) layout's
 * static shell). Same box as Sidebar.tsx's desktop <aside>: fixed, 264px or
 * 76px from the same store MainContentWrapper reads, so the page beside it
 * never moves. Up to 1020px the sidebar is a closed drawer, so nothing shows.
 * A client component only to read the collapsed state. No text.
 */
export function SidebarSkeleton() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-(--s-line) bg-(--s-glass-nav) backdrop-blur-md min-[1021px]:flex",
        isCollapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      {/* Logo + collapse button row. */}
      <div className={cn("flex h-[68px] shrink-0 items-center", isCollapsed ? "justify-center" : "justify-between px-[18px]")}>
        {!isCollapsed && <Skeleton className="h-7 w-28" />}
        <Skeleton className="size-9 rounded-[11px]" />
      </div>
      {/* Store switcher. */}
      <div className={cn("mb-1.5 shrink-0", isCollapsed ? "mx-3" : "mx-3.5")}>
        <Skeleton className="h-14 w-full rounded-[14px]" />
      </div>
      {/* Navigation rows. */}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-3 py-2.5">
        {Array.from({ length: NAV_ROWS }, (_, i) => (
          <div key={i} className={cn("flex h-10 items-center gap-3", isCollapsed ? "justify-center" : "px-3")}>
            <Skeleton className="size-[18px] shrink-0 rounded-md" />
            {!isCollapsed && <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${60 + ((i * 17) % 35)}%` }} />}
          </div>
        ))}
      </div>
      {/* Support card. */}
      <div className={cn("shrink-0 border-t border-(--s-line-soft)", isCollapsed ? "p-3" : "px-3.5 pb-4 pt-3")}>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
