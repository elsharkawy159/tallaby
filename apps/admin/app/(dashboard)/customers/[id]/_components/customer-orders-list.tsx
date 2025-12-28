"use client";

import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { formatCurrency, formatDate } from "../../customers.lib";
import { Eye } from "lucide-react";
import type { CustomerOrder } from "../customer-profile.types";

interface CustomerOrdersListProps {
  orders: CustomerOrder[];
}

export function CustomerOrdersList({ orders }: CustomerOrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders found for this customer.
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default";
      case "shipped":
      case "confirmed":
        return "secondary";
      case "cancelled":
      case "refunded":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default";
      case "authorized":
        return "secondary";
      case "failed":
      case "refunded":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-medium">#{order.orderNumber}</span>
              <Badge
                variant={getStatusBadgeVariant(order.status)}
                className="capitalize"
              >
                {order.status}
              </Badge>
              <Badge
                variant={getPaymentStatusBadgeVariant(order.paymentStatus)}
                className="capitalize"
              >
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(Number(order.totalAmount))}
              </div>
            </div>
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
