import { SidebarData } from "@/components/dashboard/sidebar.data";
import { DashboardHeader } from "@/components/layout/dashboard-header.client";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { createClient } from "@/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy guarantees a session; this gate decides whether that session
  // belongs to a seller who may use the dashboard right now.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const access = user
    ? await getSellerAccess(user.id)
    : ({ allowed: false, reason: "no_seller" } as const);

  const t = await getTranslations();

  if (!access.allowed) {
    return <SellerAccessBlocked access={access} />;
  }

  return (
    <div className="min-h-screen flex w-full overflow-x-clip bg-background">
      <SidebarData />

      {/* Main Content Area */}
      <MainContentWrapper>
        <DashboardHeader />
        {access.status === "restricted" && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>{t("sellerStatus.restricted.title")}.</strong>{" "}
            {t("sellerStatus.restricted.message")}
          </div>
        )}
        <main className="min-w-0">{children}</main>
      </MainContentWrapper>
    </div>
  );
}
