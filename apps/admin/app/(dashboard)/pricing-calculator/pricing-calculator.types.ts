export type ScenarioKey = "conservative" | "expected" | "optimistic";

export type PriceStatus = "profitable" | "low-margin" | "loss";

export type ScenarioOrdersField =
  | "conservativeOrders"
  | "expectedOrders"
  | "optimisticOrders";

/**
 * The nine numeric values the calculation engine consumes.
 */
export interface PricingCalculatorInput {
  supplierPrice: number;
  packagingCost: number;
  shippingCost: number;
  dailyAdBudget: number;
  conservativeOrders: number;
  expectedOrders: number;
  optimisticOrders: number;
  sellingPrice: number;
  desiredMargin: number;
}

/**
 * What the engine actually receives from the live form: values may be empty
 * strings, undefined, or unparseable while the user is still typing.
 */
export type PricingCalculatorRawInput = {
  [K in keyof PricingCalculatorInput]?: unknown;
};

/**
 * A `null` figure means "not calculable yet" (missing or zero orders, no
 * selling price, an impossible desired margin). It is never NaN or Infinity.
 */
export interface ScenarioResult {
  key: ScenarioKey;
  label: string;
  ordersPerDay: number;
  marketingCostPerOrder: number | null;
  totalCost: number | null;
  profitPerItem: number | null;
  profitMargin: number | null;
  breakEvenPrice: number | null;
  recommendedPriceExact: number | null;
  recommendedPrice: number | null;
  profitAtRecommendedPrice: number | null;
  marginAtRecommendedPrice: number | null;
  status: PriceStatus | null;
}

export interface PricingCalculatorResult {
  supplierPrice: number;
  packagingCost: number;
  shippingCost: number;
  /** supplier + packaging + shipping, marketing excluded */
  baseCost: number;
  dailyAdBudget: number;
  sellingPrice: number;
  desiredMargin: number;
  scenarios: Record<ScenarioKey, ScenarioResult>;
  scenarioList: ScenarioResult[];
}
