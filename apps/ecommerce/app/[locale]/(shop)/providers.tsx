"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { AddressProvider } from "@/providers/address-provider";
import { CartProvider } from "@/providers/cart-provider";
import { AuthProvider } from "@/providers/auth-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CartProvider>
          <AddressProvider>{children}</AddressProvider>
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
