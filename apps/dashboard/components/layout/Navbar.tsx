"use client";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

import { NotificationCenter } from "../dashboard/NotificationCenter";
import { UserNav } from "./user-nav";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  let pageTitle = "";
  switch (pathname) {
    case "/":
      pageTitle = "Analytics Dashboard";
      break;
    case "/products":
      pageTitle = "My Products";
      break;
    case "/products/new":
      pageTitle = "Add New Product";
      break;
    case "/orders":
      pageTitle = "Orders";
      break;
    case "/coupons":
      pageTitle = "Coupons";
      break;
    case "/settings":
      pageTitle = "Settings";
      break;
    case "/financial":
      pageTitle = "Financial";
      break;
    case "/reviews":
      pageTitle = "Reviews";
      break;
    case "/marketing":
      pageTitle = "Marketing";
      break;
    case "/shipping":
      pageTitle = "Shipping";
      break;
    case "/reports":
      pageTitle = "Reports";
      break;
    case "/help":
      pageTitle = "Help";
      break;
    default:
      pageTitle = "Dashboard";
      break;
  }
  return (
    <nav className="fixed top-0 right-0 left-72 bg-white dark:bg-gray-800 border-b border-l border-gray-200 dark:border-gray-700 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {pageTitle && (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            {/* <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div> */}

            {/* Notifications */}

            {/* <NotificationCenter /> */}

            {/* Language Toggle */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("en")}>
                  English {locale === "en" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ar")}>
                  العربية {locale === "ar" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}

            {/* Theme Toggle */}
            
            {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button> */}

            {/* User Navigation */}
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  );
};
