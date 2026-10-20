import type { Design } from "../builder";
import { finderBudget } from "./finder-budget";
import { finderFeatures } from "./finder-features";
import { finderGuides } from "./finder-guides";
import { finderMatrix } from "./finder-matrix";
import { finderPick } from "./finder-pick";
import { finderPriceBands } from "./finder-price-bands";
import { finderQuiz } from "./finder-quiz";
import { finderSentence } from "./finder-sentence";
import { finderThisOrThat } from "./finder-this-or-that";
import { finderUse } from "./finder-use";
import { finderVersus } from "./finder-versus";

/**
 * Product finder (Claude Design library E-a…E-k): guided ways into the
 * catalogue. The design's quiz, slider, switches and dropdowns need scripts,
 * so their still versions use links the seller points at categories or
 * collections; products and guides always come from the store's own data.
 * First is the default.
 */
export const FINDER_DESIGNS: readonly Design[] = [
  finderUse,
  finderBudget,
  finderQuiz,
  finderVersus,
  finderMatrix,
  finderPriceBands,
  finderSentence,
  finderPick,
  finderFeatures,
  finderThisOrThat,
  finderGuides,
];
