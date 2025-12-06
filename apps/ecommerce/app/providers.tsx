"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { WishlistProvider } from "@/providers/wishlist-provider";
import { AddressProvider } from "@/providers/address-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AddressProvider>
        <WishlistProvider>
          <CartProvider>
            <AuthProvider>{children}</AuthProvider>
          </CartProvider>
        </WishlistProvider>
      </AddressProvider>
    </QueryProvider>
  );
}
