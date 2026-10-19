import type { Design } from "../builder";
import { promoBento } from "./promo-bento";
import { promoCoupon } from "./promo-coupon";
import { promoDeal } from "./promo-deal";
import { promoPair } from "./promo-pair";
import { promoTicker } from "./promo-ticker";

/** First is the default for new stores (the Classic template's offers). */
export const PROMOTION_DESIGNS: readonly Design[] = [promoPair, promoTicker, promoDeal, promoCoupon, promoBento];
