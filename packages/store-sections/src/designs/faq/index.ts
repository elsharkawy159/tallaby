import type { Design } from "../builder";
import { faqCards } from "./faq-cards";
import { faqChat } from "./faq-chat";
import { faqClassic } from "./faq-classic";
import { faqColumns } from "./faq-columns";
import { faqHelp } from "./faq-help";
import { faqNumbered } from "./faq-numbered";
import { faqPanel } from "./faq-panel";
import { faqSide } from "./faq-side";
import { faqSimple } from "./faq-simple";
import { faqTopics } from "./faq-topics";

/** First is the default for new stores (the Classic template's FAQ page). */
export const FAQ_DESIGNS: readonly Design[] = [faqClassic, faqSimple, faqSide, faqCards, faqHelp, faqColumns, faqPanel, faqNumbered, faqChat, faqTopics];
