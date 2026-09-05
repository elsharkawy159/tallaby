import { cn } from "@/lib/utils";
import { BottomNavClient } from "./bottom-navigation.client";
import { AuthLink } from "./auth-link";
import { Home, ShoppingCart, Store } from "lucide-react";
import { useTranslations } from "next-intl";

export const BottomNavigation = async () => {
  const t = useTranslations("navigation");
  const items = [
    {
      href: "/",
      label: t("home"),
      icon: Home,
    },
    {
      href: "/products",
      label: t("shopping"),
      icon: Store,
    },
    {
      href: "/cart",
      label: t("cart"),
      icon: ShoppingCart,
    },
  ];
  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50",
      )}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-around py-2">
          <BottomNavClient items={items} />
          <AuthLink variant="mobile" />
        </nav>
      </div>
    </div>
  );
};
