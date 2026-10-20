import type { Design } from "../builder";
import { statsBand } from "./stats-band";
import { statsBigNumbers } from "./stats-big-numbers";
import { statsClassic } from "./stats-classic";
import { statsMilestones } from "./stats-milestones";
import { statsPhoto } from "./stats-photo";
import { statsProgress } from "./stats-progress";
import { statsRating } from "./stats-rating";
import { statsRuled } from "./stats-ruled";
import { statsSentence } from "./stats-sentence";
import { statsStrip } from "./stats-strip";

/** First is the default for new stores (the Classic template's numbers row). */
export const STATISTICS_DESIGNS: readonly Design[] = [statsClassic, statsBigNumbers, statsPhoto, statsProgress, statsStrip, statsRuled, statsBand, statsSentence, statsRating, statsMilestones];
