import { Suspense } from "react";
import { OrderConfirmationData } from "./_components/order-confirmation.data";
import { OrderConfirmationSkeleton } from "./_components/order-confirmation.skeleton";

// Force dynamic rendering - no caching for order confirmation
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-4 md:py-8">
      <Suspense fallback={<OrderConfirmationSkeleton />}>
        <OrderConfirmationData orderId={orderId} />
      </Suspense>
    </div>
  );
}
