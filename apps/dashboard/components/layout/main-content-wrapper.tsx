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
        "flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ms-20" : "lg:ms-[280px]"
      )}
    >
      {children}
    </div>
  );
}
