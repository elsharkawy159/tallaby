"use client";

import { cn } from "@/lib/utils";
import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import type { ScrollingHeaderProps } from "./header.types";

export const ScrollingHeader = ({
  children,
  className,
}: ScrollingHeaderProps) => {
  const { isVisible } = useScrollingNavbar();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-transform duration-300 ease-in-out will-change-transform",
        !isVisible && "-translate-y-full",
        className
      )}
    >
      {children}
    </header>
  );
};
