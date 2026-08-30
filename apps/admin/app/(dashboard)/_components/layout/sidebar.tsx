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
  Users,
  Package,
  Tag,
  Store,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import type { SidebarCounts, SidebarProps } from "./sidebar.types";
import { SIDEBAR_COUNT_BADGE_CLASS } from "./sidebar.types";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ElementType;
  countKey: keyof SidebarCounts;
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
    title: "Customers",
    href: "/customers",
    icon: Users,
    countKey: "customers",
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    countKey: "orders",
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    countKey: "products",
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
        "flex flex-col h-screen border-r border-border transition-all duration-300 bg-white dark:bg-gray-950",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {expanded ? (
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        ) : (
          <h1 className="text-xl font-bold text-primary mx-auto">AP</h1>
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
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.title}>
                {link.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(link.title)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md",
                        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        pathname.startsWith(link.href) &&
                          "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <span className="flex items-center min-w-0">
                        <link.icon className="h-5 w-5 mr-2 shrink-0 text-gray-500" />
                        {expanded && (
                          <span className="truncate">{link.title}</span>
                        )}
                      </span>
                      {expanded && (
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform shrink-0",
                            openSubmenus[link.title] && "transform rotate-90"
                          )}
                        />
                      )}
                    </button>
                    {expanded && openSubmenus[link.title] && (
                      <ul className="mt-1 ml-6 space-y-1">
                        {link.submenu.map((sublink) => (
                          <li key={sublink.title}>
                            <Link
                              href={sublink.href}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 text-sm rounded-md",
                                "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                pathname === sublink.href &&
                                  "bg-gray-100 dark:bg-gray-800 font-medium"
                              )}
                            >
                              <span className="flex items-center min-w-0">
                                <sublink.icon className="h-4 w-4 mr-2 shrink-0 text-gray-500" />
                                <span className="truncate">{sublink.title}</span>
                              </span>
                              <Badge
                                variant="secondary"
                                className={SIDEBAR_COUNT_BADGE_CLASS}
                              >
                                {counts[sublink.countKey].toLocaleString()}
                              </Badge>
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
                      "flex items-center px-3 py-2 text-sm rounded-md",
                      "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                      expanded && "justify-between",
                      pathname === link.href &&
                        "bg-gray-100 dark:bg-gray-800 font-medium"
                    )}
                  >
                    <span className="flex items-center min-w-0">
                      <link.icon
                        className={cn(
                          "h-5 w-5 shrink-0 text-gray-500",
                          expanded ? "mr-2" : "mx-auto"
                        )}
                      />
                      {expanded && (
                        <span className="truncate">{link.title}</span>
                      )}
                    </span>
                    {expanded && (
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
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            A
          </div>
          {expanded && (
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
