import { Suspense } from "react";
import { SidebarSkeleton } from "@/components/dashboard/sidebar-skeleton.client";
import { HeaderSkeleton } from "@/components/layout/header-skeleton";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import {
  AccountMoneyShell,
  BottomNavData,
  GatedSidebar,
  HeaderData,
  RestrictedBanner,
  SellerGate,
  ShellDialogs,
  ShellProviders,
} from "@/components/layout/shell.data";
// Replaced by the header Next step button (owner, 2026-11-18).
// import { SetupPrompts } from "./_components/setup-prompts.client";

/**
 * The dashboard frame (docs/plans/dashboard-performance.md B2). It awaits
 * nothing, so the frame (sidebar and header skeletons) is a prerendered static
 * shell, the same bytes for every seller; each piece of seller data streams
 * into its own <Suspense> hole (components/layout/shell.data.tsx). The access
 * gate is one of those holes: a blocked seller gets a full-screen notice over
 * the frame, a customer account is sent to /signup, and the pages' own loaders
 * still refuse them (lib/auth/require-seller.server.ts).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Seller profile + store link and the EGP rate for the sidebar, header and pages, as promises (never awaited here).
    <ShellProviders>
      {/* .seller-shell switches on the design system (app/globals.css). Only this layout has it, so (builder) is untouched. */}
      <div className="seller-shell flex min-h-screen w-full overflow-x-clip bg-background">
        <Suspense fallback={<SidebarSkeleton />}>
          <GatedSidebar />
        </Suspense>

        {/* Main Content Area */}
        <MainContentWrapper>
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderData />
          </Suspense>
          <Suspense fallback={null}>
            <RestrictedBanner />
          </Suspense>
          {/* Replaced by the header Next step button (owner, 2026-11-18). */}
          {/* <SetupPrompts /> */}
          <AccountMoneyShell>
            <main className="min-w-0 flex-1">{children}</main>
          </AccountMoneyShell>
        </MainContentWrapper>
        {/* Phones and tablets: Home, Products, Orders, Search (owner, 2026-11-18). Fixed, so no fallback is needed for layout. */}
        <Suspense fallback={null}>
          <BottomNavData />
        </Suspense>
        <Suspense fallback={null}>
          <ShellDialogs />
        </Suspense>
        <Suspense fallback={null}>
          <SellerGate />
        </Suspense>
      </div>
    </ShellProviders>
  );
}
