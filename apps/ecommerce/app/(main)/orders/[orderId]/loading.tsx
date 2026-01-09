import { OrderConfirmationSkeleton } from "./_components/order-confirmation.skeleton";

export default function OrderConfirmationLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container py-8">
        <OrderConfirmationSkeleton />
      </div>
    </main>
  );
}
