import type { Design } from "../builder";
import { textCallout } from "./text-callout";
import { textCentered } from "./text-centered";
import { textColumns } from "./text-columns";
import { textLead } from "./text-lead";
import { textNote } from "./text-note";
import { textPolicy } from "./text-policy";
import { textQuote } from "./text-quote";
import { textStatement } from "./text-statement";
import { textBrandStatement } from "./text-brand-statement";
import { textSteps } from "./text-steps";
import { textTerms } from "./text-terms";

/** First is the default for new stores (the Classic template's policy pages). */
export const RICH_TEXT_DESIGNS: readonly Design[] = [textPolicy, textCentered, textCallout, textColumns, textQuote, textSteps, textLead, textStatement, textTerms, textNote, textBrandStatement];
