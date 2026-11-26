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
import { loadOrderLock, loadSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { storeMayBeBillingOffline } from "@workspace/lib/billing/order-lock";
import { resolvePlanId } from "@workspace/lib/plans";
import { BottomNav } from "./bottom-nav.client";
import { DashboardHeader } from "./dashboard-header.client";
import { HeardAboutUsDialog } from "./heard-about-us-dialog.client";
import { needsHeardAboutUs } from "./heard-about-us.data";
import { NegativeWalletDialog } from "./negative-wallet-dialog.client";
import { SellerAccessBlocked } from "./seller-access-blocked";
import { WelcomeGiftDialog } from "./welcome-gift-dialog.client";
import { loadWelcomeGiftWatch } from "./welcome-gift.data";
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

/** The top bar's data: wallet, store link, live dot, setup step, the bell's user id. */
export async function HeaderData() {
  const { user, access } = await loadShellAccess();
  if (!user || !access.allowed) return null;
  // Per-request memo: getSellerAccess already read this row, so this costs no query.
  const seller = await loadSeller(user.id);
  // A seller still not activated when the trial's days are over has every store offline (owner, 2026-11-17): the dot says so.
  // The lock is read only once the sign-up date says it can apply (loadOrderLock is cached per request; the sidebar reads it too).
  const mayBeBillingOffline = storeMayBeBillingOffline(seller?.createdAt);
  const [wallet, storeLink, { selected }, setupNextStep, billingOffline] = await Promise.all([
    getStoreWalletBalance(user.id),
    getSelectedStoreLink().catch(() => null),
    getSellerStores(),
    loadSetupNextStep(user.id).catch(() => null),
    mayBeBillingOffline ? loadOrderLock(user.id).then((lock) => lock.storeOffline) : false,
  ]);
  return (
    <DashboardHeader
      walletBalance={wallet?.balance ?? null}
      walletCurrency={wallet?.currency ?? "EGP"}
      storeLink={storeLink}
      siteLive={selected?.siteStatus === "published" && !billingOffline}
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

/** The shell's pop-ups and the Clarity session tag. One pop-up at a time: a negative wallet first, then the welcome gift. */
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
  // Clarity session tag: internal seller id + plan only.
  const clarityPlan = enabledClarityProjectId() ? resolvePlanId(seller?.plan) : null;
  return (
    <>
      <NegativeWalletDialog balance={walletBalance} currency={wallet?.currency ?? "EGP"} />
      <HeardAboutUsDialog
        show={
          askHeardAboutUs &&
          !(walletBalance != null && walletBalance < 0) &&
          welcomeGift.state !== "unseen"
        }
      />
      <WelcomeGiftDialog initial={welcomeGift} />
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
