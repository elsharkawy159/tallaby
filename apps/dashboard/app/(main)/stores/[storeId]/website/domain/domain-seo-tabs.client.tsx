"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Domain · SEO · Sitemap & robots. */
export function DomainSeoTabs({ storeId }: { storeId: string }) {
  const t = useTranslations("domainSeo.tabs");
  const pathname = usePathname();
  const base = `/stores/${storeId}/website/domain`;
  const tabs = [
    { href: base, label: t("domain"), exact: true },
    { href: `${base}/seo`, label: t("seo") },
    { href: `${base}/sitemap`, label: t("sitemap") },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label={t("label")}>
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
