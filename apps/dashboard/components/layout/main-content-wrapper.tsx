"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { isCollapsed } = useSidebarStore();

  return (
    <main
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ms-20" : "lg:ms-[280px]"
      )}
    >
      {children}
    </main>
  );
}
