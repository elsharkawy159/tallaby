import { OrderConfirmationSkeleton } from "./order-confirmation.skeleton";

export default function OrderConfirmationLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <OrderConfirmationSkeleton />
      </div>
    </main>
  );
}
