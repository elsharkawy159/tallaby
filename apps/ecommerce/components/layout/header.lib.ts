import { Home, Compass, ShoppingCart, Store } from "lucide-react";
import type { NavigationItem } from "./header.types";

export const navigationItems: NavigationItem[] = [
  {
    href: "/products",
    label: "All Products",
  },
  {
    href: "/stores",
    label: "Stores",
  },
  {
    href: "/about",
    label: "About",
  },
];

export const bottomNavigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/products",
    label: "Shopping",
    icon: Store,
  },
  // {
  //   href: "/cart",
  //   label: "Cart",
  //   icon: ShoppingCart,
  // },
];

export const getSearchPlaceholder = (variant: "mobile" | "desktop"): string => {
  return variant === "mobile"
    ? "Search products..."
    : "Search for products, brands, categories...";
};