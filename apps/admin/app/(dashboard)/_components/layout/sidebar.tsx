"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Tag,
  Store,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Home,
  LineChart,
  Phone,
  Wallet,
  Handshake,
} from "lucide-react";
import type { SidebarCounts, SidebarProps } from "./sidebar.types";
import { SIDEBAR_COUNT_BADGE_CLASS } from "./sidebar.types";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ElementType;
  /** Omitted for links that have nothing to count, such as tools. */
  countKey?: keyof SidebarCounts;
  submenu?: SidebarLink[];
}

const sidebarLinks: SidebarLink[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    countKey: "dashboard",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    countKey: "customers",
  },
  {
    title: "Pending Carts",
    href: "/pending-carts",
    icon: ShoppingBag,
    countKey: "pendingCarts",
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    countKey: "orders",
  },
  {
    title: "External Orders",
    href: "/external-orders",
    icon: Phone,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    countKey: "products",
  },
  {
    title: "Pricing Calculator",
    href: "/pricing-calculator",
    icon: Calculator,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tag,
    countKey: "categories",
  },
  {
    title: "Brands",
    href: "/brands",
    icon: Store,
    countKey: "brands",
  },
  {
    title: "Sellers",
    href: "/sellers",
    icon: Store,
    countKey: "sellers",
  },
  {
    title: "Wallets",
    href: "/wallets",
    icon: Wallet,
  },
  {
    title: "Affiliates",
    href: "/affiliate",
    icon: Handshake,
  },
];

export default function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        expanded ? "w-64" : "w-16",
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border p-4 py-3.5">
        {expanded ? (
          <h1 className="text-xl font-bold text-primary">Admin</h1>
        ) : (
          <h1 className="mx-auto text-xl font-bold text-primary">A</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2">
          <ul className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <li key={link.title}>
                {link.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(link.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
                        "transition-colors hover:bg-sidebar-accent",
                        pathname.startsWith(link.href) && "bg-sidebar-accent",
                      )}
                    >
                      <span className="flex min-w-0 items-center">
                        <link.icon className="mr-2 size-5 shrink-0 text-muted-foreground" />
                        {expanded && (
                          <span className="truncate">{link.title}</span>
                        )}
                      </span>
                      {expanded && (
                        <ChevronRight
                          size={16}
                          className={cn(
                            "shrink-0 transition-transform",
                            openSubmenus[link.title] && "rotate-90",
                          )}
                        />
                      )}
                    </button>
                    {expanded && openSubmenus[link.title] && (
                      <ul className="mt-1 ml-6 flex flex-col gap-1">
                        {link.submenu.map((sublink) => (
                          <li key={sublink.title}>
                            <Link
                              href={sublink.href}
                              className={cn(
                                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                                "transition-colors hover:bg-sidebar-accent",
                                pathname === sublink.href &&
                                  "bg-sidebar-accent font-medium",
                              )}
                            >
                              <span className="flex min-w-0 items-center">
                                <sublink.icon className="mr-2 size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                  {sublink.title}
                                </span>
                              </span>
                              {sublink.countKey &&
                                counts[sublink.countKey] > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={SIDEBAR_COUNT_BADGE_CLASS}
                                  >
                                    {counts[sublink.countKey].toLocaleString()}
                                  </Badge>
                                )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm",
                      "transition-colors hover:bg-sidebar-accent",
                      expanded && "justify-between",
                      pathname === link.href &&
                        "bg-primary font-medium text-primary-foreground hover:bg-primary [&_svg]:text-primary-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center">
                      <link.icon
                        className={cn(
                          "size-5 shrink-0 text-muted-foreground",
                          expanded ? "mr-2" : "mx-auto",
                        )}
                      />
                      {expanded && (
                        <span className="truncate">{link.title}</span>
                      )}
                    </span>
                    {expanded && link.countKey && counts[link.countKey] > 0 && (
                      <Badge
                        variant="secondary"
                        className={SIDEBAR_COUNT_BADGE_CLASS}
                      >
                        {counts[link.countKey].toLocaleString()}
                      </Badge>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
            A
          </div>
          {expanded && (
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
