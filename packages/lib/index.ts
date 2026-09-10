export {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatPrice,
  formatPricePlain,
  parseCurrencyAmount,
} from "./src/utils/formatPrice";

export {
  getPriceFinal,
  getPriceList,
  parsePriceJson,
} from "./src/utils/parse-price-json";

export {
  PRICE_ROUNDING_STEP,
  roundNullablePriceUpToNearestFive,
  roundPriceUpToNearestFive,
} from "./src/utils/round-price";

export type {
  ParsedPriceJson,
  PriceDiscountType,
  PriceJsonObject,
} from "./src/utils/parse-price-json";

/** @deprecated Use ParsedPriceJson */
export type { ParsedPriceJson as ParsedPrice } from "./src/utils/parse-price-json";
/** @deprecated Use PriceJsonObject */
export type { PriceJsonObject as PriceJson } from "./src/utils/parse-price-json";

export {
  CAIRO_ORIGIN_RATES,
  EXTRA_KG_RATE,
  FALLBACK_BASE_RATE,
  FEE_MULTIPLIER,
  FREE_DELIVERY_MIN_SUBTOTAL,
  ROUND_TO,
  SHIPPING_ORIGIN,
  applyShippingFeesAndRound,
  calculateCartWeightGrams,
  calculateLocationShippingCost,
  calculateRawShippingAmount,
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  getBaseRateForGovernorate,
  getThresholdShippingDiscount,
  getWeightExtraCharge,
  groupShippingItemsBySeller,
  normalizeGovernorate,
  resolveCartSubtotal,
  sellerGroupHasFreeDeliveryOffer,
  sellerGroupQualifiesForFreeDelivery,
} from "./src/shipping";

export type {
  LocationShippingOptions,
  ShippingCartItem,
} from "./src/shipping";
