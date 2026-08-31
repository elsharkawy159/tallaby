import type { OrderStage } from "./orders.dto";

/**
 * Stages that expose a bulk / per-row advance action. Delivered is terminal
 * for this flow, and "all" mixes statuses a single action can't advance.
 */
export const STAGE_ACTION_STAGES: OrderStage[] = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
];

export function hasStageAction(stage: OrderStage): boolean {
  return STAGE_ACTION_STAGES.includes(stage);
}
