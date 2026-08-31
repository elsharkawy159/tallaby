import type { ScenarioKey } from "./pricing-calculator.types";

/**
 * Editable starting points, not measured business performance. They exist so
 * the page is usable on first load; every one of them is a form field the user
 * can change, and changing a default here changes it in exactly one place.
 */
export const DEFAULT_PACKAGING_COST = 10;
export const DEFAULT_EXPECTED_ORDERS = 15;
export const DEFAULT_PREDICTION_RANGE = 30;
export const DEFAULT_DESIRED_MARGIN = 30;

/** Upper bound for every numeric input, to keep results finite and legible. */
export const MAX_INPUT_VALUE = 1_000_000_000;

/** The widest the conservative/optimistic spread may be, in percent. */
export const MAX_PREDICTION_RANGE = 90;

/** Fixed unit counts in the Profit Projection section. */
export const FIXED_PROJECTION_QUANTITIES = [1, 12] as const;

/** The third projection tile is editable; this is where it starts. */
export const DEFAULT_PROJECTION_QUANTITY = 100;
export const MAX_PROJECTION_QUANTITY = 10_000_000;

export const STORAGE_KEY = "admin:pricing-calculator:v2";

export const DEFAULT_SCENARIO: ScenarioKey = "expected";

interface ScenarioDefinition {
  key: ScenarioKey;
  label: string;
  description: string;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    key: "conservative",
    label: "Conservative",
    description: "Ads underperform. Fewer orders, so each carries more ad spend.",
    },
  {
    key: "expected",
    label: "Expected",
    description: "Your best guess at how the ads will actually do.",
  },
  {
    key: "optimistic",
    label: "Optimistic",
    description: "Ads do well. More orders, so ad spend is spread thinner.",
  },
];

/**
 * How sure the user is about their orders-per-day guess. Phrased in plain
 * language because the number itself (a +/- percentage) is the abstraction
 * people struggle with.
 */
export interface PredictionRangeOption {
  value: number;
  label: string;
  hint: string;
}

export const PREDICTION_RANGE_OPTIONS: readonly PredictionRangeOption[] = [
  { value: 20, label: "Fairly sure", hint: "±20%" },
  { value: 30, label: "Not sure", hint: "±30%" },
  { value: 50, label: "Just guessing", hint: "±50%" },
];

/**
 * The suggested target margin is the one the market price already supports,
 * rounded DOWN to a round number so the recommended price lands at or under
 * the market price rather than above it.
 */
export const MARGIN_SUGGESTION_STEP = 5;
/** Below this, the market price barely covers cost and a target is meaningless. */
export const MIN_SUGGESTED_MARGIN = 5;
export const MAX_SUGGESTED_MARGIN = 95;

export const MARKETING_DISCLAIMER =
  "Marketing cost is estimated from your daily ad budget and expected daily orders. Actual cost may vary.";

export const SHIPPING_NOTE =
  "Added on top of your price and collected from the customer, so it does not change your profit.";

export const BREAK_EVEN_NOTE = "At this price, estimated profit is 0 EGP.";

export const NO_ORDERS_HINT = "Enter expected orders per day";
