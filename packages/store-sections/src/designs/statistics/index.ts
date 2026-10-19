import type { Design } from "../builder";
import { statsBigNumbers } from "./stats-big-numbers";
import { statsClassic } from "./stats-classic";
import { statsPhoto } from "./stats-photo";
import { statsProgress } from "./stats-progress";
import { statsStrip } from "./stats-strip";

/** First is the default for new stores (the Classic template's numbers row). */
export const STATISTICS_DESIGNS: readonly Design[] = [statsClassic, statsBigNumbers, statsPhoto, statsProgress, statsStrip];
