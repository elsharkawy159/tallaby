export {
  CAIRO_ORIGIN_RATES,
  EXTRA_KG_RATE,
  FALLBACK_BASE_RATE,
  FEE_MULTIPLIER,
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
  cartQualifiesForProductFreeDelivery,
  getBaseRateForGovernorate,
  getWeightExtraCharge,
  groupShippingItemsBySeller,
  sellerGroupQualifiesForFreeDelivery,
} from './shipping.lib'

export type { LocationShippingOptions, ShippingCartItem } from './shipping.types'
