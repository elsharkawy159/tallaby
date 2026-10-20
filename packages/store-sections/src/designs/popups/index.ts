import type { Design } from "../builder";
import { popupApp } from "./popup-app";
import { popupExit } from "./popup-exit";
import { popupRestock } from "./popup-restock";
import { popupReward } from "./popup-reward";
import { popupSaleEnd } from "./popup-sale-end";
import { popupWelcome } from "./popup-welcome";
import { popupWhatsapp } from "./popup-whatsapp";

/**
 * Pop-ups & bars (library PU), drawn inline: tree sections sit in the page
 * flow with no overlay, trigger, timer or script, so only the pieces that
 * still make sense as a section are here, in design order: the welcome offer
 * card, the cart reminder, the app strip, the WhatsApp button, the restock
 * card, the sale bar with a typed end date and the reward card. The cookie
 * bar, the recent-purchase toast and the region switcher are left out (no
 * consent store, no order feed, no locale link). The first is the default.
 */
export const POPUP_DESIGNS: readonly Design[] = [popupWelcome, popupExit, popupApp, popupWhatsapp, popupRestock, popupSaleEnd, popupReward];
