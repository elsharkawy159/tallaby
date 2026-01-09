import { Suspense } from "react";
import { getOrderById } from "@/actions/orders";
import { OrderDetailContent } from "./order-detail.client";
import { OrderDetailSkeleton } from "./order-detail.skeleton";
import { notFound } from "next/navigation";
import type { OrderDetailWithRelations } from "./order-detail.types";

interface OrderDetailDataProps {
  orderId: string;
}

async function OrderDetailDataContent({ orderId }: OrderDetailDataProps) {
  const result = await getOrderById(orderId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <OrderDetailContent order={result.data as OrderDetailWithRelations} />
  );
}

export function OrderDetailData({ orderId }: OrderDetailDataProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailDataContent orderId={orderId} />
    </Suspense>
  );
}