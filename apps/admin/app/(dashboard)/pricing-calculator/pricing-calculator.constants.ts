import type {
  ScenarioKey,
  ScenarioOrdersField,
} from "./pricing-calculator.types";

/**
 * Editable starting points, not measured business performance. They exist so
 * the page is usable on first load; every one of them is a form field the user
 * can change, and changing a default here changes it in exactly one place.
 */
export const DEFAULT_PACKAGING_COST = 10;
export const DEFAULT_CONSERVATIVE_ORDERS = 10;
export const DEFAULT_EXPECTED_ORDERS = 15;
export const DEFAULT_OPTIMISTIC_ORDERS = 20;
export const DEFAULT_DESIRED_MARGIN = 30;

/** Upper bound for every numeric input, to keep results finite and legible. */
export const MAX_INPUT_VALUE = 1_000_000_000;

/** Unit counts shown in the Profit Projection section. */
export const PROFIT_PROJECTION_QUANTITIES = [1, 12, 100] as const;

export const STORAGE_KEY = "admin:pricing-calculator:v1";

export const DEFAULT_SCENARIO: ScenarioKey = "expected";

interface ScenarioDefinition {
  key: ScenarioKey;
  label: string;
  description: string;
  ordersField: ScenarioOrdersField;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    key: "conservative",
    label: "Conservative",
    description: "Fewer orders per day, so each order carries more ad spend.",
    ordersField: "conservativeOrders",
  },
  {
    key: "expected",
    label: "Expected",
    description: "Your realistic middle estimate.",
    ordersField: "expectedOrders",
  },
  {
    key: "optimistic",
    label: "Optimistic",
    description: "More orders per day, so ad spend is spread thinner.",
    ordersField: "optimisticOrders",
  },
];

export const MARKETING_DISCLAIMER =
  "Marketing cost is estimated from your daily ad budget and expected daily orders. Actual cost may vary.";

export const FREE_DELIVERY_NOTE =
  "Included in product cost because delivery is free for the customer.";

export const BREAK_EVEN_NOTE = "At this price, estimated profit is 0 EGP.";

export const NO_ORDERS_HINT = "Enter estimated orders";
