"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores";

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
    </div>
  );
}
