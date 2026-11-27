"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { isCollapsed } = useSidebarStore();

  return (
    // min-w-0 lets wide content (tables) scroll inside the page instead of
    // stretching it past the viewport. The mobile menu button lives in
    // DashboardHeader, rendered as this wrapper's first child.
    <div
      className={cn(
        "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-[cubic-bezier(.2,.7,.2,1)]",
        isCollapsed ? "min-[1021px]:ms-[76px]" : "min-[1021px]:ms-[264px]"
      )}
    >
      {children}
      {/* Desktop viewport frame (owner, 2026-11-27): a fixed rounded box 4px in
          from the top, bottom and end, starting at the sidebar's edge. Its border
          is the panel's border, and its huge spread shadow paints the frame
          colour around it, so page content scrolling into the 4px margins is
          hidden and the rounded corners always show. The window still scrolls
          (scroll reset on navigation, window.scrollTo and the header's scrolled
          state keep working). z-[35]: above the header (z-30) and page sticky
          bars (z-20), below the sidebar, floating bars (z-40) and pop-ups (z-50). */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-y-1 end-1 z-[35] hidden rounded-3xl border border-(--s-line) shadow-[0_0_0_100vmax_var(--s-frame)] transition-[inset-inline-start] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] min-[1021px]:block print:hidden",
          isCollapsed ? "start-[76px]" : "start-[264px]"
        )}
      />
    </div>
  );
}
