import type { Design } from "../builder";
import { trackAsk } from "./track-ask";
import { trackProblem } from "./track-problem";
import { trackRate } from "./track-rate";
import { trackReschedule } from "./track-reschedule";
import { trackReturns } from "./track-returns";
import { trackSteps } from "./track-steps";

/**
 * Order tracking (library D). The store has no order lookup or live status a
 * section can read, so these explain how orders move and send shoppers to
 * their orders page or to the seller on WhatsApp; returns and feedback use
 * the store's forms. The live-status layouts (D-c summary, D-d big status,
 * D-e event log, D-h courier map, D-i order history) are not built.
 * First is the default.
 */
export const TRACKING_DESIGNS: readonly Design[] = [
  trackAsk,
  trackSteps,
  trackReturns,
  trackReschedule,
  trackRate,
  trackProblem,
];
