import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { WelcomeGiftDialog } from "@/components/layout/welcome-gift-dialog.client";
import { loadWelcomeGiftWatch } from "@/components/layout/welcome-gift.data";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { getSessionUser } from "@/lib/auth/session.server";
import { loadSeller } from "@/lib/auth/require-seller.server";
import { ClarityIdentify } from "@/components/clarity.client";
import { enabledClarityProjectId } from "@/lib/analytics/clarity.lib";
import { resolvePlanId } from "@workspace/lib/plans";

// Kept blocking on purpose (docs/plans/dashboard-performance.md B2, B3 exceptions):
// the builder and editor load the seller's drafts and the whole editor at once,
// and the gate must decide before any of it renders, so a static frame would
// gain nothing here.
export const instant = false;

/**
 * Full-screen builder routes (PLAN.md P4-06): the same seller gate as the
 * dashboard layout, without the sidebar.
 */
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale: await getLocale() });

  const access = await getSellerAccess(user.id);
  if (!access.allowed && access.reason === "no_seller") redirect({ href: "/signup", locale: await getLocale() });
  if (!access.allowed) return <SellerAccessBlocked access={access} />;

  // A seller who publishes from the builder sees the welcome gift popup here (0119).
  const welcomeGift = await loadWelcomeGiftWatch(user.id);
  // Clarity session tag: internal seller id + plan only (loadSeller is per-request cached; getSellerAccess already read it).
  const clarityPlan = enabledClarityProjectId() ? resolvePlanId((await loadSeller(user.id))?.plan) : null;

  return (
    <div className="min-h-dvh bg-background">
      {children}
      <WelcomeGiftDialog initial={welcomeGift} />
      {clarityPlan && <ClarityIdentify sellerId={user.id} plan={clarityPlan} />}
    </div>
  );
}
