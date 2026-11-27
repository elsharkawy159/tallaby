"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionCard, SellerButton } from "@/components/seller-ui";
import { StoreCrossSellSwitch } from "../../../settings/checkout/cross-sell-switch.client";

/**
 * Store › Apps › Cross-selling (F-32, owner 2026-11-27). The store-wide switch
 * (moved here from Store settings › Checkout), how to add an offer, and a link
 * to the products. Offers stay set per product.
 */
export function CrossSellApp({ storeId, enabled, readOnly }: { storeId: string; enabled: boolean; readOnly: boolean }) {
  const t = useTranslations("crossSellApp");
  const steps = ["one", "two", "three"] as const;

  return (
    <div className="flex flex-col gap-5">
      <StoreCrossSellSwitch storeId={storeId} initial={enabled} readOnly={readOnly} />
      <SectionCard icon={Package} title={t("howTitle")} description={t("howDescription")}>
        <ol className="flex list-decimal flex-col gap-2 ps-5 text-[13.5px] leading-[1.7] text-(--s-body)">
          {steps.map((step) => (
            <li key={step}>{t(`steps.${step}`)}</li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <SellerButton asChild size="sm" variant="solid">
            <Link href={`/stores/${storeId}/products`}>
              <Package aria-hidden />
              {t("openProducts")}
            </Link>
          </SellerButton>
        </div>
      </SectionCard>
    </div>
  );
}
