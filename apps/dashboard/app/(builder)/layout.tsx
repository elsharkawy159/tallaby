import { redirect } from "next/navigation";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { WelcomeGiftDialog } from "@/components/layout/welcome-gift-dialog.client";
import { loadWelcomeGiftWatch } from "@/components/layout/welcome-gift.data";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { getSessionUser } from "@/lib/auth/session.server";
import { loadSeller } from "@/lib/auth/require-seller.server";
import { ClarityIdentify } from "@/components/clarity.client";
import { enabledClarityProjectId } from "@/lib/analytics/clarity.lib";
import { resolvePlanId } from "@workspace/lib/plans";

/**
 * Full-screen builder routes (PLAN.md P4-06): the same seller gate as the
 * dashboard layout, without the sidebar.
 */
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const access = await getSellerAccess(user.id);
  if (!access.allowed && access.reason === "no_seller") redirect("/signup");
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
