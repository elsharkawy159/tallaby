import type { Design } from "../builder";
import { featuresBento } from "./features-bento";
import { featuresChecklist } from "./features-checklist";
import { featuresClassic } from "./features-classic";
import { featuresCompare } from "./features-compare";
import { featuresIconCards } from "./features-icon-cards";
import { featuresOrbit } from "./features-orbit";
import { featuresRuled } from "./features-ruled";
import { featuresSideTitle } from "./features-side-title";
import { featuresSteps } from "./features-steps";
import { featuresTicker } from "./features-ticker";
import { featuresTrustBand } from "./features-trust-band";

/** First is the default for new stores (the Classic template's features). */
export const FEATURE_DESIGNS: readonly Design[] = [featuresClassic, featuresIconCards, featuresChecklist, featuresSteps, featuresRuled, featuresBento, featuresSideTitle, featuresTicker, featuresCompare, featuresOrbit, featuresTrustBand];
