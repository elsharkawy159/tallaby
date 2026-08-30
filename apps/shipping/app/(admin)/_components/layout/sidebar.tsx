"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, Users } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ElementType;
}

const links: SidebarLink[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Shipping Orders", href: "/orders", icon: Package },
  { title: "Riders", href: "/riders", icon: Users },
  { title: "Providers", href: "/providers", icon: Truck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:flex dark:bg-gray-950">
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="size-4" />
        </div>
        <span className="font-semibold">Shipping</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive && "bg-gray-100 font-medium dark:bg-gray-800"
              )}
            >
              <link.icon className="size-4 shrink-0 text-gray-600 dark:text-gray-400" />
              {link.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
