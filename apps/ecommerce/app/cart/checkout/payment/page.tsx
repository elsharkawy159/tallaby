import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  createPaymobCheckoutUrl,
  getPaymobPaymentOrder,
} from "@/actions/paymob";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

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

  if (!orderId) {
    redirect("/cart/checkout");
  }

  const result = await getPaymobPaymentOrder(orderId);

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

  if (order.paymentMethod !== "online_payment") {
    redirect(`/orders/${order.id}`);
  }

  if (order.paymentStatus === "paid") {
    redirect(`/orders/${order.id}`);
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

  redirect(checkout.data.checkoutUrl);
}
