// 'use client'

import Link from "next/link";
// import { usePathname } from 'next/navigation'
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "./header.types";

interface BottomNavClientProps {
  items: NavigationItem[];
}

export const BottomNavClient = ({ items }: BottomNavClientProps) => {
  //   const pathname = usePathname()

  return (
    <>
      {items.map((item) => {
        const IconComponent = item.icon;
        // Determine if this tab is active
        const isActive = false;

        return (
          <Button
            asChild
            key={item.href}
            variant="ghost"
            size="icon"
            className={cn(
              "flex flex-col items-center text-gray-600 hover:text-primary transition-colors",
              isActive && "text-primary font-semibold"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Link href={item.href}>
              {IconComponent && (
                <IconComponent
                  className={cn("size-5", isActive && "text-primary")}
                />
              )}
              <span className={cn("text-xs", isActive && "text-primary")}>
                {item.label}
              </span>
            </Link>
          </Button>
        );
      })}
    </>
  );
};
