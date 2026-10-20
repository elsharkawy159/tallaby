"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, UserIcon, X } from "lucide-react";
import { cn, getPublicUrl } from "@/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { useSiteData } from "@/providers/site-data";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components";
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

interface SidebarProps {
  counts: SidebarCounts;
  stores: SwitcherStore[];
  selectedStoreId: string | null;
  maxStores: number;
  features: Partial<Record<NavFeature, boolean>>;
}

const SIDEBAR_LINK =
  "flex items-center gap-3 px-3 py-[9px] text-sm rounded-[10px] transition-colors text-sidebar-foreground hover:bg-sidebar-accent outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";
// The current page gets a soft teal tint; solid brand fills are kept for CTAs.
const SIDEBAR_LINK_ACTIVE =
  "bg-primary-soft text-primary-ink font-medium hover:bg-primary-soft";
const SIDEBAR_ICON = "size-[18px] shrink-0 text-muted-foreground";
const SIDEBAR_ICON_ACTIVE = "text-primary-ink";
const SIDEBAR_SUBLINK =
  "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";
const SIDEBAR_SUBLINK_ACTIVE = "bg-primary-soft text-primary-ink font-medium";
const SIDEBAR_SUBLINK_IDLE =
  "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent";
const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-muted-foreground transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";

const groupActive = (activeHref: string | null, group: ResolvedGroup) =>
  group.items.some((item) => item.href === activeHref);

export const Sidebar = ({ counts, stores, selectedStoreId, maxStores, features }: SidebarProps) => {
  const t = useTranslations();
  const { seller } = useSiteData();
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

  const content = {
    counts,
    entries,
    stores,
    selectedStoreId,
    maxStores,
    seller: seller.data ?? null,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 bg-sidebar border-e border-sidebar-border z-50 h-screen transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-[280px]"
        )}
      >
        <SidebarContent {...content} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile Sidebar */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          // visibility is transitioned too, so the drawer slides out before
          // hiding, and its links leave the tab order while closed.
          "fixed inset-y-0 start-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-e border-sidebar-border bg-sidebar shadow-xl transition-[translate,visibility] duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "invisible -translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5 border-b border-sidebar-border">
          <SidebarLogo />
          <button type="button" onClick={closeMobile} className={ICON_BUTTON}>
            <span className="sr-only">{t("nav.closeMenu")}</span>
            <X className="size-[18px]" />
          </button>
        </div>
        <SidebarContent {...content} isCollapsed={false} />
      </aside>
    </>
  );
};

const SidebarLogo = ({ compact = false }: { compact?: boolean }) => (
  <Link href="/" className="flex shrink-0 items-center overflow-hidden" aria-label="Tallaby">
    <Image
      src="/logo-word.png"
      alt="Tallaby"
      width={compact ? 32 : 112}
      height={28}
      className="h-7 w-auto object-contain object-left rtl:object-right dark:brightness-0 dark:invert"
    />
  </Link>
);

interface SidebarContentProps {
  counts: SidebarCounts;
  entries: ResolvedEntry[];
  stores: SwitcherStore[];
  selectedStoreId: string | null;
  maxStores: number;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  seller: {
    logoUrl?: string | null;
    businessName?: string | null;
    [key: string]: unknown;
  } | null;
}

const SidebarContent = ({
  counts,
  entries,
  stores,
  selectedStoreId,
  maxStores,
  isCollapsed,
  onToggleCollapse,
  seller,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
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
    return (
      <li key={link.href}>
        <Link
          href={link.disabled ? "#" : link.href}
          aria-disabled={link.disabled || undefined}
          className={cn(
            SIDEBAR_LINK,
            isActive && SIDEBAR_LINK_ACTIVE,
            link.disabled && "pointer-events-none opacity-60",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? label : undefined}
          aria-current={isActive ? "page" : undefined}
        >
          {Icon && <Icon className={cn(SIDEBAR_ICON, isActive && SIDEBAR_ICON_ACTIVE)} />}
          {!isCollapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
          {!isCollapsed && (link.disabled ? <SoonBadge /> : <CountBadge count={link.countKey ? counts[link.countKey] : 0} />)}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: ResolvedGroup) => {
    const active = groupActive(activeHref, group);
    const label = t(`nav.${group.key}`);
    if (isCollapsed) {
      return (
        <li key={group.key}>
          <Link
            href={group.items.find((i) => !i.disabled)?.href ?? "#"}
            className={cn(SIDEBAR_LINK, active && SIDEBAR_LINK_ACTIVE, "justify-center px-2")}
            title={label}
          >
            <group.icon className={cn(SIDEBAR_ICON, active && SIDEBAR_ICON_ACTIVE)} />
          </Link>
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
        open={openGroupKey === group.key}
        onOpenChange={(open) => setOpenGroupKey(open ? group.key : null)}
      />
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      {/* Tallaby logo + Collapse Toggle (Desktop only) */}
      {onToggleCollapse && (
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {!isCollapsed && <SidebarLogo />}
          <button
            onClick={onToggleCollapse}
            className={ICON_BUTTON}
            aria-label={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          >
            {isCollapsed ? (
              <ChevronRight className="size-[18px] rtl:rotate-180" />
            ) : (
              <ChevronLeft className="size-[18px] rtl:rotate-180" />
            )}
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <ScrollBar />
        <nav className="p-3">
          <ul className="space-y-0.5">
            {entries.map((entry, i) =>
              entry.kind === "divider" ? (
                <li key={`divider-${i}`} role="separator" className={cn("my-2 border-t border-sidebar-border", isCollapsed ? "mx-2" : "mx-3")} />
              ) : entry.kind === "group" ? (
                renderGroup(entry)
              ) : (
                renderTopLink(entry)
              )
            )}
          </ul>
        </nav>
      </ScrollArea>

      {/* The selected store (opens the store switcher) + sign out */}
      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          {stores.length > 0 ? (
            <div className={cn("min-w-0 flex-1", isCollapsed && "w-full")}>
              <StoreSwitcher
                stores={stores}
                selectedId={selectedStoreId}
                maxStores={maxStores}
                isCollapsed={isCollapsed}
              />
            </div>
          ) : (
            <div className={cn("flex min-w-0 flex-1 items-center gap-2.5 p-2", isCollapsed && "flex-none p-0")}>
              <Avatar className="size-9 shrink-0 border border-sidebar-border">
                <AvatarImage
                  src={seller?.logoUrl ? getPublicUrl(seller.logoUrl, "sellers") : undefined}
                  alt={seller?.businessName ? t("nav.logoAlt", { name: seller.businessName }) : t("nav.vendor")}
                />
                <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary-ink">
                  {seller?.businessName?.[0] ?? <UserIcon className="size-4" />}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-sidebar-foreground">
                  {seller?.businessName ?? t("nav.vendor")}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className={ICON_BUTTON}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
          >
            <LogOut className="size-[18px] rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
};

function CountBadge({ count }: { count: number }) {
  const format = useFormatter();
  return count > 0 ? <Badge variant="count">{format.number(count)}</Badge> : null;
}

function SoonBadge() {
  const t = useTranslations("nav");
  return (
    <Badge variant="outline" className="text-[10px] font-normal">
      {t("soon")}
    </Badge>
  );
}

/** A collapsible sidebar section; the parent keeps only one open at a time. */
function SidebarGroup({
  group,
  label,
  active,
  activeHref,
  counts,
  open,
  onOpenChange,
}: {
  group: ResolvedGroup;
  label: string;
  active: boolean;
  activeHref: string | null;
  counts: SidebarCounts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("nav");

  return (
    <li>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className={cn(SIDEBAR_LINK, "w-full", active && "font-medium text-primary-ink")}>
          <group.icon className={cn(SIDEBAR_ICON, active && SIDEBAR_ICON_ACTIVE)} />
          <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-0.5 pb-1">
          <ul className="ms-5 space-y-0.5 border-s border-sidebar-border ps-3">
            {group.items.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    aria-disabled={item.disabled || undefined}
                    className={cn(
                      SIDEBAR_SUBLINK,
                      isActive ? SIDEBAR_SUBLINK_ACTIVE : SIDEBAR_SUBLINK_IDLE,
                      item.disabled && "pointer-events-none opacity-60"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="min-w-0 flex-1 truncate">{t(item.key)}</span>
                    {item.disabled ? <SoonBadge /> : <CountBadge count={item.countKey ? counts[item.countKey] : 0} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
