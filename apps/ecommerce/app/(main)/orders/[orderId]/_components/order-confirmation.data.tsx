import { redirect } from "next/navigation";
import { getOrderConfirmationData } from "./order-confirmation.server";
import { OrderConfirmationContent } from "./order-confirmation.chunks";
import { getLocale, getTranslations } from "next-intl/server";

interface OrderConfirmationDataProps {
  orderId: string;
}

export async function OrderConfirmationData({
  orderId,
}: OrderConfirmationDataProps) {
  const result = await getOrderConfirmationData(orderId);
  const locale = await getLocale();
  const t = await getTranslations("orders");

  if (!result.success || !result.data) {
    if (result.error === "Order not found") {
      redirect("/profile/orders");
    }

    return (
      <div className="text-center py-8 md:py-16 max-w-4xl mx-auto">
        <div className="space-y-3 md:space-y-4">
          <div className="text-4xl md:text-6xl">❌</div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {t("orderNotFound")}
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            {result.error || t("orderNotFoundDescription")}
          </p>
        </div>
      </div>
    );
  }

  return <OrderConfirmationContent data={result.data} locale={locale} />;
}
