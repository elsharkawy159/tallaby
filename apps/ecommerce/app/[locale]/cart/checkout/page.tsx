import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";
import { getCheckoutData } from "@/actions/checkout";
import { CheckoutData } from "./_components/checkout.data";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getAddresses } from "@/actions/customer";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/actions/auth";
import { MetaInitiateCheckout } from "@/components/meta/meta-initiate-checkout.client";
import { DEFAULT_CURRENCY } from "@/lib/constants";

export const metadata: Metadata = generateNoIndexMetadata();

// Session-scoped (cart + addresses + auth) — never prerenderable.
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const [result, addressesResult, user, t] = await Promise.all([
    getCheckoutData(),
    getAddresses(),
    getUser(),
    getTranslations("checkout"),
  ]);
  const addresses = addressesResult.success ? (addressesResult.data ?? []) : [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) ?? null;
  const isLoggedIn = !!user?.user?.id;

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
  const cartItems = (checkoutData.cart?.cartItems ?? []).filter(
    (item: { savedForLater?: boolean | null }) => !item.savedForLater
  );
  const productIds: string[] = cartItems.map(
    (item: { productId: string }) => item.productId
  );
  const numItems = cartItems.reduce(
    (sum: number, item: { quantity: number }) => sum + Number(item.quantity || 0),
    0
  );
  const checkoutValue = Number(
    checkoutData.summary?.totalAfterDiscount ??
      checkoutData.summary?.total ??
      checkoutData.summary?.subtotal ??
      0
  );
  const cartId: string = checkoutData.cart?.id ?? "";
  const currency = checkoutData.cart?.currency || DEFAULT_CURRENCY;

  if (cartId && productIds.length > 0) {
    try {
      const { sendMetaCapiEvent } = await import("@/lib/meta/meta.server");
      const { getMetaCapiUserData } = await import("@/lib/meta/meta.user");
      const { toMetaContentIds } = await import("@/lib/meta/meta.product");
      const { userData, eventSourceUrl } = await getMetaCapiUserData();

      await sendMetaCapiEvent({
        eventName: "InitiateCheckout",
        eventId: cartId,
        eventSourceUrl: eventSourceUrl ?? undefined,
        userData,
        customData: {
          content_ids: toMetaContentIds(productIds),
          content_type: "product",
          value: checkoutValue,
          currency,
          num_items: numItems,
        },
      });
    } catch (metaError) {
      console.error("Meta CAPI InitiateCheckout failed:", metaError);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="flex-1 container py-4 md:pt-2 pb-12 md:pb-16">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
            {t("checkout")}
          </h1>
          <p className="text-xs md:text-lg text-muted-foreground">
            {t("completeOrderDetails")}
          </p>
        </div>

        {cartId && productIds.length > 0 && (
          <MetaInitiateCheckout
            cartId={cartId}
            productIds={productIds}
            value={checkoutValue}
            numItems={numItems}
            currency={currency}
          />
        )}

        <CheckoutData
          checkoutData={checkoutData}
          addresses={addresses}
          defaultAddress={defaultAddress}
          isLoggedIn={isLoggedIn}
        />
      </main>
    </div>
  );
}
