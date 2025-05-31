"use client";
import { useState } from "react";
import { Menu, Search, Moon, Sun, Globe } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useTheme } from "next-themes";
import { NotificationCenter } from "../dashboard/NotificationCenter";

interface NavbarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

export const Navbar = ({ onMenuToggle, pageTitle }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>

            {/* Notifications */}
            <NotificationCenter />

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
