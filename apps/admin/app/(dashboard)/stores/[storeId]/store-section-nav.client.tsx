"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";

export type StoreNavItem = {
  id: string;
  label: string;
  /** Small number after the label (pages, errors). Hidden when 0 or absent. */
  count?: number;
  /** A count that needs attention (integration errors) is shown in red. */
  alert?: boolean;
};

/**
 * The store page's "jump to" list: a sticky column on wide screens, a
 * scrolling row on small ones. It marks the section in view, and an old
 * `?tab=website` link scrolls to that section.
 */
export function StoreSectionNav({ items }: { items: StoreNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const tab = useSearchParams().get("tab");

  useEffect(() => {
    if (!tab) return;
    // Section and sub-section ids are the old tab keys (forms and media sit inside Content).
    if (/^[a-z]+$/.test(tab)) document.getElementById(tab)?.scrollIntoView();
  }, [tab]);

  useEffect(() => {
    const sections = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Store sections" className="lg:sticky lg:top-0">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:border-s lg:px-0 lg:pb-0">
        {items.map((item) => {
          const current = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                onClick={() => setActive(item.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "lg:-ms-px lg:rounded-none lg:border-s-2 lg:border-transparent lg:py-1",
                  current && "bg-background font-medium text-foreground shadow-sm lg:border-primary lg:bg-transparent lg:shadow-none",
                )}
              >
                {item.label}
                {item.count ? (
                  <span className={cn("text-xs tabular-nums", item.alert ? "font-medium text-destructive" : "text-muted-foreground")}>{item.count}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
