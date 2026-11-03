import { getBillingState } from "@workspace/lib/billing/server";
import { getWelcomeGiftWatch, type WelcomeGiftWatch } from "@workspace/lib/store-wallet/server";

/**
 * The USD launch removes the gift for new sellers (F-44c). The pop-up stops
 * here; a gift already granted still shows on the wallet page. A failed read
 * (billing tables not applied yet) leaves the gift as it is today.
 */
export async function welcomeGiftEnded(): Promise<boolean> {
  try {
    return (await getBillingState()).usdLive;
  } catch {
    return false;
  }
}

/** The layouts' read for the welcome gift popup (0119). Never cached (wallet data). */
export async function loadWelcomeGiftWatch(sellerId: string): Promise<WelcomeGiftWatch> {
  try {
    const watch = await getWelcomeGiftWatch(sellerId);
    // Most sellers stop at "none", so the billing read only runs when it matters.
    if (watch.state !== "none" && (await welcomeGiftEnded())) return { state: "none" };
    return watch;
  } catch {
    // Column missing before 0119 is applied, or a DB hiccup: never block the dashboard.
    return { state: "none" };
  }
}
