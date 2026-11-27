import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SidebarData } from "@/components/dashboard/sidebar.data";
import { AccountMoneyProvider } from "@/components/account-money.client";
import { ClarityIdentify } from "@/components/clarity.client";
import { EgpRateProvider } from "@/components/egp-rate.client";
import { SiteDataProvider } from "@/providers/site-data";
import { loadSetupNextStep } from "@/app/[locale]/(main)/_components/setup-next-step.server";
import { StoreLiveCelebration } from "@/app/[locale]/(main)/_components/store-live-celebration.client";
import { getStoreWalletBalance } from "@/app/[locale]/(main)/wallet/store-wallet.server";
import { enabledClarityProjectId } from "@/lib/analytics/clarity.lib";
import { loadSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { editorAiEnabled } from "@/app/[locale]/(builder)/stores/[storeId]/editor/server/editor-entry.data";
import { aiConfigured } from "@workspace/ai";
import { resolvePlanId } from "@workspace/lib/plans";
import { BottomNav } from "./bottom-nav.client";
import { DashboardHeader } from "./dashboard-header.client";
import { HeardAboutUsDialog } from "./heard-about-us-dialog.client";
import { needsHeardAboutUs } from "./heard-about-us.data";
import { NegativeWalletDialog } from "./negative-wallet-dialog.client";
import { SellerAccessBlocked } from "./seller-access-blocked";
import { WelcomeGiftDialog } from "./welcome-gift-dialog.client";
import { loadWelcomeGiftWatch } from "./welcome-gift.data";
import { WelcomeTourDialog } from "./welcome-tour-dialog.client";
import { isWelcomeTourEligible } from "./welcome-tour.lib";
import { loadShellAccess, shellAccountMoney, shellEgpRate, shellSiteData } from "./shell.server";

/*
 * The (main) layout's streamed holes (docs/plans/dashboard-performance.md B2).
 * The layout renders each one in its own <Suspense>, so the frame around them
 * is a static shell with no seller data. Every hole checks access first and
 * renders nothing for a user who may not use the dashboard: SellerGate covers
 * the frame for them. Page loaders still enforce access themselves
 * (lib/auth/require-seller.server.ts).
 */

/**
 * Signed in but not a seller yet (e.g. a customer account): finish signup.
 * Pending, suspended or no seller: a full-screen notice over the frame.
 */
export async function SellerGate() {
  const { user, access } = await loadShellAccess();
  if (user && !access.allowed && access.reason === "no_seller") {
    redirect({ href: "/signup", locale: await getLocale() });
  }
  if (access.allowed) return null;
  return (
    // Covers the sidebar (z-40/50), header (z-30) and pop-ups (z-50) behind it.
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <SellerAccessBlocked access={access} />
    </div>
  );
}

/** Restricted sellers keep the dashboard (e.g. to ship open orders) and see this under the header. */
export async function RestrictedBanner() {
  const { access } = await loadShellAccess();
  if (!access.allowed || access.status !== "restricted") return null;
  const t = await getTranslations();
  return (
    <div className="border-b border-(--s-line) bg-accent-soft px-7 py-3 text-sm text-accent-ink max-[1020px]:px-4">
      <strong>{t("sellerStatus.restricted.title")}.</strong>{" "}
      {t("sellerStatus.restricted.message")}
    </div>
  );
}

/** SidebarData calls requireSeller, which throws for a blocked seller: only an allowed one gets it. */
export async function GatedSidebar() {
  const { access } = await loadShellAccess();
  if (!access.allowed) return null;
  return <SidebarData />;
}

/** The top bar's data: wallet, store link, setup step, the bell's user id. The live/offline eye is in the sidebar (sidebar.data.tsx). */
export async function HeaderData() {
  const { user, access } = await loadShellAccess();
  if (!user || !access.allowed) return null;
  const [wallet, storeLink, { selected }, setupNextStep] = await Promise.all([
    getStoreWalletBalance(user.id),
    getSelectedStoreLink().catch(() => null),
    getSellerStores(),
    loadSetupNextStep(user.id).catch(() => null),
  ]);
  return (
    <DashboardHeader
      walletBalance={wallet?.balance ?? null}
      walletCurrency={wallet?.currency ?? "EGP"}
      storeLink={storeLink}
      storeId={selected?.id ?? null}
      setupNextStep={setupNextStep}
      userId={user.id}
    />
  );
}

/** Phones and tablets: Home, Products, Orders, Search (owner, 2026-11-18). */
export async function BottomNavData() {
  const { access } = await loadShellAccess();
  if (!access.allowed) return null;
  const { selected } = await getSellerStores();
  return <BottomNav storeId={selected?.id ?? null} />;
}

/** The shell's pop-ups and the Clarity session tag. One pop-up at a time: a negative wallet first, then the welcome gift, then the rest. */
export async function ShellDialogs() {
  const { user, access } = await loadShellAccess();
  if (!user || !access.allowed) return null;
  // All per-request memos shared with the header (the wallet) and the access check (the seller row).
  const [wallet, askHeardAboutUs, welcomeGift, seller] = await Promise.all([
    getStoreWalletBalance(user.id),
    needsHeardAboutUs(user.id),
    loadWelcomeGiftWatch(user.id),
    loadSeller(user.id),
  ]);
  const walletBalance = wallet?.balance ?? null;
  const walletNegative = walletBalance != null && walletBalance < 0;
  // Clarity session tag: internal seller id + plan only.
  const clarityPlan = enabledClarityProjectId() ? resolvePlanId(seller?.plan) : null;
  // The welcome tour (F-114): new sellers only, never next to another pop-up.
  const showTour =
    isWelcomeTourEligible({ sellerCreatedAt: seller?.createdAt }) &&
    !walletNegative &&
    !askHeardAboutUs &&
    welcomeGift.state !== "unseen";
  // Its tile facts are read only when it may show: two platform switches (one small read each, memoised).
  const [editorAi, tallabyPayLive] = showTour
    ? await Promise.all([editorAiEnabled(), isSwitchOn("tallaby_pay_live").catch(() => false)])
    : [false, false];
  return (
    <>
      <NegativeWalletDialog balance={walletBalance} currency={wallet?.currency ?? "EGP"} />
      <HeardAboutUsDialog
        show={
          askHeardAboutUs &&
          !walletNegative &&
          welcomeGift.state !== "unseen"
        }
      />
      <WelcomeGiftDialog initial={welcomeGift} />
      {showTour && (
        <WelcomeTourDialog
          show
          userId={user.id}
          productAi={aiConfigured()}
          editorAi={editorAi}
          tallabyPayLive={tallabyPayLive}
          plan={resolvePlanId(seller?.plan)}
        />
      )}
      <StoreLiveCelebration />
      {clarityPlan && <ClarityIdentify sellerId={user.id} plan={clarityPlan} />}
    </>
  );
}

/**
 * Seller profile + store link and the EGP rate for the whole frame. Not async:
 * it hands the providers promises without awaiting them, so the frame and the
 * page render at once; consumers `use()` them under their own Suspense
 * boundary (a shell hole, or the page's loading.tsx).
 */
export function ShellProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteDataProvider promise={shellSiteData()}>
      <EgpRateProvider rate={shellEgpRate()}>{children}</EgpRateProvider>
    </SiteDataProvider>
  );
}

/** The account currency for the page content (product prices, coupons, offers). Same promise pattern as ShellProviders. */
export function AccountMoneyShell({ children }: { children: React.ReactNode }) {
  return <AccountMoneyProvider value={shellAccountMoney()}>{children}</AccountMoneyProvider>;
}
