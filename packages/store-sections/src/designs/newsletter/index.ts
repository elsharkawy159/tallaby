import type { Design } from "../builder";
import { newsletterClassic } from "./newsletter-classic";
import { newsletterCentered } from "./newsletter-centered";
import { newsletterCoupon } from "./newsletter-coupon";
import { newsletterPhoto } from "./newsletter-photo";

/** First is the default for new stores (the Classic template's sign-up panel). */
export const NEWSLETTER_DESIGNS: readonly Design[] = [newsletterClassic, newsletterCentered, newsletterPhoto, newsletterCoupon];
