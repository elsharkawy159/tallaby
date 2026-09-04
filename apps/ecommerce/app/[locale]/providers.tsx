"use client";

import { ReactNode, useEffect, useRef } from "react";
import posthog from "posthog-js";
import { QueryProvider } from "@/providers/query-provider";
import { AddressProvider } from "@/providers/address-provider";
import { CartProvider } from "@/providers/cart-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { useAuthUser } from "@/lib/auth/use-auth-user";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Follows the shared auth state rather than its own `onAuthStateChange`
 * subscription: password sign-in runs as a server action, which never emits a
 * SIGNED_IN event to the browser client, so those logins were never identified.
 */
function PostHogIdentity() {
  const { user, isLoading } = useAuthUser();
  const identifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (identifiedIdRef.current) {
        identifiedIdRef.current = null;
        posthog.reset();
      }
      return;
    }

    if (identifiedIdRef.current === user.id) return;
    identifiedIdRef.current = user.id;

    const properties: Record<string, string> = {};
    if (user.email) properties.email = user.email;
    if (user.name) properties.name = user.name;

    posthog.identify(user.id, properties);
  }, [user, isLoading]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <PostHogIdentity />
        <CartProvider>
          <AddressProvider>{children}</AddressProvider>
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
