import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  createPaymobCheckoutUrl,
  getPaymobPaymentOrder,
} from "@/actions/paymob";
import { buildOrderPagePath } from "@/lib/order-access-token";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { PaymentOrderSummary } from "./_components/payment-order-summary";
import { PaymobIframe } from "./_components/paymob-iframe";
import { ManualPaymentInstructions } from "./_components/manual-payment-instructions";
import { isManualPaymentMethod } from "@/lib/manual-payment-methods";

export const metadata: Metadata = generateNoIndexMetadata();
export const dynamic = "force-dynamic";

interface PaymentPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutPaymentPage({
  searchParams,
}: PaymentPageProps) {
  const { orderId } = await searchParams;
  const t = await getTranslations("checkout");
  const locale = await getLocale();

  if (!orderId) {
    redirect({ href: "/cart/checkout", locale });
  }

  const result = await getPaymobPaymentOrder(orderId as string);

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
            <Link href="/cart/checkout">{t("backToCart")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const order = result.data;

  if (order.paymentStatus === "paid" || order.status === "confirmed") {
    redirect({ href: buildOrderPagePath(order.id), locale });
  }

  if (isManualPaymentMethod(order.paymentMethod)) {
    return (
      <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
        <DynamicBreadcrumb />
        <main className="flex-1 py-4 md:py-6 pb-12 md:pb-16 max-w-4xl px-4 mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">
              {t("paymentInstructions")}
            </h1>
          </div>
          <div className="space-y-4 md:space-y-6">
            <PaymentOrderSummary order={order} />
            <ManualPaymentInstructions
              orderId={order.id}
              method={order.paymentMethod}
              amount={order.totalAmount}
              currency={order.currency || "EGP"}
            />
          </div>
        </main>
      </div>
    );
  }

  if (order.paymentMethod !== "online_payment") {
    redirect({ href: buildOrderPagePath(order.id), locale });
  }

  const checkout = await createPaymobCheckoutUrl(order.id);

  if (!checkout.success || !checkout.data?.checkoutUrl) {
    return (
      <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
        <DynamicBreadcrumb />
        <main className="flex-1 container flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              {t("paymentFailed")}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {checkout.error || t("paymentFailed")}
            </p>
            <Button asChild>
              <Link href="/cart/checkout">{t("backToCart")}</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="container flex-1 py-4 md:py-6 pb-12 md:pb-16">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">
            {t("paymentProcessing")}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {t("paymentProcessingNote")}
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <PaymentOrderSummary order={order} />
          <PaymobIframe
            checkoutUrl={checkout.data.checkoutUrl}
            title={t("payWithCard")}
          />
        </div>
      </main>
    </div>
  );
}
