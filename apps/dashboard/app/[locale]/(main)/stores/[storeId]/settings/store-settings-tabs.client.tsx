"use client";

import { Fragment, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  BellRing,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  Gem,
  Globe,
  Headphones,
  LayoutGrid,
  ShieldCheck,
  Smartphone,
  Store,
  Trash2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Sections of the old /settings page and the store settings page each one moved to.
 * Not #contact: General has its own section with that id.
 */
const OLD_SETTINGS_ANCHORS: Record<string, string> = {
  policies: "policies",
  "push-alerts": "notifications",
};

/*
 * Same type and states as the sidebar's links (Sidebar.tsx NAV_ITEM, owner 2026-11-27): this is
 * a navigation list too. Below 1100px: a pill row that scrolls sideways. From 1100px: a vertical
 * list beside the page, in groups under the sidebar's small section headings.
 */
const ITEM =
  "inline-flex min-h-[38px] shrink-0 items-center gap-[11px] whitespace-nowrap rounded-full px-3.5 py-[7px] text-[12.5px] font-medium text-(--s-text) no-underline transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) aria-[current=page]:bg-primary aria-[current=page]:font-bold aria-[current=page]:text-primary-foreground aria-[current=page]:shadow-(--s-shadow-nav) min-[1100px]:flex min-[1100px]:w-full min-[1100px]:rounded-xl min-[1100px]:px-3 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-(--s-subtle) aria-[current=page]:[&_svg]:text-current";
/* The sidebar's section heading; hidden on the pill row. */
const HEADING = "hidden px-3 pb-1.5 pt-3.5 text-[11.5px] font-bold text-(--s-faint) first:pt-1.5 min-[1100px]:block";

type SettingsItem = { key: string; href: string; label: string; icon: LucideIcon };

/**
 * The store settings menu. Store: General (with the store catalog) · Business & contact ·
 * Policies · Store app · Domain. Selling: Payment methods · Checkout · Order protection · Sales
 * pop-up · Shipping & delivery · App Center. Account: Plan & usage · Phone alerts · Trash.
 * Domain, Shipping, App Center and Plan are their own pages outside this layout, linked here like
 * Shopify's settings list (owner, 2026-11-27); the menu is not shown on them.
 * Contact, policies and phone alerts are seller-account data (moved from the old /settings page, owner
 * 2026-11-27), shown under whichever store is open. Phone alerts only when push is set up.
 * The sidebar has one Store settings link and these pages are listed here (owner, 2026-11-27).
 */
export function StoreSettingsTabs({ storeId, phoneAlerts }: { storeId: string; phoneAlerts: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const listRef = useRef<HTMLElement>(null);
  const base = `/stores/${storeId}/settings`;

  // Grouped like the sidebar (Store · Selling · Account), reusing its section headings.
  const groups: { label: string; items: SettingsItem[] }[] = [
    {
      label: t("sectionStore"),
      items: [
        { key: "general", href: base, label: t("general"), icon: Store },
        { key: "contact", href: `${base}/contact`, label: t("businessContact"), icon: Headphones },
        { key: "policies", href: `${base}/policies`, label: t("policies"), icon: FileCheck },
        { key: "app", href: `${base}/app`, label: t("storeApp"), icon: Smartphone },
        { key: "domain", href: `/stores/${storeId}/website/domain`, label: t("domainSeo"), icon: Globe },
      ],
    },
    {
      label: t("sectionSell"),
      items: [
        { key: "payments", href: `${base}/payments`, label: t("paymentMethods"), icon: CreditCard },
        { key: "checkout", href: `${base}/checkout`, label: t("checkoutForm"), icon: ClipboardCheck },
        { key: "protection", href: `${base}/protection`, label: t("orderProtection"), icon: ShieldCheck },
        { key: "popup", href: `${base}/sales-popup`, label: t("salesPopup"), icon: BellRing },
        { key: "shipping", href: `/stores/${storeId}/shipping`, label: t("fulfillmentShipping"), icon: Truck },
        { key: "apps", href: `/stores/${storeId}/apps`, label: t("apps"), icon: LayoutGrid },
      ],
    },
    {
      label: t("sectionAccount"),
      items: [
        { key: "plan", href: "/settings/plan", label: t("planUsage"), icon: Gem },
        ...(phoneAlerts ? [{ key: "phoneAlerts", href: `${base}/notifications`, label: t("phoneAlerts"), icon: Bell }] : []),
        // Deleted products wait here 30 days (0123, F-35; moved from Products, owner 2026-11-27).
        { key: "trash", href: `${base}/trash`, label: t("productTrash"), icon: Trash2 },
      ],
    },
  ];
  const items = groups.flatMap((group) => group.items);
  const activeKey = items.find((item) => item.href === pathname)?.key;

  // Old /settings#… links land on General (the /settings redirect keeps the hash): send them on.
  useEffect(() => {
    if (pathname !== base) return;
    const page = OLD_SETTINGS_ANCHORS[window.location.hash.slice(1)];
    if (page && (page !== "notifications" || phoneAlerts)) router.replace(`${base}/${page}`);
  }, [pathname, base, phoneAlerts, router]);

  // On the pill row, keep the active item in view (sideways only: scrollIntoView would also move the page).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2, behavior: "auto" });
  }, [activeKey]);

  return (
    <nav
      ref={listRef}
      aria-label={t("storeSettings")}
      className={cn(
        "sticky top-[76px] z-20 flex gap-1 overflow-x-auto rounded-full border border-(--s-field) bg-(--s-surface) p-1 shadow-[0_6px_18px_rgb(13_55_67/0.04)] [scrollbar-width:none] max-[1020px]:top-[72px] max-[720px]:-mx-1 max-[720px]:rounded-[18px] max-[600px]:top-[68px] [&::-webkit-scrollbar]:hidden",
        "min-[1100px]:top-[92px] min-[1100px]:flex-col min-[1100px]:gap-px min-[1100px]:overflow-visible min-[1100px]:rounded-[18px] min-[1100px]:p-2",
      )}
    >
      {groups.map((group) => (
        <Fragment key={group.label}>
          <span aria-hidden className={HEADING}>
            {group.label}
          </span>
          {group.items.map(({ key, href, label, icon: Icon }) => (
            <Link key={key} href={href} aria-current={key === activeKey ? "page" : undefined} className={ITEM}>
              <Icon aria-hidden />
              <span className="min-w-0 truncate">{label}</span>
            </Link>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}
