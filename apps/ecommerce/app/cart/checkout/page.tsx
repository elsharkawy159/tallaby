import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { getCheckoutData } from "@/actions/checkout";
import { CheckoutData } from "./_components/checkout.data";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getAddresses } from "@/actions/customer";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Checkout() {
  const result = await getCheckoutData();
  const addressesResult = await getAddresses();
  const addresses = addressesResult.success ? (addressesResult.data ?? []) : [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) ?? null;
  const t = await getTranslations("checkout");

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-50 to-white">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-2">
            {t("checkoutUnavailable")}
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mb-6">
            {result.error || t("pleaseSignIn")}
          </p>
          <Button asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const checkoutData = result.data as any;

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="flex-1 container py-4 md:pt-2 pb-12 md:pb-16">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
            {t("checkout")}
          </h1>
          <p className="text-xs md:text-lg text-muted-foreground">
            {t("completeOrderDetails")}
          </p>
        </div>

        <CheckoutData
          checkoutData={checkoutData}
          addresses={addresses}
          defaultAddress={defaultAddress}
        />
      </main>
    </div>
  );
}
