"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, LayoutDashboard, Package, Truck, Users } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const links = [
    { title: t("dashboard"), href: "/", icon: LayoutDashboard },
    { title: t("orders"), href: "/orders", icon: Package },
    { title: t("batches"), href: "/batches", icon: FileSpreadsheet },
    { title: t("riders"), href: "/riders", icon: Users },
    { title: t("providers"), href: "/providers", icon: Truck },
  ];

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
