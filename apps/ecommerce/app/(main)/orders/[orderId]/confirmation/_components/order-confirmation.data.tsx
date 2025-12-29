import { getOrderConfirmationData } from "./order-confirmation.server";
import { OrderConfirmationContent } from "./order-confirmation.chunks";
import { getLocale } from "next-intl/server";

interface OrderConfirmationDataProps {
  orderId: string;
}

export async function OrderConfirmationData({
  orderId,
}: OrderConfirmationDataProps) {
  const result = await getOrderConfirmationData(orderId);
  const locale = await getLocale();

  if (!result.success || !result.data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8 md:py-16">
        <div className="space-y-3 md:space-y-4">
          <div className="text-4xl md:text-6xl">❌</div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Order Not Found
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            {result.error || "We couldn't find the order you're looking for."}
          </p>
          <div className="pt-3 md:pt-4">
            <a
              href="/profile"
              className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 border border-transparent text-xs md:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Orders
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <OrderConfirmationContent data={result.data} locale={locale} />;
}
