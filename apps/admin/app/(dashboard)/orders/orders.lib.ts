import { Order } from "./orders.types";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "payment_processing":
      return "bg-orange-100 text-orange-800";
    case "confirmed":
    case "shipping_soon":
      return "bg-blue-100 text-blue-800";
    case "shipped":
    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "refund_requested":
      return "bg-amber-100 text-amber-800";
    case "refunded":
    case "returned":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "authorized":
      return "bg-blue-100 text-blue-800";
    case "paid":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "refunded":
    case "partially_refunded":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const getCustomerName = (order: Order): string => {
  if (!order.user) return "Unknown Customer";
  const firstName = order.user.firstName || "";
  const lastName = order.user.lastName || "";
  return `${firstName} ${lastName}`.trim() || "Unknown Customer";
};

export const getCustomerEmail = (order: Order): string => {
  return order.user?.email || "No email";
};

export const getItemsCount = (order: Order): number => {
  return order.orderItems.reduce((total, item) => total + item.quantity, 0);
};

export const getOrderActions = (order: Order) => {
  const actions: Array<{
    label: string;
    href?: string;
    action?: string;
    variant: "default" | "outline" | "destructive";
  }> = [
    {
      label: "View Details",
      href: `/orders/${order.id}`,
      variant: "default",
    },
    {
      label: "Edit Order",
      href: `/orders/${order.id}/edit`,
      variant: "outline",
    },
  ];

  if (order.status === "pending") {
    actions.push({
      label: "Confirm Order",
      action: "confirm",
      variant: "default",
    });
  }

  if (order.status === "confirmed" || order.status === "shipping_soon") {
    actions.push({
      label: "Mark as Shipped",
      action: "ship",
      variant: "default",
    });
  }

  if (order.status === "shipped") {
    actions.push({
      label: "Mark as Delivered",
      action: "deliver",
      variant: "default",
    });
  }

  if (order.status !== "cancelled" && order.status !== "delivered") {
    actions.push({
      label: "Cancel Order",
      action: "cancel",
      variant: "destructive",
    });
  }

  return actions;
};
