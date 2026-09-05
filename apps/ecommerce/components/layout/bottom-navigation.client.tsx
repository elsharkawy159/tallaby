"use client";

import { Home, ShoppingCart, Store } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { CartCountClient } from "./cart-count.client";
import type { BottomNavIcon, NavigationItem } from "./header.types";

interface BottomNavClientProps {
  items: NavigationItem[];
}

const iconMap: Record<
  BottomNavIcon,
  React.ComponentType<{ className?: string }>
> = {
  home: Home,
  shopping: Store,
  cart: ShoppingCart,
};

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
        const IconComponent = item.icon ? iconMap[item.icon] : null;
        const isActive = isNavItemActive(pathname, item.href);
        const isCart = item.href === "/cart";

        return (
          <Button
            asChild
            key={item.href}
            variant="ghost"
            className={cn(
              "relative h-auto flex-1 flex flex-col rtl:flex-col items-center justify-center gap-1 rounded-none px-2 py-2",
              "text-gray-500 hover:bg-transparent hover:text-primary transition-colors",
              isActive && "text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Link href={item.href}>
              <span
                className={cn(
                  "absolute inset-x-5 -top-2 h-1 origin-center rounded-full bg-primary transition-transform duration-200 ease-out",
                  isActive ? "scale-x-100" : "scale-x-0"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "relative inline-flex items-center justify-center rounded-full p-1.5 transition-colors duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                {IconComponent && (
                  <IconComponent
                    className={cn(
                      "size-5 transition-colors",
                      isActive && "text-primary"
                    )}
                  />
                )}
                {isCart && <CartCountClient />}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none transition-colors",
                  isActive && "text-primary font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          </Button>
        );
      })}
    </>
  );
};
