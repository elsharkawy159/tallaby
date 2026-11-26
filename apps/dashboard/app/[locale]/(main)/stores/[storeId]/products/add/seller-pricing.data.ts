import { getSellerProfile } from "@/lib/sellers/seller-profile.server";
import { getBillingState } from "@workspace/lib/billing/server";
import { DEFAULT_COMMISSION_RATE, type SellerPricingSettings } from "@/lib/utils/product-pricing.lib";

/**
 * The session seller's pricing settings the product form computes prices with
 * (the add page and the welcome page's AI uploader). Display and form maths
 * only: the server recomputes every amount it stores.
 */
export async function loadSellerPricing(): Promise<SellerPricingSettings> {
  const [sellerProfile, billing] = await Promise.all([getSellerProfile(), getBillingState()]);
  const profile = sellerProfile.success ? sellerProfile.data : null;
  return {
    commissionRate: profile?.commissionRate ?? DEFAULT_COMMISSION_RATE,
    isCommissionExempt: profile?.isCommissionExempt ?? false,
    sellerFreeDelivery: profile?.freeDelivery ?? false,
    feeTrialStartedAt: profile?.feeTrialStartedAt ?? null,
    feeTrialEndsAt: profile?.feeTrialEndsAt ?? null,
    feeBilling: { usdLive: billing.usdLive, marketRate: billing.marketRate },
    plan: profile?.plan ?? null,
    planExpiresAt: profile?.planExpiresAt ?? null,
    planGraceUntil: profile?.planGraceUntil ?? null,
  };
}
