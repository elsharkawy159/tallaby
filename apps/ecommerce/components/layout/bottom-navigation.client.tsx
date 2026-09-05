"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { CartCountClient } from "./cart-count.client";
import type { NavigationItem } from "./header.types";

interface BottomNavClientProps {
  items: NavigationItem[];
}

const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const BottomNavClient = ({ items }: BottomNavClientProps) => {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive = isNavItemActive(pathname, item.href);
        const isCart = item.href === "/cart";

        return (
          <Button
            asChild
            key={item.href}
            variant="ghost"
            className={cn(
              "h-auto w-auto flex flex-col items-center justify-center gap-0.5 rounded-none px-2 py-1",
              "text-gray-600 hover:bg-transparent hover:text-primary transition-colors",
              isActive && "text-primary font-semibold"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Link href={item.href}>
              <span className="relative inline-flex">
                {IconComponent && (
                  <IconComponent
                    className={cn("size-5", isActive && "text-primary")}
                  />
                )}
                {isCart && <CartCountClient />}
              </span>
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
