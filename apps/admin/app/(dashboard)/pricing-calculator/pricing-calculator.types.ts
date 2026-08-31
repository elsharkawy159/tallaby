export type ScenarioKey = "conservative" | "expected" | "optimistic";

export type PriceStatus = "profitable" | "low-margin" | "loss";

/**
 * The values the calculation engine consumes. Orders per day is a single
 * estimate; the conservative and optimistic cases are derived from it using
 * `predictionRange`, so there is only one number to guess at.
 */
export interface PricingCalculatorInput {
  supplierPrice: number;
  packagingCost: number;
  shippingCost: number;
  dailyAdBudget: number;
  expectedOrders: number;
  /** How far the conservative and optimistic cases sit either side, in %. */
  predictionRange: number;
  /** The market price of the product itself, excluding delivery. */
  sellingPrice: number;
  desiredMargin: number;
}

/**
 * What the engine actually receives from the live form: values may be empty,
 * undefined, or unparseable while the user is still typing.
 */
export type PricingCalculatorRawInput = {
  [K in keyof PricingCalculatorInput]?: unknown;
};

/**
 * A `null` figure means "not calculable yet" (no estimated orders, no selling
 * price, an impossible desired margin). It is never NaN or Infinity.
 *
 * Shipping is deliberately absent from `costPerItem`: it is collected from the
 * customer on top of the product price, so it cancels out of profit entirely.
 * `cashOutPerOrder` is the figure that includes it, for cash-flow purposes.
 */
export interface ScenarioResult {
  key: ScenarioKey;
  label: string;
  ordersPerDay: number;
  marketingCostPerOrder: number | null;
  /** supplier + packaging + marketing. The basis for profit and margin. */
  costPerItem: number | null;
  /** costPerItem + shipping. What actually leaves your pocket per order. */
  cashOutPerOrder: number | null;
  profitPerItem: number | null;
  profitMargin: number | null;
  /** Product price at which profit is zero. */
  breakEvenPrice: number | null;
  /** That break-even price with shipping added, as the customer sees it. */
  breakEvenListedPrice: number | null;
  recommendedPriceExact: number | null;
  /** Charm-rounded recommended price for the product itself. */
  recommendedPrice: number | null;
  /** Recommended price with shipping added, as the customer sees it. */
  recommendedListedPrice: number | null;
  profitAtRecommendedPrice: number | null;
  marginAtRecommendedPrice: number | null;
  status: PriceStatus | null;
}

export interface PricingCalculatorResult {
  supplierPrice: number;
  packagingCost: number;
  shippingCost: number;
  /** supplier + packaging, before marketing. */
  productCost: number;
  dailyAdBudget: number;
  expectedOrders: number;
  predictionRange: number;
  /** The market price you entered, for the product alone. */
  sellingPrice: number;
  /** sellingPrice + shipping: the price the customer actually pays. */
  listedPrice: number;
  desiredMargin: number;
  scenarios: Record<ScenarioKey, ScenarioResult>;
  scenarioList: ScenarioResult[];
}
