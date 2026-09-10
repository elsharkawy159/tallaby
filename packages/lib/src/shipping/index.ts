export {
  CAIRO_ORIGIN_RATES,
  EXTRA_KG_RATE,
  FALLBACK_BASE_RATE,
  FEE_MULTIPLIER,
  FREE_DELIVERY_MIN_SUBTOTAL,
  ROUND_TO,
  SHIPPING_ORIGIN,
} from './shipping-rates'

export { normalizeGovernorate } from './governorate.lib'

export {
  EGYPT_POST_COLUMNS,
  EGYPT_POST_GOVERNORATES,
  PACKAGE_VOLUMES,
  normalizeEgyptianMobile,
  toEgyptPostRow,
  toEgyptPostRows,
} from './egypt-post.lib'

export type {
  EgyptPostBatchDefaults,
  EgyptPostColumn,
  EgyptPostOrderInput,
  EgyptPostOrderItemInput,
  EgyptPostRow,
  EgyptPostRowError,
  EgyptPostRowResult,
  PackageVolume,
} from './egypt-post.lib'

export {
  applyShippingFeesAndRound,
  calculateCartWeightGrams,
  calculateLocationShippingCost,
  calculateRawShippingAmount,
  calculateSellerFreeDeliveryDiscount,
  calculateShippingBySeller,
  cartFullyCoveredBySellerFreeDelivery,
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  getBaseRateForGovernorate,
  getThresholdShippingDiscount,
  getWeightExtraCharge,
  groupShippingItemsBySeller,
  resolveCartSubtotal,
  sellerGroupHasFreeDeliveryOffer,
  sellerGroupHasSellerFreeDelivery,
  sellerGroupQualifiesForFreeDelivery,
} from './shipping.lib'

export type { SellerShippingBreakdown } from './shipping.lib'

export type { LocationShippingOptions, ShippingCartItem } from './shipping.types'
