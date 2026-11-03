"use server";

import {
  checkWelcomeGift,
  markWelcomeGiftPopupSeen,
  type WelcomeGiftWatch,
} from "@workspace/lib/store-wallet/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { welcomeGiftEnded } from "./welcome-gift.data";

/**
 * The welcome gift popup's server actions (0119). The seller always comes from
 * the session; the client sends nothing.
 */

/** Grants the gift if setup is now complete, then says whether to show the popup. */
export async function checkWelcomeGiftAction(): Promise<WelcomeGiftWatch> {
  try {
    const seller = await requireSeller();
    if (await welcomeGiftEnded()) return { state: "none" };
    return await checkWelcomeGift(seller.sellerId);
  } catch {
    // Not signed in as a seller, or a DB hiccup: show nothing, try again later.
    return { state: "none" };
  }
}

/** The seller closed the popup: never show it again. */
export async function dismissWelcomeGiftAction(): Promise<void> {
  try {
    const seller = await requireSeller();
    await markWelcomeGiftPopupSeen(seller.sellerId);
  } catch {
    console.error("[welcome-gift] dismiss failed");
  }
}
