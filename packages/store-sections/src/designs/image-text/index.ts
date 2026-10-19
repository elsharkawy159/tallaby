import type { Design } from "../builder";
import { aboutClassic } from "./about-classic";
import { aboutOverlap } from "./about-overlap";
import { aboutPanel } from "./about-panel";
import { aboutRows } from "./about-rows";
import { aboutValues } from "./about-values";

/** First is the default for new stores (the Classic template's About story). */
export const IMAGE_TEXT_DESIGNS: readonly Design[] = [aboutClassic, aboutPanel, aboutOverlap, aboutRows, aboutValues];
