import { getWelcomeGiftWatch, type WelcomeGiftWatch } from "@workspace/lib/store-wallet/server";

/** The layouts' read for the welcome gift popup (0119). Never cached (wallet data). */
export async function loadWelcomeGiftWatch(sellerId: string): Promise<WelcomeGiftWatch> {
  try {
    return await getWelcomeGiftWatch(sellerId);
  } catch {
    // Column missing before 0119 is applied, or a DB hiccup: never block the dashboard.
    return { state: "none" };
  }
}
