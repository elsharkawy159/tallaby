"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, Users } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const links = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Orders", href: "/orders", icon: Package },
  { title: "Riders", href: "/riders", icon: Users },
  { title: "Providers", href: "/providers", icon: Truck },
];

/** Bottom bar standing in for the sidebar below the md breakpoint. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden dark:bg-gray-950">
      {links.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-600 dark:text-gray-400",
              isActive && "text-primary dark:text-primary"
            )}
          >
            <link.icon className="size-5" />
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
