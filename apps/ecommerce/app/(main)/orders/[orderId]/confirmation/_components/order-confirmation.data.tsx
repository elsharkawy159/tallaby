import { getOrderConfirmationData } from "./order-confirmation.server";
import { OrderConfirmationContent } from "./order-confirmation.chunks";

interface OrderConfirmationDataProps {
  orderId: string;
}

export async function OrderConfirmationData({
  orderId,
}: OrderConfirmationDataProps) {
  const result = await getOrderConfirmationData(orderId);

  if (!result.success || !result.data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
          <p className="text-gray-600">
            {result.error || "We couldn't find the order you're looking for."}
          </p>
          <div className="pt-4">
            <a
              href="/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Orders
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <OrderConfirmationContent data={result.data} />;
}
