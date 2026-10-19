import type { Design } from "../builder";
import { textCallout } from "./text-callout";
import { textCentered } from "./text-centered";
import { textColumns } from "./text-columns";
import { textPolicy } from "./text-policy";
import { textQuote } from "./text-quote";

/** First is the default for new stores (the Classic template's policy pages). */
export const RICH_TEXT_DESIGNS: readonly Design[] = [textPolicy, textCentered, textCallout, textColumns, textQuote];
