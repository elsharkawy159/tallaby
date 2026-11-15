"use client";

import { useTranslations } from "next-intl";
import { BellRing, ClipboardCheck, CreditCard, FileCheck, ShieldCheck, Smartphone, Store } from "lucide-react";
import { PageTabs } from "@/components/seller-ui";

/**
 * General (with the store catalog) · Payment methods · Checkout · Order protection · App · Sales pop-up.
 * Policies and verification belong to the seller account, so the last tab goes to /settings.
 */
export function StoreSettingsTabs({ storeId }: { storeId: string }) {
  const t = useTranslations("nav");
  const tSetup = useTranslations("storeSetup");
  const base = `/stores/${storeId}/settings`;

  return (
    <PageTabs
      label={t("storeSettings")}
      tabs={[
        { key: "general", href: base, label: t("general"), icon: Store },
        { key: "payments", href: `${base}/payments`, label: t("paymentMethods"), icon: CreditCard },
        { key: "checkout", href: `${base}/checkout`, label: t("checkoutForm"), icon: ClipboardCheck },
        { key: "protection", href: `${base}/protection`, label: t("orderProtection"), icon: ShieldCheck },
        { key: "app", href: `${base}/app`, label: t("storeApp"), icon: Smartphone },
        { key: "popup", href: `${base}/sales-popup`, label: t("salesPopup"), icon: BellRing },
        { key: "policies", href: "/settings#policies", label: tSetup("policiesTab"), icon: FileCheck },
      ]}
    />
  );
}
