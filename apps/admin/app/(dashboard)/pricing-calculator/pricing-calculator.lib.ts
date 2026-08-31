import { formatCurrency } from "@workspace/lib";
import {
  MARGIN_SUGGESTION_STEP,
  MAX_INPUT_VALUE,
  MAX_PREDICTION_RANGE,
  MAX_SUGGESTED_MARGIN,
  MIN_SUGGESTED_MARGIN,
  SCENARIOS,
} from "./pricing-calculator.constants";
import type {
  PriceStatus,
  PricingCalculatorRawInput,
  PricingCalculatorResult,
  ScenarioKey,
  ScenarioResult,
} from "./pricing-calculator.types";

/**
 * Coerce anything the live form can hold -- a number, a partially typed
 * string, an empty field, undefined -- into a finite, non-negative number.
 * This is the single guard that keeps NaN and Infinity out of every formula
 * downstream.
 */
export function toSafeNumber(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, MAX_INPUT_VALUE);
}

/** Round to 2 decimals so the breakdown rows visibly add up to the total. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Turn one orders-per-day guess into the three cases, so the user only has to
 * estimate a single number. A wider range means less confidence.
 */
export function deriveOrdersPerDay(
  expectedOrders: number,
  predictionRangePercent: number
): Record<ScenarioKey, number> {
  const spread =
    Math.min(Math.max(predictionRangePercent, 0), MAX_PREDICTION_RANGE) / 100;

  // Whole orders only: "7.4 orders a day" is not a thing anyone plans around.
  const toOrders = (value: number): number => {
    if (expectedOrders <= 0) return 0;
    return Math.max(1, Math.round(value));
  };

  return {
    conservative: toOrders(expectedOrders * (1 - spread)),
    expected: toOrders(expectedOrders),
    optimistic: toOrders(expectedOrders * (1 + spread)),
  };
}

/**
 * The daily ad budget spread across the orders it is expected to produce --
 * the same idea as "cost per purchase" in a social ads dashboard.
 * Returns null when there are no estimated orders, because dividing by zero is
 * the one thing this page must never do.
 */
export function calculateMarketingCostPerOrder(
  dailyAdBudget: number,
  ordersPerDay: number
): number | null {
  if (ordersPerDay <= 0) return null;
  return round2(dailyAdBudget / ordersPerDay);
}

/** Supplier + packaging. Marketing is added per scenario; shipping never is. */
export function calculateProductCost(
  supplierPrice: number,
  packagingCost: number
): number {
  return round2(supplierPrice + packagingCost);
}

/**
 * The cost that profit is measured against. Shipping is excluded on purpose:
 * it is added on top of the price and collected from the customer, so it
 * cancels out of profit rather than eating into it.
 */
export function calculateCostPerItem(
  productCost: number,
  marketingCostPerOrder: number | null
): number | null {
  if (marketingCostPerOrder === null) return null;
  return round2(productCost + marketingCostPerOrder);
}

/** A product price as the customer sees it, with delivery added on top. */
export function calculateListedPrice(
  productPrice: number,
  shippingCost: number
): number {
  return round2(productPrice + shippingCost);
}

export function calculateProfit(
  sellingPrice: number,
  costPerItem: number
): number {
  return round2(sellingPrice - costPerItem);
}

/** Profit across a batch of units, for the volume projection. */
export function calculateProfitForQuantity(
  profitPerItem: number | null,
  quantity: number
): number | null {
  if (profitPerItem === null) return null;
  return round2(profitPerItem * quantity);
}

/**
 * Profit margin, over the SELLING PRICE -- not markup over cost.
 * Returns null when there is no selling price to measure against.
 */
export function calculateProfitMargin(
  profit: number,
  sellingPrice: number
): number | null {
  if (sellingPrice <= 0) return null;
  return round2((profit / sellingPrice) * 100);
}

/**
 * The inverse of the margin formula: cost / (1 - margin). Not cost * (1 +
 * margin), which would be markup and would undershoot the target.
 */
export function calculateRecommendedPrice(
  costPerItem: number,
  desiredMarginPercent: number
): number | null {
  if (costPerItem <= 0) return null;
  if (desiredMarginPercent < 0 || desiredMarginPercent >= 100) return null;
  return round2(costPerItem / (1 - desiredMarginPercent / 100));
}

/**
 * A target margin taken from what the market price already earns you, rounded
 * down to a round step. Rounding down matters: it keeps the resulting
 * recommended price at or below the market price, so you stay competitive
 * instead of pricing yourself above the going rate.
 *
 * Returns null when the market price does not clear the cost by enough for a
 * target to mean anything.
 */
export function suggestDesiredMargin(profitMargin: number | null): number | null {
  if (profitMargin === null || !Number.isFinite(profitMargin)) return null;
  if (profitMargin < MIN_SUGGESTED_MARGIN) return null;
  const stepped =
    Math.floor(profitMargin / MARGIN_SUGGESTION_STEP) * MARGIN_SUGGESTION_STEP;
  return Math.min(stepped, MAX_SUGGESTED_MARGIN);
}

/**
 * Charm pricing: the smallest whole price at or above `price` that ends in 9.
 * Rounding up (never down) guarantees the desired margin is still met.
 * 357.14 -> 359, 250 -> 259, 412 -> 419, 359 -> 359.
 */
export function roundToCharmPrice(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  const ceiling = Math.ceil(price);
  return ceiling + ((9 - (ceiling % 10) + 10) % 10);
}

export function getPriceStatus(
  sellingPrice: number,
  profitPerItem: number | null,
  profitMargin: number | null,
  desiredMarginPercent: number
): PriceStatus | null {
  if (sellingPrice <= 0 || profitPerItem === null || profitMargin === null) {
    return null;
  }
  if (profitPerItem < 0) return "loss";
  if (profitMargin < desiredMarginPercent) return "low-margin";
  return "profitable";
}

function buildScenario(
  key: ScenarioKey,
  label: string,
  ordersPerDay: number,
  productCost: number,
  shippingCost: number,
  dailyAdBudget: number,
  sellingPrice: number,
  desiredMargin: number
): ScenarioResult {
  const marketingCostPerOrder = calculateMarketingCostPerOrder(
    dailyAdBudget,
    ordersPerDay
  );
  const costPerItem = calculateCostPerItem(productCost, marketingCostPerOrder);

  if (costPerItem === null) {
    return {
      key,
      label,
      ordersPerDay,
      marketingCostPerOrder: null,
      costPerItem: null,
      cashOutPerOrder: null,
      profitPerItem: null,
      profitMargin: null,
      breakEvenPrice: null,
      breakEvenListedPrice: null,
      recommendedPriceExact: null,
      recommendedPrice: null,
      recommendedListedPrice: null,
      profitAtRecommendedPrice: null,
      marginAtRecommendedPrice: null,
      status: null,
    };
  }

  const hasSellingPrice = sellingPrice > 0;
  const profitPerItem = hasSellingPrice
    ? calculateProfit(sellingPrice, costPerItem)
    : null;
  const profitMargin =
    profitPerItem === null
      ? null
      : calculateProfitMargin(profitPerItem, sellingPrice);

  const recommendedPriceExact = calculateRecommendedPrice(
    costPerItem,
    desiredMargin
  );
  const recommendedPrice =
    recommendedPriceExact === null
      ? null
      : roundToCharmPrice(recommendedPriceExact);
  const profitAtRecommendedPrice =
    recommendedPrice === null
      ? null
      : calculateProfit(recommendedPrice, costPerItem);
  const marginAtRecommendedPrice =
    recommendedPrice === null || profitAtRecommendedPrice === null
      ? null
      : calculateProfitMargin(profitAtRecommendedPrice, recommendedPrice);

  return {
    key,
    label,
    ordersPerDay,
    marketingCostPerOrder,
    costPerItem,
    cashOutPerOrder: calculateListedPrice(costPerItem, shippingCost),
    profitPerItem,
    profitMargin,
    // Break-even is exactly the cost per item: at that price profit is 0.
    breakEvenPrice: costPerItem,
    breakEvenListedPrice: calculateListedPrice(costPerItem, shippingCost),
    recommendedPriceExact,
    recommendedPrice,
    recommendedListedPrice:
      recommendedPrice === null
        ? null
        : calculateListedPrice(recommendedPrice, shippingCost),
    profitAtRecommendedPrice,
    marginAtRecommendedPrice,
    status: getPriceStatus(
      sellingPrice,
      profitPerItem,
      profitMargin,
      desiredMargin
    ),
  };
}

export function calculatePricing(
  input: PricingCalculatorRawInput
): PricingCalculatorResult {
  const supplierPrice = toSafeNumber(input.supplierPrice);
  const packagingCost = toSafeNumber(input.packagingCost);
  const shippingCost = toSafeNumber(input.shippingCost);
  const dailyAdBudget = toSafeNumber(input.dailyAdBudget);
  const expectedOrders = toSafeNumber(input.expectedOrders);
  const predictionRange = toSafeNumber(input.predictionRange);
  const sellingPrice = toSafeNumber(input.sellingPrice);
  const desiredMargin = toSafeNumber(input.desiredMargin);

  const productCost = calculateProductCost(supplierPrice, packagingCost);
  const ordersByScenario = deriveOrdersPerDay(expectedOrders, predictionRange);

  const scenarioList = SCENARIOS.map((scenario) =>
    buildScenario(
      scenario.key,
      scenario.label,
      ordersByScenario[scenario.key],
      productCost,
      shippingCost,
      dailyAdBudget,
      sellingPrice,
      desiredMargin
    )
  );

  const scenarios = scenarioList.reduce(
    (accumulator, scenario) => {
      accumulator[scenario.key] = scenario;
      return accumulator;
    },
    {} as Record<ScenarioKey, ScenarioResult>
  );

  return {
    supplierPrice,
    packagingCost,
    shippingCost,
    productCost,
    dailyAdBudget,
    expectedOrders,
    predictionRange,
    sellingPrice,
    listedPrice: calculateListedPrice(sellingPrice, shippingCost),
    desiredMargin,
    scenarios,
    scenarioList,
  };
}

/** Every EGP amount on this page is formatted here and nowhere else. */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "—";
  }
  return formatCurrency(amount, "en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(2)}%`;
}

export function formatUnits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
