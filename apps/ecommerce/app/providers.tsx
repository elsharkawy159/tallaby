"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
