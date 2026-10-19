import type { Design } from "../builder";
import { footerCentered } from "./footer-centered";
import { footerClassic } from "./footer-classic";
import { footerLine } from "./footer-line";
import { footerSignup } from "./footer-signup";
import { footerWordmark } from "./footer-wordmark";

/** First is the default for new stores (the Classic template's footer). */
export const FOOTER_DESIGNS: readonly Design[] = [footerClassic, footerLine, footerWordmark, footerSignup, footerCentered];
