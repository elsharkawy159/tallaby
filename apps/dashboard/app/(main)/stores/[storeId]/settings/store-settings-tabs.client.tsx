"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** General · Catalog · Payment methods · Policies. */
export function StoreSettingsTabs({ storeId }: { storeId: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const base = `/stores/${storeId}/settings`;
  const tabs = [
    { href: base, label: t("general"), exact: true },
    { href: `${base}/catalog`, label: t("catalog") },
    { href: `${base}/payments`, label: t("paymentMethods") },
    { href: `${base}/policies`, label: t("policies") },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label={t("storeSettings")}>
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
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
