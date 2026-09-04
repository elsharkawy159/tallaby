"use client";

import { useEffect, useState } from "react";
import { signOutAction } from "@/actions/auth";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { UserMenu } from "./user-menu";
import { AuthLinkClient } from "./auth-link-client";
import { GuestProfileLink } from "./guest-profile-link";

interface AuthLinkProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

function getGuestUidFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )guest_uid=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const AuthLink = ({ variant = "desktop", className }: AuthLinkProps) => {
  const { user, isLoading } = useAuthUser();
  const [hasGuestSession, setHasGuestSession] = useState(false);

  useEffect(() => {
    setHasGuestSession(Boolean(getGuestUidFromCookie()));
  }, []);

  useEffect(() => {
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
        hypothesisId: "C",
        location: "auth-link.tsx:state",
        message: "AuthLink state",
        data: {
          variant,
          isLoading,
          hasUser: Boolean(user),
          userIdPrefix: user?.id?.slice(0, 8) ?? null,
          hasGuestSession,
          branch: isLoading
            ? "loading"
            : user
              ? "user"
              : hasGuestSession
                ? "guest"
                : "signed-out",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [variant, isLoading, user, hasGuestSession]);

  if (isLoading) {
    return null;
  }

  if (user) {
    // `isSeller` arrives on the user itself now. This component used to call
    // getSellerProfile() from the browser — a second round-trip that fetched a
    // full seller record including 12 products — only to read `!!seller`.
    return (
      <UserMenu
        variant={variant}
        user={user}
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
