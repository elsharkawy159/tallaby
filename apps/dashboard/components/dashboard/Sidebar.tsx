"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
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

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const SIDEBAR_LINK =
  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-gray-100 hover:text-gray-900";
const SIDEBAR_LINK_ACTIVE = "bg-gray-100 text-gray-900";
const SIDEBAR_ICON = "h-5 w-5 shrink-0 text-gray-600";

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const t = useTranslations();
  const { seller } = useSiteData();
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  const topNavItems = [
    { name: t("nav.dashboard"), icon: BarChart3, href: "/" },
    { name: t("nav.orders"), icon: ShoppingBag, href: "/orders" },
  ];

  const afterProductsItems = [
    { name: t("nav.reviews"), icon: Star, href: "/reviews" },
    { name: t("nav.promotions"), icon: Gift, href: "/coupons" },
    { name: t("nav.advertiseProducts"), icon: TrendingUp, href: "/marketing" },
    { name: t("nav.accountStatements"), icon: DollarSign, href: "/financial" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex max-w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-50 h-screen transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-280"
        )}
      >
        <SidebarContent
          topNavItems={topNavItems}
          afterProductsItems={afterProductsItems}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          seller={seller.data}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-280 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
          <Link href="/" className="flex shrink-0" aria-label="Tallaby">
            <Image
              src="/logo-word.png"
              alt="Tallaby"
              width={120}
              height={32}
              className="object-contain object-left"
            />
          </Link>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <span className="sr-only">Close menu</span>
            <ChevronLeft size={24} />
          </Button>
        </div>
        <SidebarContent
          topNavItems={topNavItems}
          afterProductsItems={afterProductsItems}
          isCollapsed={false}
          seller={seller.data}
          onToggle={onToggle}
        />
      </aside>
    </>
  );
};

interface SidebarContentProps {
  topNavItems: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  }[];
  afterProductsItems: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  }[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  seller: {
    logoUrl?: string;
    businessName?: string;
    approvedCategories?: string[];
  } | null;
}

const SidebarContent = ({
  topNavItems,
  afterProductsItems,
  isCollapsed,
  onToggleCollapse,
  seller,
}: SidebarContentProps) => {
  const pathname = usePathname();
  const t = useTranslations();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tallaby logo + Collapse Toggle (Desktop only) */}
      {onToggleCollapse && (
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
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
                className="object-contain object-left"
              />
            ) : (
              <Image
                src="/logo-word.png"
                alt="Tallaby"
                width={120}
                height={32}
                className="object-contain object-left"
              />
            )}
          </Link>
          <button
            onClick={onToggleCollapse}
            className="shrink-0 text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
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
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        SIDEBAR_ICON,
                        isActive && "text-gray-900",
                        !isCollapsed && "mr-3"
                      )}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
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
                  value={
                    pathname === "/products" ||
                    pathname.startsWith("/products/")
                      ? "products"
                      : undefined
                  }
                >
                  <AccordionItem value="products" className="border-0">
                    <AccordionTrigger className="bg-transparent py-3 px-4 hover:no-underline hover:bg-gray-100 rounded-lg [&[data-state=open]]:bg-transparent [&[data-state=open]]:hover:bg-gray-100">
                      <span className="flex items-center text-sm font-medium text-gray-700">
                        <Package className={cn(SIDEBAR_ICON, "mr-3")} />
                        {t("nav.products")}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-2">
                      <ul className="space-y-1 pl-4 border-l border-gray-200 ml-5">
                        <li>
                          <Link
                            href="/products"
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                              pathname === "/products"
                                ? "text-gray-900 font-medium bg-gray-100"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            {t("nav.manageProducts")}
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/products/add"
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                              pathname === "/products/add"
                                ? "text-gray-900 font-medium bg-gray-100"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
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
                  className={cn(SIDEBAR_LINK, "justify-center px-2")}
                  title={t("nav.products")}
                >
                  <Package className={cn(SIDEBAR_ICON)} />
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
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        SIDEBAR_ICON,
                        isActive && "text-gray-900",
                        !isCollapsed && "mr-3"
                      )}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      {/* Profile accordion at bottom */}
      <div className="mt-auto border-t border-gray-200 px-4 py-2">
        <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between rounded-lg py-2 px-3 text-left transition-colors hover:bg-gray-100",
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
                  src={seller?.logoUrl ?? ""}
                  alt={
                    seller?.businessName
                      ? `${seller.businessName} logo`
                      : "Vendor"
                  }
                />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold text-sm">
                  {seller?.businessName?.[0] ?? (
                    <UserIcon className="h-5 w-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="truncate text-sm font-medium text-gray-700">
                  {seller?.businessName ?? "Vendor"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200",
                  profileOpen && "rotate-180"
                )}
              />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            {!isCollapsed && (
              <ul className="mt-2 space-y-1 pl-4 border-l border-gray-200 ml-5">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    {t("nav.giveFeedback")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    {t("nav.settings")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
