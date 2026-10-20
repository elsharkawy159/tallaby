"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Forms · Submissions. */
export function FormsTabs({ storeId }: { storeId: string }) {
  const t = useTranslations("storeForms.tabs");
  const pathname = usePathname();
  const base = `/stores/${storeId}/website/forms`;
  const inbox = `${base}/submissions`;
  const tabs = [
    { href: base, label: t("forms"), active: !pathname.startsWith(inbox) },
    { href: inbox, label: t("submissions"), active: pathname.startsWith(inbox) },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label={t("label")}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors",
            tab.active ? "border-primary font-medium text-primary-ink" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
