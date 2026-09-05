import { ReactNode, Suspense } from "react";
import SidebarData from "./_components/layout/sidebar.data";
import Header from "./_components/layout/header";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Toaster } from "@workspace/ui/components/sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";

interface DashboardShellProps {
  children: ReactNode;
}

function SidebarFallback() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-3 border-r bg-background p-4">
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </aside>
  );
}

/**
 * `getCurrentAdminUser` is React.cache-wrapped and `proxy.ts` already ran the
 * same auth check moments ago, so this costs one warm round trip shared with
 * every page below it — not a second, separate auth fetch. Passed down as a
 * prop so Header/UserNav don't each run their own client-side Supabase call.
 */
export default async function DashboardLayout({ children }: DashboardShellProps) {
  const user = await getCurrentAdminUser();

  return (
    <div className="flex">
      <Suspense fallback={<SidebarFallback />}>
        <SidebarData />
      </Suspense>
      <div className="flex-1 overflow-hidden">
        <Header user={user} />
        <ScrollArea className="h-[calc(100vh-64px)]">
          <main className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 min-h-[calc(100vh-65px)]">
            {children}
          </main>
        </ScrollArea>
      </div>
      <Toaster />
    </div>
  );
}
