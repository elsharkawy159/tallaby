"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { QueryProvider } from "@/providers/query-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
