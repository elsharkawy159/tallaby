"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { AddressProvider } from "@/providers/address-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AddressProvider>{children}</AddressProvider>
    </QueryProvider>
  );
}
