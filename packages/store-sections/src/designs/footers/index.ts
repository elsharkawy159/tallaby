import type { Design } from "../builder";
import { footerCentered } from "./footer-centered";
import { footerCenteredLight } from "./footer-centered-light";
import { footerClassic } from "./footer-classic";
import { footerColumnsSignup } from "./footer-columns-signup";
import { footerHelp } from "./footer-help";
import { footerLine } from "./footer-line";
import { footerLinks } from "./footer-links";
import { footerPanel } from "./footer-panel";
import { footerRuled } from "./footer-ruled";
import { footerSignoff } from "./footer-signoff";
import { footerSignup } from "./footer-signup";
import { footerWordmark } from "./footer-wordmark";

/** First is the default for new stores (the Classic template's footer). */
export const FOOTER_DESIGNS: readonly Design[] = [footerClassic, footerLine, footerWordmark, footerSignup, footerCentered, footerRuled, footerSignoff, footerPanel, footerHelp, footerLinks, footerColumnsSignup, footerCenteredLight];
