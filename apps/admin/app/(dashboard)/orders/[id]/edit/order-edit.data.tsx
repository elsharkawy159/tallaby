import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { OrderEditContent } from "./order-edit.client";
import { OrderDetailSkeleton } from "../order-detail.skeleton";
import type { OrderDetailWithRelations } from "../order-detail.types";

interface OrderEditDataProps {
  orderId: string;
}

async function OrderEditDataContent({ orderId }: OrderEditDataProps) {
  const result = await getOrderById(orderId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <OrderEditContent
      order={result.data as unknown as OrderDetailWithRelations}
    />
  );
}

export function OrderEditData({ orderId }: OrderEditDataProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderEditDataContent orderId={orderId} />
    </Suspense>
  );
}
