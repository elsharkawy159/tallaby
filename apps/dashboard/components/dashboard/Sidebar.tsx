"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
  LogOut,
  MessageSquare,
  Truck,
  Warehouse,
} from "lucide-react";
import { cn, getPublicUrl } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useSiteData } from "@/providers/site-data";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components";
import { useSidebarStore } from "@/stores";
import { logout } from "@/actions/auth";
import type { SidebarCounts } from "./sidebar.types";
import { SIDEBAR_COUNT_BADGE_CLASS } from "./sidebar.types";
import { StoreLink } from "./store-link.client";
import { SupportChatLink } from "./support-chat-link.client";

interface SidebarProps {
  counts: SidebarCounts;
}

const SIDEBAR_LINK =
  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary/50";
// The current page is the only solid-brand element in the sidebar.
// primary-foreground flips with the theme: near-white on the light-mode teal,
// near-black on the brighter dark-mode teal, keeping contrast in both.
const SIDEBAR_LINK_ACTIVE =
  "bg-sidebar-primary text-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-primary-foreground";
const SIDEBAR_ICON = "h-5 w-5 shrink-0 text-muted-foreground";
const SIDEBAR_ICON_ACTIVE = "text-primary-foreground";
const SIDEBAR_BADGE_ACTIVE =
  "border-transparent bg-primary-foreground/20 text-primary-foreground";
const SIDEBAR_SUBLINK =
  "flex items-center px-3 py-2 text-sm rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary/50";
const SIDEBAR_SUBLINK_ACTIVE =
  "bg-sidebar-primary text-primary-foreground font-medium shadow-sm";
const SIDEBAR_SUBLINK_IDLE =
  "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent";

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

  const topNavItems = [
    { name: t("nav.dashboard"), icon: BarChart3, href: "/", countKey: "dashboard" as const },
    { name: t("nav.orders"), icon: ShoppingBag, href: "/orders", countKey: "orders" as const },
  ];

  const afterProductsItems = [
    { name: t("nav.shipping"), icon: Truck, href: "/shipping", countKey: "shipping" as const },
    { name: t("nav.accountStatements"), icon: DollarSign, href: "/financial", countKey: "financial" as const },
    { name: t("nav.promotions"), icon: Gift, href: "/coupons", countKey: "promotions" as const },
    { name: t("nav.reviews"), icon: Star, href: "/reviews", countKey: "reviews" as const },
    { name: t("nav.advertiseProducts"), icon: TrendingUp, href: "/marketing", countKey: "marketing" as const },
  ];

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
          counts={counts}
          topNavItems={topNavItems}
          afterProductsItems={afterProductsItems}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          seller={seller.data ?? null}
        />
      </aside>

      {/* Mobile Sidebar */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          // visibility is transitioned too, so the drawer slides out before
          // hiding, and its links leave the tab order while closed.
          "fixed inset-y-0 start-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-e border-sidebar-border bg-sidebar transition-[translate,visibility] duration-300 ease-in-out lg:hidden",
          isMobileOpen
            ? "translate-x-0"
            : "invisible -translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex shrink-0" aria-label="Tallaby">
            <Image
              src="/logo-word.png"
              alt="Tallaby"
              width={120}
              height={32}
              className="object-contain object-left rtl:object-right dark:brightness-[1.9]"
            />
          </Link>
          <Button
            onClick={closeMobile}
            variant="ghost"
            size="icon"
            className="shrink-0 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          >
            <span className="sr-only">{t("nav.closeMenu")}</span>
            <ChevronLeft size={24} className="rtl:rotate-180" />
          </Button>
        </div>
        <SidebarContent
          counts={counts}
          topNavItems={topNavItems}
          afterProductsItems={afterProductsItems}
          isCollapsed={false}
          seller={seller.data ?? null}
        />
      </aside>
    </>
  );
};

interface SidebarContentProps {
  counts: SidebarCounts;
  topNavItems: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    countKey: keyof SidebarCounts;
  }[];
  afterProductsItems: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    countKey: keyof SidebarCounts;
  }[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  seller: {
    logoUrl?: string | null;
    businessName?: string | null;
    slug?: string | null;
    approvedCategories?: unknown;
    [key: string]: unknown;
  } | null;
}

const SidebarContent = ({
  counts,
  topNavItems,
  afterProductsItems,
  isCollapsed,
  onToggleCollapse,
  seller,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
  const format = useFormatter();
  const formatNumber = (value: number) => format.number(value);
  const [profileOpen, setProfileOpen] = useState(false);
  const isProductsSection =
    pathname === "/products" || pathname.startsWith("/products/");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      {/* Tallaby logo + Collapse Toggle (Desktop only) */}
      {onToggleCollapse && (
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b border-sidebar-border">
          <Link
            href="/"
            className="flex shrink-0 items-center overflow-hidden"
            aria-label="Tallaby"
          >
            {isCollapsed ? (
              <Image
                src="/logo-word.png"
                alt="Tallaby"
                width={32}
                height={32}
                className="object-contain object-left rtl:object-right dark:brightness-[1.9]"
              />
            ) : (
              <Image
                src="/logo-word.png"
                alt="Tallaby"
                width={120}
                height={32}
                className="object-contain object-left rtl:object-right dark:brightness-[1.9]"
              />
            )}
          </Link>
          <button
            onClick={onToggleCollapse}
            className="shrink-0 text-muted-foreground hover:text-sidebar-accent-foreground transition-colors p-1 rounded hover:bg-sidebar-accent"
            aria-label={
              isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="rtl:rotate-180" />
            ) : (
              <ChevronLeft size={20} className="rtl:rotate-180" />
            )}
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <ScrollBar />
        <nav className="py-6">
          <ul className="space-y-1 px-4">
            {topNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      SIDEBAR_LINK,
                      isActive && SIDEBAR_LINK_ACTIVE,
                      isCollapsed ? "justify-center px-2" : "justify-between"
                    )}
                    title={isCollapsed ? item.name : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="flex items-center min-w-0">
                      <item.icon
                        className={cn(
                          SIDEBAR_ICON,
                          isActive && SIDEBAR_ICON_ACTIVE,
                          !isCollapsed && "me-3"
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </span>
                    {!isCollapsed && counts[item.countKey] > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          SIDEBAR_COUNT_BADGE_CLASS,
                          isActive && SIDEBAR_BADGE_ACTIVE
                        )}
                      >
                        {formatNumber(counts[item.countKey])}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}

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
                    <AccordionTrigger className="bg-transparent py-3 px-4 hover:no-underline hover:bg-sidebar-accent rounded-lg [&[data-state=open]]:bg-transparent [&[data-state=open]]:hover:bg-sidebar-accent [&>svg]:hidden">
                      <span className="flex w-full items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center min-w-0 text-sm",
                            isProductsSection
                              ? "font-semibold text-sidebar-foreground"
                              : "font-medium text-sidebar-foreground/80"
                          )}
                        >
                          <Package
                            className={cn(
                              SIDEBAR_ICON,
                              "me-3",
                              isProductsSection && "text-sidebar-primary"
                            )}
                          />
                          {t("nav.products")}
                        </span>
                        {counts.products > 0 && (
                        <Badge variant="secondary" className={SIDEBAR_COUNT_BADGE_CLASS}>
                          {formatNumber(counts.products)}
                        </Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-2">
                      <ul className="space-y-1 ps-4 border-s border-sidebar-border ms-5">
                        <li>
                          <Link
                            href="/products"
                            className={cn(
                              SIDEBAR_SUBLINK,
                              pathname === "/products"
                                ? SIDEBAR_SUBLINK_ACTIVE
                                : SIDEBAR_SUBLINK_IDLE
                            )}
                            aria-current={pathname === "/products" ? "page" : undefined}
                          >
                            {t("nav.manageProducts")}
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/products/add"
                            className={cn(
                              SIDEBAR_SUBLINK,
                              pathname === "/products/add"
                                ? SIDEBAR_SUBLINK_ACTIVE
                                : SIDEBAR_SUBLINK_IDLE
                            )}
                            aria-current={pathname === "/products/add" ? "page" : undefined}
                          >
                            {t("nav.addProducts")}
                          </Link>
                        </li>
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
                    className={cn(
                      SIDEBAR_ICON,
                      isProductsSection && SIDEBAR_ICON_ACTIVE
                    )}
                  />
                </Link>
              </li>
            )}

            {afterProductsItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      SIDEBAR_LINK,
                      isActive && SIDEBAR_LINK_ACTIVE,
                      isCollapsed ? "justify-center px-2" : "justify-between"
                    )}
                    title={isCollapsed ? item.name : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="flex items-center min-w-0">
                      <item.icon
                        className={cn(
                          SIDEBAR_ICON,
                          isActive && SIDEBAR_ICON_ACTIVE,
                          !isCollapsed && "me-3"
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </span>
                    {!isCollapsed && counts[item.countKey] > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          SIDEBAR_COUNT_BADGE_CLASS,
                          isActive && SIDEBAR_BADGE_ACTIVE
                        )}
                      >
                        {formatNumber(counts[item.countKey])}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      {/* Profile accordion at bottom */}
      <div className="mt-auto border-t border-sidebar-border px-4 py-2">
        <div className="pt-2 pb-2">
          <SupportChatLink isCollapsed={isCollapsed} />
        </div>
        {seller?.slug && (
          <div className="pb-2">
            <StoreLink
              slug={seller.slug}
              storeName={seller.businessName}
              isCollapsed={isCollapsed}
            />
          </div>
        )}
        <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between rounded-lg py-2 px-3 text-start transition-colors hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-4",
                isCollapsed && "flex-1 justify-center gap-0"
              )}
            >
              <Avatar className="size-10 shrink-0">
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
                <AvatarFallback className="bg-muted text-sidebar-foreground/80 font-semibold text-sm">
                  {seller?.businessName?.[0] ?? (
                    <UserIcon className="h-5 w-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="truncate text-sm font-medium text-sidebar-foreground/80">
                  {seller?.businessName ?? t("nav.vendor")}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  profileOpen && "rotate-180"
                )}
              />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            {!isCollapsed && (
              <ul className="mt-2 space-y-1 ps-4 border-s border-sidebar-border ms-5">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    {t("nav.giveFeedback")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    {t("nav.settings")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/fulfillment"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Warehouse className="h-4 w-4 shrink-0" />
                    {t("nav.fulfillment")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t("nav.logout")}
                  </button>
                </li>
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
