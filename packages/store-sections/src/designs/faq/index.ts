import type { Design } from "../builder";
import { faqCards } from "./faq-cards";
import { faqClassic } from "./faq-classic";
import { faqHelp } from "./faq-help";
import { faqSide } from "./faq-side";
import { faqSimple } from "./faq-simple";

/** First is the default for new stores (the Classic template's FAQ page). */
export const FAQ_DESIGNS: readonly Design[] = [faqClassic, faqSimple, faqSide, faqCards, faqHelp];
