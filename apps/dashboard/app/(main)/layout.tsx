import { SidebarData } from "@/components/dashboard/sidebar.data";
import { SupportWhatsAppButton } from "@/components/dashboard/support-chat-link.client";
import { DashboardHeader } from "@/components/layout/dashboard-header.client";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { NegativeWalletDialog } from "@/components/layout/negative-wallet-dialog.client";
import { HeardAboutUsDialog } from "@/components/layout/heard-about-us-dialog.client";
import { needsHeardAboutUs } from "@/components/layout/heard-about-us.data";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { getStoreWalletBalance } from "./wallet/store-wallet.server";
import { createClient } from "@/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

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

  // Signed in but not a seller yet (e.g. a customer account): finish signup.
  if (user && !access.allowed && access.reason === "no_seller") {
    redirect("/signup");
  }

  if (!access.allowed) {
    return <SellerAccessBlocked access={access} />;
  }

  // sellers.id = users.id; the header shows the store wallet balance.
  const walletBalance = user ? await getStoreWalletBalance(user.id) : null;
  const askHeardAboutUs = user ? await needsHeardAboutUs(user.id) : false;

  return (
    <div className="min-h-screen flex w-full overflow-x-clip bg-background">
      <SidebarData />

      {/* Main Content Area */}
      <MainContentWrapper>
        <DashboardHeader walletBalance={walletBalance} />
        {access.status === "restricted" && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>{t("sellerStatus.restricted.title")}.</strong>{" "}
            {t("sellerStatus.restricted.message")}
          </div>
        )}
        <main className="min-w-0">{children}</main>
      </MainContentWrapper>
      <SupportWhatsAppButton />
      <NegativeWalletDialog balance={walletBalance} />
      <HeardAboutUsDialog show={askHeardAboutUs} />
    </div>
  );
}
