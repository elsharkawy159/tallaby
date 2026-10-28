"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DealCountdown } from "./deal-countdown.client";
import { offerCoversProduct, offerDeadline, readShownAt, type StoreCouponOffer } from "@workspace/lib/orders/coupon-popup";
import { readStorage, shownAtKey, writeStorage } from "./store-offer.lib";

/**
 * The store's coupon pop-up offer (0114) and when this visitor saw it. The
 * storefront shell provides it; outside a store (the marketplace) there is
 * none and the countdown draws nothing.
 */
type StoreOfferState = {
  offer: StoreCouponOffer;
  /** When the pop-up appeared for this visitor; null until it has. */
  shownAt: number | null;
  /** Marks the pop-up as shown now (the countdown starts). */
  reveal: () => void;
};

const StoreOfferContext = createContext<StoreOfferState | null>(null);

export const useStoreOffer = () => useContext(StoreOfferContext);

export function StoreOfferProvider({ offer, children }: { offer: StoreCouponOffer | null; children: React.ReactNode }) {
  const [shownAt, setShownAt] = useState<number | null>(null);
  const couponId = offer?.couponId;

  // Read after mount: the server has no idea what this browser saw.
  useEffect(() => {
    if (!couponId) return;
    setShownAt(readShownAt(readStorage(() => window.localStorage, shownAtKey(couponId)), Date.now()));
  }, [couponId]);

  const reveal = useCallback(() => {
    if (!couponId) return;
    const now = Date.now();
    writeStorage(() => window.localStorage, shownAtKey(couponId), String(now));
    setShownAt(now);
  }, [couponId]);

  if (!offer) return <>{children}</>;
  return <StoreOfferContext.Provider value={{ offer, shownAt, reveal }}>{children}</StoreOfferContext.Provider>;
}

/**
 * "The offer ends in 00 days : 00 hours : 59 minutes : 50 seconds" (the deal
 * block), on the product page once the visitor has seen the pop-up, until
 * their time runs out. Only for products the coupon covers.
 */
export function OfferCountdown({ productId, className }: { productId: string; className?: string }) {
  const state = useStoreOffer();
  const deadline = state?.shownAt != null ? offerDeadline(state.offer, state.shownAt) : null;
  const covers = state ? offerCoversProduct(state.offer, productId) : false;
  if (deadline == null || !covers) return null;
  // The pop-up time comes from this browser, so it only exists after mount: no placeholder.
  return <DealCountdown deadline={deadline} className={className} />;
}
