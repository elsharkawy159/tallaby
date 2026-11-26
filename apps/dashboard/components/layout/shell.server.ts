import { cache } from "react";
import { getSiteData } from "@/actions/site-data";
import { getSellerAccess, type SellerAccess } from "@/lib/auth/seller-access";
import { getSessionUser } from "@/lib/auth/session.server";
import { getEgpPerUsd } from "@/lib/billing/egp-rate.server";
import { loadAccountMoney } from "@/lib/stores/account-money.server";
import { EGP_ACCOUNT, type AccountMoney } from "@/lib/stores/account-money.lib";

/**
 * The (main) layout's reads, shared per request (React cache(), never across
 * requests: rule 8). The layout itself awaits none of them, so its frame is a
 * prerendered static shell (docs/plans/dashboard-performance.md B2); each
 * Suspense hole (gate, sidebar, header, dialogs) awaits what it needs.
 *
 * Every read starts from the session, so nothing here touches the database
 * while Next prerenders the shell (the session read never resolves there).
 */

/** The proxy guarantees a session; this decides whether it belongs to a seller who may use the dashboard now. */
export const loadShellAccess = cache(async (): Promise<{
  user: Awaited<ReturnType<typeof getSessionUser>>;
  access: SellerAccess;
}> => {
  const user = await getSessionUser();
  const access = user
    ? await getSellerAccess(user.id)
    : ({ allowed: false, reason: "no_seller" } as const);
  return { user, access };
});

type SiteData = Awaited<ReturnType<typeof getSiteData>>;

/** A blocked or signed-out user gets no seller data: the access overlay covers the frame. */
const NO_SITE_DATA: SiteData = {
  seller: { success: false, data: undefined, error: "no_access" },
  storeLink: null,
};

/** Seller profile + store link for the sidebar, header and Help page (SiteDataProvider). */
export const shellSiteData = cache(
  (): Promise<SiteData> =>
    loadShellAccess().then(({ access }) => (access.allowed ? getSiteData() : NO_SITE_DATA)),
);

/** USD wallet amounts and prices are shown in EGP at this rate (owner, 2026-11-09). Display only. */
export const shellEgpRate = cache(
  (): Promise<number | null> =>
    loadShellAccess().then(({ access }) => (access.allowed ? getEgpPerUsd() : null)),
);

/** The currency of the seller's account-level amounts (AccountMoneyProvider). Display only. */
export const shellAccountMoney = cache(
  (): Promise<AccountMoney> =>
    loadShellAccess().then(({ user, access }) =>
      user && access.allowed ? loadAccountMoney(user.id).catch(() => EGP_ACCOUNT) : EGP_ACCOUNT,
    ),
);
