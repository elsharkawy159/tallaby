import { Suspense } from "react";
import { OrderConfirmationData } from "./order-confirmation.data";
import { OrderConfirmationSkeleton } from "./order-confirmation.skeleton";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container py-8">
        <Suspense fallback={<OrderConfirmationSkeleton />}>
          <OrderConfirmationData orderId={orderId} />
        </Suspense>
      </div>
    </main>
  );
}
