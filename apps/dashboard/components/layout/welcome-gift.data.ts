import { cache } from "react";
import { getWelcomeGiftWatch, type WelcomeGiftWatch } from "@workspace/lib/store-wallet/server";
import { loadBillingState } from "@/lib/billing/billing-state.server";

/**
 * The USD launch removes the gift for new sellers (F-44c). The pop-up stops
 * here; a gift already granted still shows on the wallet page. A failed read
 * (billing tables not applied yet) leaves the gift as it is today.
 */
export async function welcomeGiftEnded(): Promise<boolean> {
  try {
    return (await loadBillingState()).usdLive;
  } catch {
    return false;
  }
}

/**
 * The layouts' read for the welcome gift popup (0119), once per request. Never
 * cached across requests (wallet data). Billing is read first: the layout reads
 * it anyway (per-request memo), and once the gift has ended no gift row matters,
 * so that read is skipped.
 */
export const loadWelcomeGiftWatch = cache(async (sellerId: string): Promise<WelcomeGiftWatch> => {
  try {
    if (await welcomeGiftEnded()) return { state: "none" };
    return await getWelcomeGiftWatch(sellerId);
  } catch {
    // Column missing before 0119 is applied, or a DB hiccup: never block the dashboard.
    return { state: "none" };
  }
});
