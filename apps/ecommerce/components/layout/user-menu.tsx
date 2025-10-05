"use client";

import Link from "next/link";
import {
  User,
  Settings,
  ShoppingBag,
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

import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { AddressManagerDialog } from "@/components/shared/address-dialog";
import type { AddressData } from "@/components/address/address.schema";

interface UserMenuProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export function UserMenu({ variant = "desktop", className }: UserMenuProps) {
  const {
    user,
    userWithSeller,
    isLoadingUserWithSeller,
    logout,
    isSigningOut,
  } = useAuth();

  if (!user) return null;

  const avatarUrl = user?.identities?.[0]?.identity_data?.avatar_url;
  const userInitials = user.email?.slice(0, 2).toUpperCase() || "U";
  const userName = userWithSeller?.user?.full_name || user.email;
  const isSeller = !!userWithSeller?.seller;

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "cursor-pointer",
            variant === "desktop"
              ? "text-white hover:text-gray-200"
              : "text-gray-600 hover:text-primary",
            className
          )}
          title={`Welcome, ${userName}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User avatar"
              className="md:size-6 size-5 rounded-full object-cover"
            />
          ) : (
            <User className="md:size-6 size-5" />
          )}
        </button>
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
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            {isSeller && (
              <div className="flex items-center gap-1 mt-1">
                <Store className="size-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  Seller Account
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
              My Profile
            </Link>

            <Link
              href="/orders"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <Package className="size-4.5 text-gray-500" />
              My Orders
            </Link>

            <Link
              href="/wishlist"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <Heart className="size-4.5 text-gray-500" />
              Wishlist
            </Link>

            <AddressManagerDialog
              onSuccess={(address: AddressData) => {
                console.log("Address saved:", address);
              }}
              trigger={
                <div className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md cursor-pointer">
                  <MapPin className="size-4.5 text-gray-500" />
                  Manage Addresses
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
                    Seller Tools
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
                        : "https://dashboard.yourdomain.com"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Store className="size-4 mr-3" />
                    Seller Dashboard
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Settings & Logout */}
          <Separator className="my-2" />
          <div className="space-y-1">
            <Link
              href="/settings"
              className="w-full justify-start h-9 px-3 gap-2.5 font-medium flex items-center hover:bg-gray-100 rounded-md"
            >
              <Settings className="size-4.5 text-gray-500" />
              Settings
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start h-9 gap-2.5 font-medium flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
              onClick={handleLogout}
              disabled={isSigningOut}
            >
              <LogOut className="size-4.5 text-red-500" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
