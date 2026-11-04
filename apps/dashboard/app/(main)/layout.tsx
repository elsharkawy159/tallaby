import { SidebarData } from "@/components/dashboard/sidebar.data";
import { SupportWhatsAppButton } from "@/components/dashboard/support-chat-link.client";
import { DashboardHeader } from "@/components/layout/dashboard-header.client";
import { DashboardMain } from "@/components/layout/dashboard-main.client";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { NegativeWalletDialog } from "@/components/layout/negative-wallet-dialog.client";
import { HeardAboutUsDialog } from "@/components/layout/heard-about-us-dialog.client";
import { needsHeardAboutUs } from "@/components/layout/heard-about-us.data";
import { WelcomeGiftDialog } from "@/components/layout/welcome-gift-dialog.client";
import { loadWelcomeGiftWatch } from "@/components/layout/welcome-gift.data";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { SetupPrompts } from "./_components/setup-prompts.client";
import { getStoreWalletBalance } from "./wallet/store-wallet.server";
import { getSessionUser } from "@/lib/auth/session.server";
import { AccountMoneyProvider } from "@/components/account-money.client";
import { loadAccountMoney } from "@/lib/stores/account-money.server";
import { EGP_ACCOUNT } from "@/lib/stores/account-money.lib";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy guarantees a session; this gate decides whether that session
  // belongs to a seller who may use the dashboard right now.
  const user = await getSessionUser();
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
  const [wallet, askHeardAboutUs, welcomeGift, storeLink, accountMoney] = await Promise.all([
    user ? getStoreWalletBalance(user.id) : null,
    user ? needsHeardAboutUs(user.id) : false,
    user ? loadWelcomeGiftWatch(user.id) : ({ state: "none" } as const),
    getSelectedStoreLink().catch(() => null),
    user ? loadAccountMoney(user.id).catch(() => EGP_ACCOUNT) : EGP_ACCOUNT,
  ]);
  const walletBalance = wallet?.balance ?? null;

  return (
    <div className="min-h-screen flex w-full overflow-x-clip bg-background">
      <SidebarData />

      {/* Main Content Area */}
      <MainContentWrapper>
        <DashboardHeader walletBalance={walletBalance} walletCurrency={wallet?.currency ?? "EGP"} storeLink={storeLink} />
        {access.status === "restricted" && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>{t("sellerStatus.restricted.title")}.</strong>{" "}
            {t("sellerStatus.restricted.message")}
          </div>
        )}
        <SetupPrompts />
        <AccountMoneyProvider value={accountMoney}>
          <DashboardMain>{children}</DashboardMain>
        </AccountMoneyProvider>
      </MainContentWrapper>
      <SupportWhatsAppButton />
      <NegativeWalletDialog balance={walletBalance} currency={wallet?.currency ?? "EGP"} />
      {/* One pop-up at a time: a negative wallet is the more urgent one, then the welcome gift. */}
      <HeardAboutUsDialog
        show={askHeardAboutUs && !(walletBalance != null && walletBalance < 0) && welcomeGift.state !== "unseen"}
      />
      <WelcomeGiftDialog initial={welcomeGift} />
    </div>
  );
}
