"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ArrowUpLeft, ChevronDown, LogOut, PanelRightClose, PanelRightOpen, UserIcon, X } from "lucide-react";
import { cn, getPublicUrl } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { IconButton } from "@/components/seller-ui";
import { InstallAppButton } from "@/components/layout/install-app-button.client";
import { LanguageToggle } from "@/components/layout/language-toggle.client";
import { ThemeToggle } from "@/components/layout/theme-toggle.client";
import { useSiteData } from "@/providers/site-data";
import { useSidebarStore } from "@/stores";
import { logout } from "@/actions/auth";
import type { SidebarCounts } from "./sidebar.types";
import {
  SIDEBAR_CONFIG,
  findActiveHref,
  resolveSidebar,
  type NavFeature,
  type ResolvedEntry,
  type ResolvedGroup,
  type ResolvedLink,
} from "./sidebar.config";
import { StoreSwitcher, type SwitcherStore } from "./store-switcher.client";
import { WhatsAppIcon, useSupportWhatsAppUrl } from "./support-chat-link.client";

interface SidebarProps {
  /** No first top-up yet: Orders shows a warning (F-68). */
  ordersLocked: boolean;
  /** The $5 minimum top-up in EGP, shown in the warning's tooltip. Null when unknown. */
  /** The smallest top-up as shown ("≈ 269 جنيه"), or null with no rate. */
  minTopUp: string | null;
  counts: SidebarCounts;
  stores: SwitcherStore[];
  selectedStoreId: string | null;
  maxStores: number;
  features: Partial<Record<NavFeature, boolean>>;
}

const MinTopUpContext = createContext<string | null>(null);

/* The design's `.ni` and `.sub a`. */
const NAV_ITEM =
  "flex min-h-10 w-full cursor-pointer items-center gap-[11px] rounded-xl px-3 py-2 text-start text-[13.5px] font-medium text-(--s-text) no-underline transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)";
const NAV_ITEM_ACTIVE =
  "bg-primary font-bold text-primary-foreground shadow-(--s-shadow-nav) hover:bg-primary hover:text-primary-foreground";
const NAV_ICON = "size-[18px] shrink-0 text-(--s-subtle)";

const groupActive = (activeHref: string | null, group: ResolvedGroup) =>
  group.items.some((item) => item.href === activeHref);

export const Sidebar = ({
  ordersLocked,
  minTopUp,
  counts,
  stores,
  selectedStoreId,
  maxStores,
  features,
}: SidebarProps) => {
  const t = useTranslations();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } = useSidebarStore();
  const pathname = usePathname();
  const closeMobile = () => setMobileOpen(false);

  // Close the mobile drawer after navigating, and on Escape.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // While the drawer is open: Escape closes it and the page behind it does
  // not scroll.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen, setMobileOpen]);

  const entries = useMemo(
    () => resolveSidebar(SIDEBAR_CONFIG, { storeId: selectedStoreId, features }),
    [selectedStoreId, features],
  );

  const content = { ordersLocked, counts, entries, stores, selectedStoreId, maxStores };

  return (
    <MinTopUpContext.Provider value={minTopUp}>
      {/* Desktop: fixed beside the page, and it collapses to icons. */}
      <aside
        aria-label={t("nav.mainMenu")}
        className={cn(
          "fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-(--s-line) bg-(--s-glass-nav) backdrop-blur-md transition-[width] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] min-[1021px]:flex",
          isCollapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className={cn("flex h-[68px] shrink-0 items-center", isCollapsed ? "justify-center" : "justify-between px-[18px]")}>
          {!isCollapsed && <SidebarLogo />}
          <IconButton
            onClick={toggleCollapse}
            aria-label={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelRightOpen className="ltr:-scale-x-100" /> : <PanelRightClose className="ltr:-scale-x-100" />}
          </IconButton>
        </div>
        <SidebarContent {...content} isCollapsed={isCollapsed} />
      </aside>

      {/* Up to 1020px: a drawer over a scrim. */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-(--s-scrim) transition-opacity duration-300 min-[1021px]:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label={t("nav.mainMenu")}
        className={cn(
          // visibility is transitioned too, so the drawer slides out before
          // hiding, and its links leave the tab order while closed.
          "fixed inset-y-0 start-0 z-50 flex w-[280px] flex-col border-e border-(--s-line) bg-(--s-surface) shadow-[0_0_60px_rgb(13_55_67/0.2)] transition-[translate,visibility] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] max-[600px]:w-[min(86vw,300px)] min-[1021px]:hidden",
          isMobileOpen ? "translate-x-0" : "invisible -translate-x-full rtl:translate-x-full",
        )}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 px-[18px] max-[600px]:h-[60px]">
          <SidebarLogo />
          <IconButton onClick={closeMobile} aria-label={t("nav.closeMenu")}>
            <X />
          </IconButton>
        </div>
        <SidebarContent {...content} isCollapsed={false} showTools />
      </aside>
    </MinTopUpContext.Provider>
  );
};

const SidebarLogo = () => (
  <Link href="/" className="flex shrink-0 items-center overflow-hidden" aria-label="Tallaby">
    <Image
      src="/logo-word.png"
      alt="Tallaby"
      width={112}
      height={28}
      className="h-7 w-auto object-contain object-left rtl:object-right dark:brightness-0 dark:invert"
    />
  </Link>
);

/** A label beside a collapsed sidebar item (`[data-tip]` in the design). Radix, so the nav can still scroll. */
function CollapsedTip({ label, children }: { label: string; children: React.ReactElement }) {
  const rtl = useLocale().startsWith("ar");
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={rtl ? "left" : "right"}
        sideOffset={12}
        className="rounded-[9px] bg-(--tallaby-teal-900) px-2.5 py-[5px] text-xs font-semibold text-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface SidebarContentProps {
  ordersLocked: boolean;
  counts: SidebarCounts;
  entries: ResolvedEntry[];
  stores: SwitcherStore[];
  selectedStoreId: string | null;
  maxStores: number;
  isCollapsed: boolean;
  /** The drawer also holds what the top bar drops at 600px and below. */
  showTools?: boolean;
}

const SidebarContent = ({
  ordersLocked,
  counts,
  entries,
  stores,
  selectedStoreId,
  maxStores,
  isCollapsed,
  showTools = false,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
  const format = useFormatter();
  const activeHref = findActiveHref(entries, pathname);
  const activeGroupKey =
    entries.find((e): e is ResolvedGroup => e.kind === "group" && groupActive(activeHref, e))?.key ?? null;
  // Accordion: one group open at a time; the current page's group opens on navigation.
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(activeGroupKey);
  useEffect(() => {
    if (activeGroupKey) setOpenGroupKey(activeGroupKey);
  }, [activeGroupKey]);

  const renderTopLink = (link: ResolvedLink) => {
    const isActive = link.href === activeHref;
    const Icon = link.icon;
    const label = t(`nav.${link.key}`);
    const item = (
      <Link
        href={link.disabled ? "#" : link.href}
        aria-disabled={link.disabled || undefined}
        aria-label={isCollapsed ? label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          NAV_ITEM,
          isActive && NAV_ITEM_ACTIVE,
          link.disabled && "pointer-events-none opacity-60",
          isCollapsed && "relative justify-center px-0",
        )}
      >
        {Icon && <Icon className={cn(NAV_ICON, isActive && "text-current")} />}
        {!isCollapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
        {ordersLocked && LOCKED_HREFS.includes(link.href) && <OrdersWarning />}
        {!isCollapsed && (link.disabled ? <SoonBadge /> : null)}
      </Link>
    );
    return <li key={link.href}>{isCollapsed ? <CollapsedTip label={label}>{item}</CollapsedTip> : item}</li>;
  };

  const renderGroup = (group: ResolvedGroup) => {
    const active = groupActive(activeHref, group);
    const label = t(`nav.${group.key}`);
    // The design badges the Orders group itself; other groups' numbers are totals, shown inside.
    const groupCount = group.key === "ordersGroup" ? counts.orders : 0;
    if (isCollapsed) {
      return (
        <li key={group.key}>
          <CollapsedTip label={label}>
            <Link
              href={group.items.find((i) => !i.disabled)?.href ?? "#"}
              aria-label={label}
              className={cn(NAV_ITEM, active && NAV_ITEM_ACTIVE, "relative justify-center px-0")}
            >
              <group.icon className={cn(NAV_ICON, active && "text-current")} />
              {ordersLocked && LOCKED_GROUPS.includes(group.key) && <OrdersWarning />}
              {groupCount > 0 && (
                <StrongCount
                  value={format.number(groupCount)}
                  className="absolute end-[3px] top-[3px] h-[18px] min-w-[18px] px-1 text-[9.5px]"
                />
              )}
            </Link>
          </CollapsedTip>
        </li>
      );
    }
    return (
      <SidebarGroup
        key={group.key}
        group={group}
        label={label}
        active={active}
        activeHref={activeHref}
        counts={counts}
        groupCount={groupCount}
        ordersLocked={ordersLocked}
        open={openGroupKey === group.key}
        onOpenChange={(open) => setOpenGroupKey(open ? group.key : null)}
      />
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {stores.length > 0 ? (
        <div className={cn("mb-1.5 shrink-0", isCollapsed ? "mx-3" : "mx-3.5")}>
          <StoreSwitcher stores={stores} selectedId={selectedStoreId} maxStores={maxStores} isCollapsed={isCollapsed} />
        </div>
      ) : (
        <SellerIdentity isCollapsed={isCollapsed} />
      )}

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 [scrollbar-width:thin]">
        <ul className="flex flex-col gap-0.5">
          {entries.map((entry, i) =>
            entry.kind === "divider" ? (
              isCollapsed || !entry.label ? (
                <li key={`divider-${i}`} role="separator" className="mx-1.5 my-2 h-px bg-(--s-line-soft)" />
              ) : (
                <li key={`section-${entry.label}`} className="px-3 pb-1.5 pt-3.5 text-[11.5px] font-bold text-(--s-faint)">
                  {t(`nav.${entry.label}`)}
                </li>
              )
            ) : entry.kind === "group" ? (
              renderGroup(entry)
            ) : (
              renderTopLink(entry)
            ),
          )}
        </ul>
      </nav>

      {/* Support, then what the top bar hides on phones, then sign out */}
      <div className={cn("flex shrink-0 flex-col gap-2 border-t border-(--s-line-soft)", isCollapsed ? "p-3" : "px-3.5 pb-4 pt-3")}>
        <SupportCard isCollapsed={isCollapsed} />
        {showTools && (
          <div className="flex flex-col gap-0.5 min-[601px]:hidden">
            <InstallAppButton row />
            <LanguageToggle row />
            <ThemeToggle row />
          </div>
        )}
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

/** Sellers with no store yet see their business here instead of the store switcher. */
function SellerIdentity({ isCollapsed }: { isCollapsed: boolean }) {
  const t = useTranslations();
  const seller = useSiteData().seller.data ?? null;
  return (
    <div className={cn("mb-1.5 flex shrink-0 items-center gap-2.5", isCollapsed ? "justify-center" : "mx-3.5 rounded-2xl border border-(--s-field) bg-(--s-surface) p-2.5")}>
      <Avatar className="size-9 shrink-0 rounded-[11px]">
        <AvatarImage
          src={seller?.logoUrl ? getPublicUrl(seller.logoUrl, "sellers") : undefined}
          alt={seller?.businessName ? t("nav.logoAlt", { name: seller.businessName }) : t("nav.vendor")}
        />
        <AvatarFallback className="rounded-[11px] bg-primary-soft text-sm font-semibold text-primary-ink">
          {seller?.businessName?.[0] ?? <UserIcon className="size-4" />}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <p className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-(--s-ink)">
          {seller?.businessName ?? t("nav.vendor")}
        </p>
      )}
    </div>
  );
}

/** WhatsApp help card (`.help`). */
function SupportCard({ isCollapsed }: { isCollapsed: boolean }) {
  const t = useTranslations("nav");
  const href = useSupportWhatsAppUrl();
  const card = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isCollapsed ? t("helpCardTitle") : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-2xl no-underline transition-colors duration-150",
        isCollapsed
          ? "justify-center p-1.5"
          : "border border-(--s-whatsapp-line) bg-(--s-whatsapp-soft) p-2 text-(--s-whatsapp-ink) hover:border-(--s-whatsapp) hover:text-(--s-whatsapp-ink)",
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#25d366] text-white shadow-[0_4px_10px_rgb(37_211_102/0.3)]">
        <WhatsAppIcon className="size-5" />
      </span>
      {!isCollapsed && (
        <>
          <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
            <b className="text-[13px] font-bold">{t("helpCardTitle")}</b>
            <small className="text-[11.5px] text-(--s-whatsapp-sub)">{t("helpCardHint")}</small>
          </span>
          <ArrowUpLeft
            aria-hidden
            className="size-[15px] shrink-0 text-(--s-whatsapp-sub) transition-transform duration-150 ltr:-scale-x-100 group-hover:-translate-y-0.5"
          />
        </>
      )}
    </a>
  );
  return isCollapsed ? <CollapsedTip label={t("helpCardTitle")}>{card}</CollapsedTip> : card;
}

function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const t = useTranslations("nav");
  const button = (
    <button
      type="button"
      onClick={() => void logout()}
      aria-label={t("logout")}
      className={cn(
        "flex min-h-10 cursor-pointer items-center gap-[11px] rounded-xl text-[13px] font-medium text-(--s-muted) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)",
        isCollapsed ? "justify-center" : "px-3",
      )}
    >
      <LogOut className="size-[18px] shrink-0 rtl:-scale-x-100" aria-hidden />
      {!isCollapsed && t("logout")}
    </button>
  );
  return isCollapsed ? <CollapsedTip label={t("logout")}>{button}</CollapsedTip> : button;
}

/**
 * Where a seller who isn't activated sees the warning (ROADMAP.md F-68). Only
 * Orders: Financial and Reports are locked too, but carry no ⚠️ (owner, 2026-11-07).
 */
const LOCKED_HREFS = ["/orders"];
const LOCKED_GROUPS = ["ordersGroup"];

function OrdersWarning() {
  const t = useTranslations("orderLock");
  const amount = useContext(MinTopUpContext);
  const label = t("sidebar", { amount: amount ?? "none" });
  return (
    <span role="img" aria-label={label} title={label} className="shrink-0 text-sm leading-none">
      ⚠️
    </span>
  );
}

/** Amber number that needs acting on (`.cnt`). */
function StrongCount({ value, className }: { value: string; className?: string }) {
  return (
    <b
      className={cn(
        "grid h-5 min-w-[22px] shrink-0 place-items-center rounded-full bg-accent px-1.5 font-montserrat text-[10.5px] font-bold text-(--tallaby-teal-900) tabular-nums",
        className,
      )}
    >
      {value}
    </b>
  );
}

/** A sub-link's number. Orders are amber like the design; the others are totals, so they stay quiet. */
function CountBadge({ count, strong }: { count: number; strong: boolean }) {
  const format = useFormatter();
  if (count <= 0) return null;
  if (strong) return <StrongCount value={format.number(count)} />;
  return (
    <span className="grid h-5 min-w-[22px] shrink-0 place-items-center rounded-full bg-(--s-fill) px-1.5 font-montserrat text-[10.5px] font-semibold text-(--s-muted) tabular-nums">
      {format.number(count)}
    </span>
  );
}

function SoonBadge() {
  const t = useTranslations("nav");
  return (
    <span className="shrink-0 rounded-full border border-(--s-field) px-2 text-[10px] text-(--s-subtle)">{t("soon")}</span>
  );
}

/** A collapsible sidebar section; the parent keeps only one open at a time. */
function SidebarGroup({
  group,
  label,
  active,
  activeHref,
  counts,
  groupCount,
  ordersLocked,
  open,
  onOpenChange,
}: {
  group: ResolvedGroup;
  label: string;
  active: boolean;
  activeHref: string | null;
  counts: SidebarCounts;
  groupCount: number;
  ordersLocked: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const format = useFormatter();

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(NAV_ITEM, active && "font-bold text-(--s-ink)")}
      >
        <group.icon className={cn(NAV_ICON, active && "text-(--s-primary)")} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {ordersLocked && LOCKED_GROUPS.includes(group.key) && <OrdersWarning />}
        {groupCount > 0 && <StrongCount value={format.number(groupCount)} />}
        <ChevronDown
          aria-hidden
          className={cn("size-[15px] shrink-0 text-(--s-subtle) transition-transform duration-[250ms]", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="relative mb-1.5 mt-0.5 flex flex-col gap-px ps-9 before:absolute before:inset-y-1 before:start-[20.5px] before:w-[1.5px] before:rounded-sm before:bg-(--s-field)">
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <li key={item.href}>
                <Link
                  href={item.disabled ? "#" : item.href}
                  aria-disabled={item.disabled || undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[34px] items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-[13px] text-(--s-muted) no-underline transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) max-[1020px]:min-h-10",
                    isActive &&
                      "bg-(--s-hover) font-bold text-(--s-ink) before:absolute before:inset-y-[7px] before:-start-4 before:w-[3px] before:rounded-[3px] before:bg-(--s-primary)",
                    item.disabled && "pointer-events-none opacity-60",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{t(item.key)}</span>
                  {ordersLocked && LOCKED_HREFS.includes(item.href) && <OrdersWarning />}
                  {item.disabled ? (
                    <SoonBadge />
                  ) : (
                    <CountBadge count={item.countKey ? counts[item.countKey] : 0} strong={item.href === "/orders"} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
