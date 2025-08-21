"use client";

import {
  BarChart3,
  Package,
  ShoppingBag,
  Settings,
  DollarSign,
  Star,
  TrendingUp,
  Truck,
  FileText,
  HelpCircle,
  X,
  MessageCircle,
  Gift,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const t = useTranslations();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { name: t("nav.dashboard"), icon: BarChart3, href: "/" },
    { name: t("nav.products"), icon: Package, href: "/products" },
    { name: t("nav.orders"), icon: ShoppingBag, href: "/orders" },
    { name: t("nav.coupons"), icon: Gift, href: "/coupons" },
    { name: t("nav.settings"), icon: Settings, href: "/settings" },
    { name: t("nav.financial"), icon: DollarSign, href: "/financial" },
    { name: t("nav.reviews"), icon: Star, href: "/reviews" },
    { name: t("nav.marketing"), icon: TrendingUp, href: "/marketing" },
    { name: t("nav.shipping"), icon: Truck, href: "/shipping" },
    { name: t("nav.reports"), icon: FileText, href: "/reports" },
    { name: t("nav.help"), icon: HelpCircle, href: "/help" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex max-w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-primary dark:bg-primary z-50 h-screen transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-280"
        )}
      >
        <SidebarContent
          navigationItems={navigationItems}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-280 bg-primary dark:bg-primary z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-4">
          <Button
            onClick={onToggle}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </Button>
        </div>
        <SidebarContent navigationItems={navigationItems} isCollapsed={false} />
      </aside>
    </>
  );
};

const SidebarContent = ({
  navigationItems,
  isCollapsed,
  onToggleCollapse,
}: {
  navigationItems: any[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}) => {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <div className="flex flex-col h-full">
      {/* Collapse Toggle Button (Desktop only) */}
      {onToggleCollapse && (
        <div className="flex justify-end p-4">
          <button
            onClick={onToggleCollapse}
            className="text-white hover:text-accent transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
      )}

      {/* Profile Section */}
      {!isCollapsed && (
        <div className="flex flex-col items-center py-5 px-6 border-b border-primary-foreground/20">
          <div className="w-[120px] h-[120px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white text-4xl font-bold">JD</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">
            {t("user.johnDoe")}
          </h2>
          <p className="text-primary-foreground/80 text-sm text-center">
            {t("sidebar.premiumElectronicsStore")}
          </p>

          {/* Quick Chat Button */}
          {/* <Button
            variant="outline"
            size="sm"
            className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("sidebar.quickChat")}
          </Button> */}
        </div>
      )}

      {/* Collapsed Profile */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 px-2 border-b border-primary-foreground/20">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-sm font-bold">JD</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="overflow-y-auto h-full">
        <ScrollBar />

        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-white text-primary shadow-lg"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-primary-foreground/70 group-hover:text-white",
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

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-6 border-t border-primary-foreground/20">
          <div className="text-xs text-primary-foreground/60 text-center">
            {t("sidebar.version")}
          </div>
        </div>
      )}
    </div>
  );
};
