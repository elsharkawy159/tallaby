"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageTab = {
  /** Unique key; compared with `value` for button tabs. */
  key: string;
  label: React.ReactNode;
  icon?: LucideIcon;
  /** Makes the tab a link. Active when the current path equals it. */
  href?: string;
};

const TAB =
  "inline-flex h-[38px] flex-[1_0_auto] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:text-(--s-ink) aria-selected:bg-(--s-solid) aria-selected:text-(--s-solid-fg) aria-[current=page]:bg-(--s-solid) aria-[current=page]:text-(--s-solid-fg) max-[600px]:h-10 [&_svg]:size-[15px]";

/**
 * The pill tab bar at the top of a page (`.ptabs`), stuck under the top bar.
 * Link tabs: give each tab an `href`. Button tabs: pass `value` and `onChange`.
 * It scrolls sideways on phones and keeps the active tab in view.
 */
export function PageTabs({
  tabs,
  value,
  onChange,
  label,
  sticky = true,
  className,
}: {
  tabs: PageTab[];
  value?: string;
  onChange?: (key: string) => void;
  /** The list's accessible name. */
  label?: string;
  sticky?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const isLinks = tabs.some((tab) => tab.href);
  const activeKey = value ?? tabs.find((tab) => tab.href === pathname)?.key;

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"],[aria-current="page"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    // Sideways only: scrollIntoView would also move the page.
    const inset = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left: inset, behavior: "auto" });
  }, [activeKey]);

  return (
    <div
      ref={listRef}
      role={isLinks ? "navigation" : "tablist"}
      aria-label={label}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-full border border-(--s-field) bg-(--s-surface) p-1 shadow-[0_6px_18px_rgb(13_55_67/0.04)] [scrollbar-width:none] max-[720px]:-mx-1 max-[720px]:rounded-[18px] [&::-webkit-scrollbar]:hidden",
        sticky && "sticky top-[76px] z-20 max-[1020px]:top-[72px] max-[600px]:top-[68px]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.key === activeKey;
        const content = (
          <>
            {Icon && <Icon aria-hidden />}
            {tab.label}
          </>
        );
        return tab.href ? (
          <Link key={tab.key} href={tab.href} aria-current={active ? "page" : undefined} className={TAB}>
            {content}
          </Link>
        ) : (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.key)}
            className={cn(TAB, "cursor-pointer")}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
