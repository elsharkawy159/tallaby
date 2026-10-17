"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@/lib/utils";

/** General · Payment methods (soon, P3-07) · Policies. */
export function StoreSettingsTabs({ storeId }: { storeId: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const base = `/stores/${storeId}/settings`;
  const tabs = [
    { href: base, label: t("general"), exact: true },
    { href: `${base}/payments`, label: t("paymentMethods"), soon: true },
    { href: `${base}/policies`, label: t("policies") },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label={t("storeSettings")}>
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        if (tab.soon) {
          return (
            <span
              key={tab.href}
              aria-disabled="true"
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground/70"
            >
              {tab.label}
              <Badge variant="outline" className="text-[10px] font-normal">
                {t("soon")}
              </Badge>
            </span>
          );
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-primary font-medium text-primary-ink"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
