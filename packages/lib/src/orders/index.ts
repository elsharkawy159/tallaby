export {
  placeOrderFromCart,
  InsufficientStockError,
  type OrderPricingOverrides,
  type OrderSource,
  type PaymentOverrides,
  type PlaceOrderFromCartInput,
  type PlaceOrderFromCartResult,
  type PlaceOrderInventoryItem,
} from './place-order'

export { sendOrderConfirmationEmail } from './notify'

export {
  buildOrderPagePath,
  buildOrderPageUrl,
  signOrderAccess,
  verifyOrderAccess,
} from './order-access'

export {
  PLATFORM_COMMISSION_RATE,
  formatDecimal,
  formatVariantTitleFromCart,
  generateOrderNumber,
  pickProductTitle,
} from './place-order.lib'

export {
  buildOrderDiscountLines,
  parseOrderDiscountLines,
  type BuildOrderDiscountCouponInput,
  type BuildOrderDiscountLinesInput,
  type BuildOrderDiscountLinesResult,
  type OrderCouponDiscountType,
  type OrderDiscountLine,
  type OrderDiscountType,
} from './order-discounts'

export {
  COD_MAX_SHIPPING_COST,
  MANUAL_PAYMENT_METHOD_VALUES,
  computeManualRemainderAmount,
  computeWalletApplyAmount,
  getPaymentGroupForMethod,
  getWalletPaidAmountFromMetadata,
  isCodEligibleForShipping,
  isManualPaymentMethodValue,
  isWalletEligibleForTotal,
  isWalletPartialPaymentMethod,
  isWalletPaymentMethod,
  parseWalletPartialPaymentMethod,
  toWalletPartialPaymentMethod,
  type ManualPaymentMethodValue,
} from './payment.lib'

export {
  COUPON_CHANNELS,
  SELLER_COUPON_DISCOUNT_TYPES,
  allocateDiscountAcrossLines,
  getCouponChannels,
  getCouponProductIds,
  isCouponAllowedOnChannel,
  isLineEligibleForCoupon,
  type CouponChannel,
  type CouponScopeInput,
  type CouponScopeLine,
  type SellerCouponDiscountType,
} from './coupon-scope.lib'

export {
  FEE_PLANS,
  FEE_TRIAL_DAYS,
  STANDARD_FEE_MIN_PIASTRES,
  STANDARD_FEE_PLAN,
  STANDARD_FEE_RATE_BPS,
  allocateFeeAcrossLines,
  computePlatformFeePiastres,
  computeOrderLineFees,
  computeSellerPlatformFee,
  eligibleSubtotalForSeller,
  isTrialActive,
  resolveFeePlan,
  toPiastres,
  type FeePlanId,
  type OrderLineFee,
  type PlatformFeeSnapshot,
  type SellerFeeProfile,
  type SellerPlatformFee,
} from './platform-fee.lib'
