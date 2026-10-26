"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { fabClearanceFor } from "@/components/dashboard/support-fab.lib";

/** The dashboard's <main>, padded at the bottom so the WhatsApp button never covers content. */
export function DashboardMain({ children }: { children: React.ReactNode }) {
  const clearance = fabClearanceFor(usePathname() ?? "");

  return <main className={cn("min-w-0", clearance)}>{children}</main>;
}
