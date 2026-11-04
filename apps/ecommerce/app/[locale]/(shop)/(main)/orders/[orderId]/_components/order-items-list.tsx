"use client";

import { OrderItemRow } from "./order-item-row";
import type { OrderConfirmationData } from "./order-confirmation.types";

interface OrderItemsListProps {
  orderItems: OrderConfirmationData["orderItems"];
  orderId: string;
  orderStatus: string;
  locale: string;
  currency?: string | null;
  autoExpandReviewItemId?: string;
}

export function OrderItemsList({
  orderItems,
  orderId,
  orderStatus,
  locale,
  currency,
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
          currency={currency}
          autoExpandReview={
            autoExpandReviewItemId != null &&
            autoExpandReviewItemId === item.id
          }
        />
      ))}
    </div>
  );
}
