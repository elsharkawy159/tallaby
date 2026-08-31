import * as z from "zod";
import {
  DEFAULT_DESIRED_MARGIN,
  DEFAULT_EXPECTED_ORDERS,
  DEFAULT_PACKAGING_COST,
  DEFAULT_PREDICTION_RANGE,
  DEFAULT_PROJECTION_QUANTITY,
  MAX_INPUT_VALUE,
  MAX_PREDICTION_RANGE,
  MAX_PROJECTION_QUANTITY,
} from "./pricing-calculator.constants";

const MAX_LABEL = MAX_INPUT_VALUE.toLocaleString("en-US");

/**
 * An amount that may legitimately be left blank. Blank is not an error -- it
 * simply contributes 0 -- but a negative or absurd value is, and gets a
 * plain-language message under the field.
 *
 * `NumberField` reports an emptied input as `undefined`, which is what keeps
 * `.optional()` sufficient here.
 */
const optionalAmount = (label: string) =>
  z
    .number()
    .min(0, `${label} must be 0 or more`)
    .max(MAX_INPUT_VALUE, `${label} must be ${MAX_LABEL} or less`)
    .optional();

export const pricingCalculatorSchema = z.object({
  productName: z
    .string()
    .max(120, "Product name must be less than 120 characters")
    .optional(),
  supplierPrice: optionalAmount("Supplier price"),
  packagingCost: optionalAmount("Packaging cost"),
  shippingCost: optionalAmount("Shipping cost"),
  dailyAdBudget: optionalAmount("Daily ad budget"),
  expectedOrders: optionalAmount("Expected orders"),
  predictionRange: z
    .number()
    .min(0, "Range must be 0% or more")
    .max(MAX_PREDICTION_RANGE, `Range must be ${MAX_PREDICTION_RANGE}% or less`)
    .optional(),
  sellingPrice: optionalAmount("Market price"),
  // A 100% margin would mean dividing by zero in the recommended-price
  // formula, so it is rejected here as well as guarded in the engine.
  desiredMargin: z
    .number()
    .min(0, "Desired margin must be between 0% and 99.99%")
    .lt(100, "Desired margin must be between 0% and 99.99%")
    .optional(),
  // Display-only: how many units the third projection tile covers.
  projectionQuantity: z
    .number()
    .int("Use a whole number of items")
    .min(1, "Enter at least 1 item")
    .max(
      MAX_PROJECTION_QUANTITY,
      `Up to ${MAX_PROJECTION_QUANTITY.toLocaleString("en-US")} items`
    )
    .optional(),
});

export type PricingCalculatorFormValues = z.infer<typeof pricingCalculatorSchema>;

export const DEFAULT_FORM_VALUES: PricingCalculatorFormValues = {
  productName: "",
  supplierPrice: undefined,
  packagingCost: DEFAULT_PACKAGING_COST,
  shippingCost: undefined,
  dailyAdBudget: undefined,
  expectedOrders: DEFAULT_EXPECTED_ORDERS,
  predictionRange: DEFAULT_PREDICTION_RANGE,
  sellingPrice: undefined,
  desiredMargin: DEFAULT_DESIRED_MARGIN,
  projectionQuantity: DEFAULT_PROJECTION_QUANTITY,
};
