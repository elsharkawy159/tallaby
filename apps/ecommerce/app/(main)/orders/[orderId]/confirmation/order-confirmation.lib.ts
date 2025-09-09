import type { OrderConfirmationData } from "./order-confirmation.types";

/**
 * Format currency amount with proper locale formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = "EGP"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to a readable string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get order status color and styling
 */
export function getOrderStatusStyle(status: string) {
  const statusStyles = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    },
    confirmed: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
    },
    processing: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
    },
    shipped: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      border: "border-indigo-300",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
    },
  };

  return (
    statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
  );
}

/**
 * Get payment status color and styling
 */
export function getPaymentStatusStyle(status: string) {
  const statusStyles = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    },
    processing: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
    },
    failed: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
    },
    refunded: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
    },
  };

  return (
    statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
  );
}

/**
 * Calculate estimated delivery date
 */
export function getEstimatedDeliveryDate(orderDate: string): string {
  const order = new Date(orderDate);
  const estimatedDelivery = new Date(order);

  // Add 3-5 business days for processing and shipping
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return estimatedDelivery.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate order summary text
 */
export function generateOrderSummary(data: OrderConfirmationData): string {
  const { order, summary } = data;

  return `Order ${order.orderNumber} for ${formatCurrency(summary.totalAmount, order.currency)} with ${summary.itemCount} item${summary.itemCount !== 1 ? "s" : ""}`;
}

/**
 * Check if order is eligible for return
 */
export function isOrderEligibleForReturn(orderDate: string): boolean {
  const order = new Date(orderDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return order > thirtyDaysAgo;
}
