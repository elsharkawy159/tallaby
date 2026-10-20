import type { Design } from "../builder";
import { promoBento } from "./promo-bento";
import { promoCoupon } from "./promo-coupon";
import { promoDeal } from "./promo-deal";
import { promoPair } from "./promo-pair";
import { promoPercent } from "./promo-percent";
import { promoShipping } from "./promo-shipping";
import { promoSticker } from "./promo-sticker";
import { promoTicker } from "./promo-ticker";
import { promoTiers } from "./promo-tiers";
import { promoTwin } from "./promo-twin";

/** First is the default for new stores (the Classic template's offers). */
export const PROMOTION_DESIGNS: readonly Design[] = [promoPair, promoTicker, promoDeal, promoCoupon, promoBento, promoTwin, promoShipping, promoPercent, promoTiers, promoSticker];
