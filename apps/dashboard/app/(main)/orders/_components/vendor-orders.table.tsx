"use client";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, Eye, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { VendorOrder } from "@/actions/vendor";

interface VendorOrdersTableProps {
  orders: VendorOrder[];
  total: number;
}

const formatCurrency = (amount: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(amount));
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Package className="h-4 w-4 text-yellow-500" />;
    case "confirmed":
    case "shipping_soon":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "shipped":
    case "out_for_delivery":
      return <Truck className="h-4 w-4 text-purple-500" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Package className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    payment_processing: "bg-blue-100 text-blue-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipping_soon: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refund_requested: "bg-orange-100 text-orange-800",
    refunded: "bg-red-100 text-red-800",
    returned: "bg-red-100 text-red-800",
  };

  return (
    <Badge
      variant="secondary"
      className={
        statusColors[status as keyof typeof statusColors] ||
        "bg-gray-100 text-gray-800"
      }
    >
      {status.replace("_", " ")}
    </Badge>
  );
};

export function VendorOrdersTable({ orders, total }: VendorOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No orders yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Orders will appear here once customers start buying your products.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          <span className="text-sm text-gray-500">{total} orders total</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {orders.map((order) => (
          <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(order.status)}

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(order.status)}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Package className="h-4 w-4 mr-2" />
                        Update Status
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Truck className="h-4 w-4 mr-2" />
                        Add Tracking
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="mt-3 pl-8">
              <div className="space-y-2">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">×{item.quantity}</span>
                      <span className="text-gray-900">
                        {item.product.title}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
