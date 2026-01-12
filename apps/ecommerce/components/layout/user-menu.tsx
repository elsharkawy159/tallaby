"use client";

import Link from "next/link";
import {
  User,
  Heart,
  LogOut,
  Store,
  UserCircle,
  Package,
  MapPin,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";

import { cn } from "@/lib/utils";
import { AddressManagerDialog } from "@/components/shared/address-dialog";
import type { AddressData } from "@/components/address/address.schema";
import {
  getUserAvatar,
  getUserInitials,
  formatUserName,
} from "@/app/(main)/profile/_components/profile.lib";
import { Seller } from "@/app/(main)/profile/_components/profile.types";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { signOutAction } from "@/actions/auth";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  variant?: "desktop" | "mobile";
  className?: string;
  user: SupabaseUser | null;
  seller: Seller | null;
  logout: () => Promise<void>;
  isSigningOut: boolean;
}

export function UserMenu({
  variant = "desktop",
  user,
  seller,
  logout,
  isSigningOut,
  className,
}: UserMenuProps) {
  if (!user) return null;

  const t = useTranslations("profile");
  const avatarUrl = getUserAvatar(user) || undefined;
  const userInitials = getUserInitials(user);
  const userName = formatUserName(user) || user.email;
  const isSeller = !!seller;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
          {avatarUrl ? (
            <>
              <img
                src={avatarUrl}
                alt="User avatar"
                className="md:size-6 size-4.5 rounded-full object-cover"
              />
            </>
          ) : (
            <User className="md:size-6 size-4.5" />
          )}
          <span className="text-xs md:hidden">{t("myProfile")}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
        {/* User Info Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt="User avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
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
