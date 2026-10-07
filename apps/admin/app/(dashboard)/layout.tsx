import { ReactNode, Suspense } from "react";
import SidebarData from "./_components/layout/sidebar.data";
import Header from "./_components/layout/header";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { MobileNavProvider } from "./_components/layout/mobile-nav";

interface DashboardShellProps {
  children: ReactNode;
}

function SidebarFallback() {
  return (
    <aside className="hidden lg:flex h-full w-64 shrink-0 flex-col gap-3 border-r bg-background p-4">
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
    <MobileNavProvider>
      {/* Pinned to the viewport so the document itself can never scroll:
          the sidebar and header stay put and the page pane below is the
          only scroll container. */}
      <div className="fixed inset-0 flex overflow-hidden">
        <Suspense fallback={<SidebarFallback />}>
          <SidebarData />
        </Suspense>
        {/* min-w-0 lets wide content (tables) scroll inside the page instead
            of stretching it past the viewport. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header user={user} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <main className="bg-muted/40 min-h-full min-w-0 p-3 sm:p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
