import { Suspense } from "react";

import { OrderDetailData } from "./order-detail.data";
import { OrderDetailSkeleton } from "./order-detail.skeleton";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;

  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailData orderId={orderId} />
    </Suspense>
  );
}
