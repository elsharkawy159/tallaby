"use client";

import { useId } from "react";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { PricingSection } from "../sections/pricing-section";
import { InventorySection } from "../sections/inventory-section";
import { ShippingSection } from "../sections/shipping-section";
import type { SupportedLocale } from "../add-product.schema";

interface PriceStockStepProps {
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
}

/** Price, inventory/variants and shipping — used by the edit wizard and bulk import. */
export function PriceStockStep({ sellerPricing, activeLocale }: PriceStockStepProps) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-4">
      <PricingSection id={`${uid}-price`} sellerPricing={sellerPricing} />
      <InventorySection
        id={`${uid}-stock`}
        sellerPricing={sellerPricing}
        activeLocale={activeLocale}
      />
      <ShippingSection id={`${uid}-shipping`} sellerPricing={sellerPricing} />
    </div>
  );
}
