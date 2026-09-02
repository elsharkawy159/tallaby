"use client";

import { OrderItemRow } from "./order-item-row";
import type { OrderConfirmationData } from "./order-confirmation.types";

interface OrderItemsListProps {
  orderItems: OrderConfirmationData["orderItems"];
  orderId: string;
  orderStatus: string;
  locale: string;
  autoExpandReviewItemId?: string;
}

export function OrderItemsList({
  orderItems,
  orderId,
  orderStatus,
  locale,
  autoExpandReviewItemId,
}: OrderItemsListProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {orderItems.map((item) => (
        <OrderItemRow
          key={item.id}
          item={item}
          orderId={orderId}
          orderStatus={orderStatus}
          locale={locale}
          autoExpandReview={
            autoExpandReviewItemId != null &&
            autoExpandReviewItemId === item.id
          }
        />
      ))}
    </div>
  );
}
