import type { Design } from "../builder";
import { featuresChecklist } from "./features-checklist";
import { featuresClassic } from "./features-classic";
import { featuresIconCards } from "./features-icon-cards";
import { featuresSteps } from "./features-steps";

/** First is the default for new stores (the Classic template's features). */
export const FEATURE_DESIGNS: readonly Design[] = [featuresClassic, featuresIconCards, featuresChecklist, featuresSteps];
