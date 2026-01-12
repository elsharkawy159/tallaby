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
          <div className="pt-3 md:pt-4">
            <a
              href="/profile/orders"
              className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 border border-transparent text-xs md:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("viewAllOrders")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <OrderConfirmationContent data={result.data} locale={locale} />;
}
