import { Home, Compass, ShoppingCart, Store } from "lucide-react";
import type { NavigationItem } from "./header.types";
import { getTranslations } from "next-intl/server";

export const getNavigationItems = async (): Promise<NavigationItem[]> => {
  const t = await getTranslations("navigation");
  return [
    {
      href: "/products",
      label: t("allProducts"),
    },
    {
      href: "/stores",
      label: t("stores"),
    },
    {
      href: "/about",
      label: t("about"),
    },
  ];
};

export const getBottomNavigationItems = async (): Promise<NavigationItem[]> => {
  const t = await getTranslations("navigation");
  return [
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
};
