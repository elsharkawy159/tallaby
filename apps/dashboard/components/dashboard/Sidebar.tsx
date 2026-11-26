"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ChevronDown,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  UserIcon,
  X,
} from "lucide-react";
import { cn, getPublicUrl } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { IconButton } from "@/components/seller-ui";
import { InstallAppButton } from "@/components/layout/install-app-button.client";
import { LanguageToggle } from "@/components/layout/language-toggle.client";
import { ThemeToggle } from "@/components/layout/theme-toggle.client";
import { useSiteData } from "@/providers/site-data";
import { useSidebarStore } from "@/stores/sidebar.store";
import { logout } from "@/actions/auth";
import type { SidebarCounts } from "./sidebar.types";
import {
  SIDEBAR_CONFIG,
  findActiveHref,
  isGroupActive,
  resolveSidebar,
  type NavFeature,
  type ResolvedEntry,
  type ResolvedGroup,
  type ResolvedLink,
} from "./sidebar.config";
import { StoreSwitcher, type SwitcherStore } from "./store-switcher.client";
import {
  CopyPageLinkButton,
  SupportToolsContext,
  useSupportTools,
} from "./copy-page-link.client";
import {
  WhatsAppIcon,
  useSupportWhatsAppUrl,
} from "./support-chat-link.client";

interface SidebarProps {
  /** No first top-up yet: Orders shows a warning (F-68). */
  ordersLocked: boolean;
  /** The smallest top-up in dollars ("$5"), shown in the warning's tooltip (owner, 2026-11-18). Null when orders aren't locked. */
  minTopUp: string | null;
  counts: SidebarCounts;
  stores: SwitcherStore[];
  selectedStoreId: string | null;
  maxStores: number;
  features: Partial<Record<NavFeature, boolean>>;
  /** A Tallaby support account (decided on the server): links get a "copy page link" button. */
  supportTools?: boolean;
}

const MinTopUpContext = createContext<string | null>(null);

/* The design's `.ni` and `.sub a`. */
const NAV_ITEM =
  "flex min-h-10 w-full cursor-pointer items-center gap-[11px] rounded-xl px-3 py-2 text-start text-[13.5px] font-medium text-(--s-text) no-underline transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)";
const NAV_ITEM_ACTIVE =
  "bg-primary font-bold text-primary-foreground shadow-(--s-shadow-nav) hover:bg-primary hover:text-primary-foreground";
const NAV_ICON = "size-[18px] shrink-0 text-(--s-subtle)";

export const Sidebar = ({
  ordersLocked,
  minTopUp,
  counts,
  stores,
  selectedStoreId,
  maxStores,
  features,
  supportTools = false,
}: SidebarProps) => {
  const t = useTranslations();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } =
    useSidebarStore();
  const pathname = usePathname();
  const closeMobile = () => setMobileOpen(false);
  // Set when a group label navigates, so the drawer stays open on the expanded group.
  const keepMobileOpenRef = useRef(false);

  // Close the mobile drawer after navigating (except through a group label).
  useEffect(() => {
    if (keepMobileOpenRef.current) {
      keepMobileOpenRef.current = false;
      return;
    }
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
    () =>
      resolveSidebar(SIDEBAR_CONFIG, { storeId: selectedStoreId, features }),
    [selectedStoreId, features],
  );

  const content = {
    ordersLocked,
    counts,
    entries,
    stores,
    selectedStoreId,
    maxStores,
  };

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
        <div
          className={cn(
            "flex h-[68px] shrink-0 items-center",
            isCollapsed ? "justify-center" : "justify-between px-[18px]",
          )}
        >
          {!isCollapsed && <SidebarLogo />}
          <IconButton
            onClick={toggleCollapse}
            aria-label={
              isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <PanelRightOpen className="ltr:-scale-x-100" />
            ) : (
              <PanelRightClose className="ltr:-scale-x-100" />
            )}
          </IconButton>
        </div>
        {/* Desktop only: the copy button shows on hover, which touch screens don't have. */}
        <SupportToolsContext.Provider value={supportTools}>
          <SidebarContent {...content} isCollapsed={isCollapsed} />
        </SupportToolsContext.Provider>
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
          isMobileOpen
            ? "translate-x-0"
            : "invisible -translate-x-full rtl:translate-x-full",
        )}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 px-[18px] max-[600px]:h-[60px]">
          <SidebarLogo />
          <IconButton onClick={closeMobile} aria-label={t("nav.closeMenu")}>
            <X />
          </IconButton>
        </div>
        <SidebarContent
          {...content}
          isCollapsed={false}
          showTools
          onGroupNavigate={(href) => {
            if (href !== pathname) keepMobileOpenRef.current = true;
          }}
        />
      </aside>
    </MinTopUpContext.Provider>
  );
};

const SidebarLogo = () => (
  <Link
    href="/"
    className="flex shrink-0 items-center overflow-hidden"
    aria-label="Tallaby"
  >
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
function CollapsedTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
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
  /** Called when a group label is clicked to open its landing page (the drawer uses it to stay open). */
  onGroupNavigate?: (href: string) => void;
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
  onGroupNavigate,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
  const format = useFormatter();
  const supportTools = useSupportTools();
  const activeHref = findActiveHref(entries, pathname);
  const activeGroupKey =
    entries.find(
      (e): e is ResolvedGroup =>
        e.kind === "group" && isGroupActive(e, activeHref),
    )?.key ?? null;
  // Accordion: one group open at a time; the current page's group opens on navigation.
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(
    activeGroupKey,
  );
  // Adjusted while rendering (not in an effect) when the current page moves to another group.
  const [seenActiveGroupKey, setSeenActiveGroupKey] = useState(activeGroupKey);
  if (activeGroupKey !== seenActiveGroupKey) {
    setSeenActiveGroupKey(activeGroupKey);
    if (activeGroupKey) setOpenGroupKey(activeGroupKey);
  }

  const renderTopLink = (link: ResolvedLink) => {
    const isActive = link.href === activeHref;
    const Icon = link.icon;
    const label = t(`nav.${link.key}`);
    // Not on the icon-only sidebar: there is no room beside the icon.
    const copyLink = supportTools && !isCollapsed && !link.disabled;
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
          copyLink && "pe-10",
        )}
      >
        {Icon && <Icon className={cn(NAV_ICON, isActive && "text-current")} />}
        {!isCollapsed && (
          <span className="min-w-0 flex-1 truncate">{label}</span>
        )}
        {ordersLocked && LOCKED_HREFS.includes(link.href) && <OrdersWarning />}
        {!isCollapsed && (link.disabled ? <SoonBadge /> : null)}
      </Link>
    );
    if (copyLink) {
      return (
        <li key={link.href} className="group/copy relative">
          {item}
          <CopyPageLinkButton
            href={link.href}
            trail={[label]}
            onActive={isActive}
            className="end-1.5"
          />
        </li>
      );
    }
    return (
      <li key={link.href}>
        {isCollapsed ? <CollapsedTip label={label}>{item}</CollapsedTip> : item}
      </li>
    );
  };

  const renderGroup = (group: ResolvedGroup) => {
    const active = isGroupActive(group, activeHref);
    const label = t(`nav.${group.key}`);
    // The group label carries its landing page's number (Orders amber, Products a quiet total).
    const groupCount = group.countKey ? counts[group.countKey] : 0;
    const strongCount = group.key === "ordersGroup";
    if (isCollapsed) {
      return (
        <li key={group.key}>
          <CollapsedTip label={label}>
            <Link
              href={group.href ?? "#"}
              aria-label={label}
              aria-current={
                group.ownHref && group.href === activeHref ? "page" : undefined
              }
              className={cn(
                NAV_ITEM,
                active && NAV_ITEM_ACTIVE,
                "relative justify-center px-0",
              )}
            >
              <group.icon className={cn(NAV_ICON, active && "text-current")} />
              {ordersLocked && LOCKED_GROUPS.includes(group.key) && (
                <OrdersWarning />
              )}
              {/* Only the amber (to-do) number fits on an icon. */}
              {strongCount && groupCount > 0 && (
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
        strongCount={strongCount}
        ordersLocked={ordersLocked}
        open={openGroupKey === group.key}
        onOpenChange={(open) => setOpenGroupKey(open ? group.key : null)}
        onNavigate={(href) => {
          setOpenGroupKey(group.key);
          onGroupNavigate?.(href);
        }}
      />
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {stores.length > 0 ? (
        <div className={cn("mb-1.5 shrink-0", isCollapsed ? "mx-3" : "mx-3.5")}>
          <StoreSwitcher
            stores={stores}
            selectedId={selectedStoreId}
            maxStores={maxStores}
            isCollapsed={isCollapsed}
          />
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
                <li
                  key={`divider-${i}`}
                  role="separator"
                  className="mx-1.5 my-2 h-px bg-(--s-line-soft)"
                />
              ) : (
                <li
                  key={`section-${entry.label}`}
                  className="px-3 pb-1.5 pt-3.5 text-[11.5px] font-bold text-(--s-faint)"
                >
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

      {/* Support, then what the top bar hides on phones. Log out is in the Stores menu; a seller with no store gets it here. */}
      <div
        className={cn(
          "flex shrink-0 flex-col gap-2 border-t border-(--s-line-soft)",
          isCollapsed ? "p-3" : "px-3.5 pb-4 pt-3",
        )}
      >
        <SupportCard isCollapsed={isCollapsed} />
        {/* Phones: one compact line (owner, 2026-11-16), so the tools don't take the screen. */}
        {showTools && (
          <div className="flex items-center gap-1 min-[601px]:hidden">
            <LanguageToggle labelled />
            <ThemeToggle />
            <InstallAppButton />
          </div>
        )}
        {stores.length === 0 && <LogoutButton isCollapsed={isCollapsed} />}
      </div>
    </div>
  );
};

/** Sellers with no store yet see their business here instead of the store switcher. */
function SellerIdentity({ isCollapsed }: { isCollapsed: boolean }) {
  const t = useTranslations();
  const seller = useSiteData().seller.data ?? null;
  return (
    <div
      className={cn(
        "mb-1.5 flex shrink-0 items-center gap-2.5",
        isCollapsed
          ? "justify-center"
          : "mx-3.5 rounded-2xl border border-(--s-field) bg-(--s-surface) p-2.5",
      )}
    >
      <Avatar className="size-9 shrink-0 rounded-[11px]">
        <AvatarImage
          src={
            seller?.logoUrl
              ? getPublicUrl(seller.logoUrl, "sellers")
              : undefined
          }
          alt={
            seller?.businessName
              ? t("nav.logoAlt", { name: seller.businessName })
              : t("nav.vendor")
          }
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

/** WhatsApp support link: one compact row like the nav items (owner, 2026-11-22). */
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
        "flex min-h-10 items-center gap-[11px] rounded-xl text-[13.5px] font-semibold text-(--s-whatsapp-ink) no-underline transition-colors duration-150 hover:bg-(--s-whatsapp-soft) hover:text-(--s-whatsapp-ink)",
        isCollapsed ? "justify-center" : "px-3 py-2",
      )}
    >
      <span className="relative shrink-0">
        <WhatsAppIcon className="size-[22px] text-(--s-whatsapp)" />
        {isCollapsed && <OnlineDot className="absolute -end-0.5 -top-0.5" />}
      </span>
      {!isCollapsed && (
        <>
          <span className="truncate">{t("helpCardTitle")}</span>
          <OnlineDot className="-ms-1" />
        </>
      )}
      <span className="sr-only">{t("supportOnline")}</span>
    </a>
  );
  return isCollapsed ? (
    <CollapsedTip label={t("helpCardTitle")}>{card}</CollapsedTip>
  ) : (
    card
  );
}

/** A green "we're online" dot with a soft pulse (owner, 2026-11-25); the pulse stops with reduced motion. */
function OnlineDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative flex size-2.5 shrink-0", className)}>
      <span className="absolute inset-0 rounded-full bg-(--s-whatsapp) opacity-60 motion-safe:animate-ping" />
      <span className="relative size-2.5 rounded-full bg-(--s-whatsapp) ring-2 ring-(--s-surface)" />
    </span>
  );
}

function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();
  const button = (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending || undefined}
      onClick={() => {
        if (isPending) return;
        startTransition(async () => {
          await logout();
        });
      }}
      aria-label={t("logout")}
      className={cn(
        "flex min-h-10 cursor-pointer items-center gap-[11px] rounded-xl text-[13px] font-medium text-(--s-muted) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) disabled:cursor-wait disabled:opacity-60",
        isCollapsed ? "justify-center" : "px-3",
      )}
    >
      <LogOut className="size-[18px] shrink-0 rtl:-scale-x-100" aria-hidden />
      {!isCollapsed && t("logout")}
    </button>
  );
  return isCollapsed ? (
    <CollapsedTip label={t("logout")}>{button}</CollapsedTip>
  ) : (
    button
  );
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
  const label = t("sidebar", { min: amount ?? "" });
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="shrink-0 text-sm leading-none"
    >
      ⚠️
    </span>
  );
}

/** Amber number that needs acting on (`.cnt`). */
function StrongCount({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
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
    <span className="shrink-0 rounded-full border border-(--s-field) px-2 text-[10px] text-(--s-subtle)">
      {t("soon")}
    </span>
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
  strongCount,
  ordersLocked,
  open,
  onOpenChange,
  onNavigate,
}: {
  group: ResolvedGroup;
  label: string;
  active: boolean;
  activeHref: string | null;
  counts: SidebarCounts;
  groupCount: number;
  strongCount: boolean;
  ordersLocked: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The label was clicked: it opens the group and goes to its landing page. */
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations("nav");
  const format = useFormatter();
  // The label itself is the current page (the group's own landing page, e.g. All products).
  const current =
    group.ownHref && group.href !== null && group.href === activeHref;
  const subId = useId();
  const supportTools = useSupportTools();
  const labelContent = (
    <>
      <group.icon
        className={cn(
          NAV_ICON,
          current ? "text-current" : active && "text-(--s-primary)",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {ordersLocked && LOCKED_GROUPS.includes(group.key) && <OrdersWarning />}
      {groupCount > 0 &&
        (strongCount ? (
          <StrongCount value={format.number(groupCount)} />
        ) : (
          <CountBadge count={groupCount} strong={false} />
        ))}
    </>
  );

  return (
    <li>
      {/* The label goes to the group's page and opens it; the chevron only opens or closes it. */}
      <div className={cn("relative", supportTools && group.href && "group/copy")}>
        {group.href ? (
          <Link
            href={group.href}
            aria-current={current ? "page" : undefined}
            onClick={() => onNavigate(group.href!)}
            className={cn(
              NAV_ITEM,
              // Room for the copy button beside the chevron.
              supportTools ? "pe-[4.5rem]" : "pe-10",
              active && "font-bold text-(--s-ink)",
              current && NAV_ITEM_ACTIVE,
            )}
          >
            {labelContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenChange(!open)}
            className={cn(
              NAV_ITEM,
              "pe-10",
              active && "font-bold text-(--s-ink)",
            )}
          >
            {labelContent}
          </button>
        )}
        {supportTools && group.href && (
          <CopyPageLinkButton
            href={group.href}
            trail={[label]}
            onActive={current}
            className="end-9"
          />
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={subId}
          aria-label={t("toggleGroup", { name: label })}
          onClick={() => onOpenChange(!open)}
          className={cn(
            "absolute inset-y-1 end-1 grid w-8 cursor-pointer place-items-center rounded-lg transition-colors duration-150",
            current
              ? "text-primary-foreground hover:bg-white/15"
              : "text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)",
          )}
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-[15px] shrink-0 transition-transform duration-[250ms]",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
      {open && (
        <ul
          id={subId}
          className="relative mb-1.5 mt-0.5 flex flex-col gap-px ps-9 before:absolute before:inset-y-1 before:start-[20.5px] before:w-[1.5px] before:rounded-sm before:bg-(--s-field)"
        >
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            const copyLink = supportTools && !item.disabled;
            return (
              <li
                key={item.href}
                className={copyLink ? "group/copy relative" : undefined}
              >
                <Link
                  href={item.disabled ? "#" : item.href}
                  aria-disabled={item.disabled || undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[34px] items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-[13px] text-(--s-muted) no-underline transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) max-[1020px]:min-h-10",
                    isActive &&
                      "bg-(--s-hover) font-bold text-(--s-ink) before:absolute before:inset-y-[7px] before:-start-4 before:w-[3px] before:rounded-[3px] before:bg-(--s-primary)",
                    item.disabled && "pointer-events-none opacity-60",
                    copyLink && "pe-9",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{t(item.key)}</span>
                  {ordersLocked && LOCKED_HREFS.includes(item.href) && (
                    <OrdersWarning />
                  )}
                  {item.disabled ? (
                    <SoonBadge />
                  ) : (
                    <CountBadge
                      count={item.countKey ? counts[item.countKey] : 0}
                      strong={item.href === "/orders"}
                    />
                  )}
                </Link>
                {copyLink && (
                  <CopyPageLinkButton
                    href={item.href}
                    trail={[label, t(item.key)]}
                    className="end-1"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
