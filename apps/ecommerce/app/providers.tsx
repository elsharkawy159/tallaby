"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { WishlistProvider } from "@/providers/wishlist-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
