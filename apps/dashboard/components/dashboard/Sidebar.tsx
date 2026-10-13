"use client";

import { useEffect } from "react";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Settings,
  DollarSign,
  Star,
  Gift,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  UserIcon,
  LogOut,
  MessageSquare,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import { cn, getPublicUrl } from "@/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { useSiteData } from "@/providers/site-data";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components";
import { useSidebarStore } from "@/stores";
import { logout } from "@/actions/auth";
import type { SidebarCounts } from "./sidebar.types";
import { SupportChatLink } from "./support-chat-link.client";

interface SidebarProps {
  counts: SidebarCounts;
}

const SIDEBAR_LINK =
  "flex items-center gap-3 px-3 py-[9px] text-sm rounded-[10px] transition-colors text-sidebar-foreground hover:bg-sidebar-accent outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";
// The current page gets a soft teal tint; solid brand fills are kept for CTAs.
const SIDEBAR_LINK_ACTIVE =
  "bg-primary-soft text-primary-ink font-medium hover:bg-primary-soft";
const SIDEBAR_ICON = "size-[18px] shrink-0 text-muted-foreground";
const SIDEBAR_ICON_ACTIVE = "text-primary-ink";
const SIDEBAR_SUBLINK =
  "flex items-center px-3 py-2 text-sm rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";
const SIDEBAR_SUBLINK_ACTIVE = "bg-primary-soft text-primary-ink font-medium";
const SIDEBAR_SUBLINK_IDLE =
  "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent";
const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-muted-foreground transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40";

type NavItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  countKey?: keyof SidebarCounts;
};

export const Sidebar = ({ counts }: SidebarProps) => {
  const t = useTranslations();
  const { seller } = useSiteData();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } =
    useSidebarStore();
  const pathname = usePathname();
  const closeMobile = () => setMobileOpen(false);

  // Close the mobile drawer after navigating, and on Escape.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen, setMobileOpen]);

  const topNavItems: NavItem[] = [
    { name: t("nav.dashboard"), icon: BarChart3, href: "/", countKey: "dashboard" },
    { name: t("nav.orders"), icon: ShoppingBag, href: "/orders", countKey: "orders" },
  ];

  const afterProductsItems: NavItem[] = [
    { name: t("nav.shipping"), icon: Truck, href: "/shipping", countKey: "shipping" },
    { name: t("nav.accountStatements"), icon: DollarSign, href: "/financial", countKey: "financial" },
    { name: t("nav.promotions"), icon: Gift, href: "/coupons", countKey: "promotions" },
    { name: t("nav.reviews"), icon: Star, href: "/reviews", countKey: "reviews" },
    { name: t("nav.advertiseProducts"), icon: TrendingUp, href: "/marketing", countKey: "marketing" },
  ];

  const accountItems: NavItem[] = [
    { name: t("nav.settings"), icon: Settings, href: "/settings" },
    { name: t("nav.fulfillment"), icon: Warehouse, href: "/settings/fulfillment" },
    { name: t("nav.giveFeedback"), icon: MessageSquare, href: "#" },
  ];

  const content = {
    counts,
    topNavItems,
    afterProductsItems,
    accountItems,
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
        <SidebarContent
          {...content}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
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
          isMobileOpen
            ? "translate-x-0"
            : "invisible -translate-x-full rtl:translate-x-full"
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
  topNavItems: NavItem[];
  afterProductsItems: NavItem[];
  accountItems: NavItem[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  seller: {
    logoUrl?: string | null;
    businessName?: string | null;
    supportEmail?: string | null;
    [key: string]: unknown;
  } | null;
}

const SidebarContent = ({
  counts,
  topNavItems,
  afterProductsItems,
  accountItems,
  isCollapsed,
  onToggleCollapse,
  seller,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
  const format = useFormatter();
  const isProductsSection =
    pathname === "/products" || pathname.startsWith("/products/");

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href;
    const count = item.countKey ? counts[item.countKey] : 0;
    return (
      <li key={item.href + item.name}>
        <Link
          href={item.href}
          className={cn(
            SIDEBAR_LINK,
            isActive && SIDEBAR_LINK_ACTIVE,
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? item.name : undefined}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon className={cn(SIDEBAR_ICON, isActive && SIDEBAR_ICON_ACTIVE)} />
          {!isCollapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
          {!isCollapsed && count > 0 && (
            <Badge variant="count">{format.number(count)}</Badge>
          )}
        </Link>
      </li>
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
            aria-label={
              isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
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
            {topNavItems.map(renderLink)}

            {/* Products accordion */}
            {!isCollapsed ? (
              <li>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={isProductsSection ? "products" : undefined}
                >
                  <AccordionItem value="products" className="border-0">
                    <AccordionTrigger
                      className={cn(
                        SIDEBAR_LINK,
                        "hover:no-underline [&>svg]:hidden",
                        isProductsSection && "font-medium text-primary-ink"
                      )}
                    >
                      <span className="flex w-full items-center gap-3">
                        <Package
                          className={cn(SIDEBAR_ICON, isProductsSection && SIDEBAR_ICON_ACTIVE)}
                        />
                        <span className="min-w-0 flex-1 truncate text-start">
                          {t("nav.products")}
                        </span>
                        {counts.products > 0 && (
                          <Badge variant="count">{format.number(counts.products)}</Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0.5 pb-1">
                      <ul className="ms-5 space-y-0.5 border-s border-sidebar-border ps-3">
                        {[
                          { href: "/products", label: t("nav.manageProducts") },
                          { href: "/products/add", label: t("nav.addProducts") },
                        ].map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={cn(
                                SIDEBAR_SUBLINK,
                                pathname === sub.href
                                  ? SIDEBAR_SUBLINK_ACTIVE
                                  : SIDEBAR_SUBLINK_IDLE
                              )}
                              aria-current={pathname === sub.href ? "page" : undefined}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            ) : (
              <li>
                <Link
                  href="/products"
                  className={cn(
                    SIDEBAR_LINK,
                    isProductsSection && SIDEBAR_LINK_ACTIVE,
                    "justify-center px-2"
                  )}
                  title={t("nav.products")}
                  aria-current={pathname === "/products" ? "page" : undefined}
                >
                  <Package
                    className={cn(SIDEBAR_ICON, isProductsSection && SIDEBAR_ICON_ACTIVE)}
                  />
                </Link>
              </li>
            )}

            {afterProductsItems.map(renderLink)}
          </ul>

          <div role="separator" className="mx-1 my-2.5 h-px bg-sidebar-border" />
          {!isCollapsed && (
            <p className="px-3 py-1 text-xs text-faint">{t("nav.account")}</p>
          )}
          <ul className="space-y-0.5">{accountItems.map(renderLink)}</ul>
        </nav>
      </ScrollArea>

      {/* Support + signed-in store */}
      <div className="mt-auto flex flex-col gap-2.5 border-t border-sidebar-border p-3">
        <SupportChatLink isCollapsed={isCollapsed} />
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2",
            isCollapsed && "flex-col p-0"
          )}
        >
          <Avatar className="size-9 shrink-0 border border-sidebar-border">
            <AvatarImage
              src={seller?.logoUrl ? getPublicUrl(seller.logoUrl, "sellers") : undefined}
              alt={
                seller?.businessName
                  ? t("nav.logoAlt", { name: seller.businessName })
                  : t("nav.vendor")
              }
            />
            <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary-ink">
              {seller?.businessName?.[0] ?? <UserIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
                {seller?.businessName ?? t("nav.vendor")}
              </p>
              {seller?.supportEmail && (
                <p dir="ltr" className="truncate text-start text-xs text-muted-foreground rtl:text-end">
                  {seller.supportEmail}
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
