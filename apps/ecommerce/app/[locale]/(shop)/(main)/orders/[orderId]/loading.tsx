import { OrderConfirmationSkeleton } from "./_components/order-confirmation.skeleton";

export default function OrderConfirmationLoading() {
  return (
    <main className="min-h-screen">
      <div className="container py-8">
        <OrderConfirmationSkeleton />
      </div>
    </main>
  );
}
