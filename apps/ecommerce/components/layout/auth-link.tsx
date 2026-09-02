"use client";

import { useEffect, useState } from "react";
import { getSellerProfile } from "@/actions/seller";
import { signOutAction } from "@/actions/auth";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { UserMenu } from "./user-menu";
import { AuthLinkClient } from "./auth-link-client";
import { GuestProfileLink } from "./guest-profile-link";
import type { Seller } from "@/app/[locale]/(main)/profile/_components/profile.types";

interface AuthLinkProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

function getGuestUidFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )guest_uid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const AuthLink = ({
  variant = "desktop",
  className,
}: AuthLinkProps) => {
  const { user, isLoading } = useAuthUser();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [hasGuestSession, setHasGuestSession] = useState(false);

  useEffect(() => {
    setHasGuestSession(Boolean(getGuestUidFromCookie()));
  }, []);

  useEffect(() => {
    if (!user || user.user_metadata?.is_seller !== true) {
      setSeller(null);
      return;
    }

    getSellerProfile(user.id).then((sellerResult) => {
      if (sellerResult.success && sellerResult.data) {
        setSeller(sellerResult.data);
      }
    });
  }, [user]);

  if (isLoading) {
    return null;
  }

  if (user) {
    return (
      <UserMenu
        variant={variant}
        user={user}
        seller={seller}
        logout={signOutAction}
        isSigningOut={false}
        className={className}
      />
    );
  }

  if (hasGuestSession) {
    return <GuestProfileLink variant={variant} className={className} />;
  }

  return <AuthLinkClient variant={variant} className={className} />;
};
