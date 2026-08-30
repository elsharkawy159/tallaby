import { formatCurrency } from "@workspace/lib";
import { MAX_INPUT_VALUE, SCENARIOS } from "./pricing-calculator.constants";
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
 * The daily ad budget spread across the orders it is expected to produce.
 * Returns null when there are no estimated orders -- dividing by zero is the
 * one thing this page must never do.
 */
export function calculateMarketingCostPerOrder(
  dailyAdBudget: number,
  ordersPerDay: number
): number | null {
  if (ordersPerDay <= 0) return null;
  return round2(dailyAdBudget / ordersPerDay);
}

/** Supplier + packaging + shipping. Marketing is added per scenario. */
export function calculateBaseCost(
  supplierPrice: number,
  packagingCost: number,
  shippingCost: number
): number {
  return round2(supplierPrice + packagingCost + shippingCost);
}

export function calculateTotalCost(
  baseCost: number,
  marketingCostPerOrder: number | null
): number | null {
  if (marketingCostPerOrder === null) return null;
  return round2(baseCost + marketingCostPerOrder);
}

export function calculateProfit(sellingPrice: number, totalCost: number): number {
  return round2(sellingPrice - totalCost);
}

/**
 * Profit margin, over the SELLING PRICE -- not markup over cost.
 * Returns null when there is no selling price to measure against.
 */
/** Profit across a batch of units, for the volume projection. */
export function calculateProfitForQuantity(
  profitPerItem: number | null,
  quantity: number
): number | null {
  if (profitPerItem === null) return null;
  return round2(profitPerItem * quantity);
}

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
  totalCost: number,
  desiredMarginPercent: number
): number | null {
  if (totalCost <= 0) return null;
  if (desiredMarginPercent < 0 || desiredMarginPercent >= 100) return null;
  return round2(totalCost / (1 - desiredMarginPercent / 100));
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
  baseCost: number,
  dailyAdBudget: number,
  sellingPrice: number,
  desiredMargin: number
): ScenarioResult {
  const marketingCostPerOrder = calculateMarketingCostPerOrder(
    dailyAdBudget,
    ordersPerDay
  );
  const totalCost = calculateTotalCost(baseCost, marketingCostPerOrder);

  if (totalCost === null) {
    return {
      key,
      label,
      ordersPerDay,
      marketingCostPerOrder: null,
      totalCost: null,
      profitPerItem: null,
      profitMargin: null,
      breakEvenPrice: null,
      recommendedPriceExact: null,
      recommendedPrice: null,
      profitAtRecommendedPrice: null,
      marginAtRecommendedPrice: null,
      status: null,
    };
  }

  const hasSellingPrice = sellingPrice > 0;
  const profitPerItem = hasSellingPrice
    ? calculateProfit(sellingPrice, totalCost)
    : null;
  const profitMargin =
    profitPerItem === null
      ? null
      : calculateProfitMargin(profitPerItem, sellingPrice);

  const recommendedPriceExact = calculateRecommendedPrice(totalCost, desiredMargin);
  const recommendedPrice =
    recommendedPriceExact === null
      ? null
      : roundToCharmPrice(recommendedPriceExact);
  const profitAtRecommendedPrice =
    recommendedPrice === null ? null : calculateProfit(recommendedPrice, totalCost);
  const marginAtRecommendedPrice =
    recommendedPrice === null || profitAtRecommendedPrice === null
      ? null
      : calculateProfitMargin(profitAtRecommendedPrice, recommendedPrice);

  return {
    key,
    label,
    ordersPerDay,
    marketingCostPerOrder,
    totalCost,
    profitPerItem,
    profitMargin,
    // Break-even is exactly the total cost: at that price profit is 0.
    breakEvenPrice: totalCost,
    recommendedPriceExact,
    recommendedPrice,
    profitAtRecommendedPrice,
    marginAtRecommendedPrice,
    status: getPriceStatus(sellingPrice, profitPerItem, profitMargin, desiredMargin),
  };
}

export function calculatePricing(
  input: PricingCalculatorRawInput
): PricingCalculatorResult {
  const supplierPrice = toSafeNumber(input.supplierPrice);
  const packagingCost = toSafeNumber(input.packagingCost);
  const shippingCost = toSafeNumber(input.shippingCost);
  const dailyAdBudget = toSafeNumber(input.dailyAdBudget);
  const sellingPrice = toSafeNumber(input.sellingPrice);
  const desiredMargin = toSafeNumber(input.desiredMargin);

  const baseCost = calculateBaseCost(supplierPrice, packagingCost, shippingCost);

  const ordersByScenario: Record<ScenarioKey, number> = {
    conservative: toSafeNumber(input.conservativeOrders),
    expected: toSafeNumber(input.expectedOrders),
    optimistic: toSafeNumber(input.optimisticOrders),
  };

  const scenarioList = SCENARIOS.map((scenario) =>
    buildScenario(
      scenario.key,
      scenario.label,
      ordersByScenario[scenario.key],
      baseCost,
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
    baseCost,
    dailyAdBudget,
    sellingPrice,
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
