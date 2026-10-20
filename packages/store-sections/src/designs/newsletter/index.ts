import type { Design } from "../builder";
import { newsletterBig } from "./newsletter-big";
import { newsletterCentered } from "./newsletter-centered";
import { newsletterChannels } from "./newsletter-channels";
import { newsletterClassic } from "./newsletter-classic";
import { newsletterCoupon } from "./newsletter-coupon";
import { newsletterInterests } from "./newsletter-interests";
import { newsletterLetter } from "./newsletter-letter";
import { newsletterPhoto } from "./newsletter-photo";
import { newsletterRuled } from "./newsletter-ruled";
import { newsletterSticker } from "./newsletter-sticker";

/** First is the default for new stores (the Classic template's sign-up panel). */
export const NEWSLETTER_DESIGNS: readonly Design[] = [newsletterClassic, newsletterCentered, newsletterPhoto, newsletterChannels, newsletterCoupon, newsletterRuled, newsletterBig, newsletterInterests, newsletterSticker, newsletterLetter];
