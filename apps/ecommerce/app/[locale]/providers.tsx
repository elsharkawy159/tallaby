"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { QueryProvider } from "@/providers/query-provider";
import { AddressProvider } from "@/providers/address-provider";
import { CartProvider } from "@/providers/cart-provider";
import { createClient } from "@/supabase/client";

interface ProvidersProps {
  children: ReactNode;
}

function PostHogIdentity() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;

      if (user && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        const properties: Record<string, string> = {};
        if (user.email) properties.email = user.email;

        const name = user.user_metadata.full_name;
        if (typeof name === "string") properties.name = name;

        posthog.identify(user.id, properties);
      }

      if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <PostHogIdentity />
      <CartProvider>
        <AddressProvider>{children}</AddressProvider>
      </CartProvider>
    </QueryProvider>
  );
}
