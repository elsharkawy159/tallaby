"use client";

import { Link } from "@/i18n/navigation";
import {
  Heart,
  LogOut,
  Store,
  UserCircle,
  Package,
  MapPin,
} from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";

import { cn } from "@/lib/utils";
import { AddressManagerDialog } from "@/components/shared/address-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { AddressData } from "@/components/address/address.schema";
import type { AuthenticatedUserDisplay } from "@/lib/auth/auth-user.types";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import posthog from "posthog-js";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  variant?: "desktop" | "mobile";
  className?: string;
  user: AuthenticatedUserDisplay | null;
  logout: () => Promise<void>;
  isSigningOut: boolean;
}

export function UserMenu({
  variant = "desktop",
  user,
  logout,
  isSigningOut,
  className,
}: UserMenuProps) {
  // Hooks run before any early return — `t` used to be read after
  // `if (!user) return null`, which is a conditional hook call.
  const t = useTranslations("profile");
  const { applyUser } = useAuthUser();

  const userName = user?.name || user?.email || "";
  const isSeller = user?.isSeller ?? false;

  const handleLogout = async () => {
    // #region agent log
    fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7135eb",
      },
      body: JSON.stringify({
        sessionId: "7135eb",
        runId: "post-fix",
        hypothesisId: "G",
        location: "user-menu.tsx:handleLogout",
        message: "Logout clicked",
        data: { userIdPrefix: user?.id?.slice(0, 8) ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    posthog.reset();
    // Clear the shared navbar state immediately — do not re-fetch, or a
    // hung /api/auth/me can leave a stale signed-in avatar on screen.
    applyUser(null);

    try {
      await logout();
    } catch (error) {
      // signOutAction ends with redirect(), which throws NEXT_REDIRECT.
      // Swallowing it aborts navigation back to home.
      if (isRedirectError(error)) throw error;
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "cursor-pointer flex flex-col  items-center",
            variant === "desktop"
              ? "text-white hover:text-gray-200"
              : "text-gray-600 hover:text-primary",
            className
          )}
          title={t("welcome", { name: userName })}
        >
          <UserAvatar
            user={user}
            size="sm"
            className={cn(
              "size-4.5 md:size-6 border-2",
              variant === "desktop" ? "border-white" : "border-gray-300"
            )}
            fallbackClassName="text-[10px] md:text-xs"
          />
          <span className="text-xs md:hidden">{t("myProfile")}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
        {/* User Info Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            {/* <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p> */}
            {isSeller && (
              <div className="flex items-center gap-1 mt-1">
                <Store className="size-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  {t("sellerAccount")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          {/* Profile Section */}
          <div className="space-y-1">
            <Link
              href="/profile"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <UserCircle className="size-5 text-gray-500" />
              {t("myProfile")}
            </Link>

            <Link
              href="/profile/orders"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <Package className="size-4.5 text-gray-500" />
              {t("myOrders")}
            </Link>

            <Link
              href="/profile/wishlist"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <Heart className="size-4.5 text-gray-500" />
              {t("myWishlist")}
            </Link>

            <AddressManagerDialog
              onSuccess={(address: AddressData) => {
                console.log("Address saved:", address);
              }}
              trigger={
                <div className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md cursor-pointer">
                  <MapPin className="size-4.5 text-gray-500" />
                  {t("manageAddresses")}
                </div>
              }
            />
          </div>

          {/* Seller Dashboard - Only show if user is a seller */}
          {isSeller && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="px-3 py-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("sellerTools")}
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start h-9 px-3 text-green-700 hover:text-green-800 hover:bg-green-50"
                >
                  <Link
                    href={
                      process.env.NODE_ENV === "development"
                        ? "http://localhost:3001"
                        : "https://dashboard.tallaby.com/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Store className="size-4" />
                    {t("sellerDashboard")}
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Settings & Logout */}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start h-9 gap-2.5 font-medium flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            <LogOut className="size-4.5 text-red-500" />
            {isSigningOut ? t("signingOut") : t("signOut")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
