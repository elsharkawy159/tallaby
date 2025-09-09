"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Package, RefreshCw, DownloadIcon, FilterIcon } from "lucide-react";
import Link from "next/link";
import { Order, OrderStats } from "./orders.types";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getPaymentStatusColor,
  getStatusLabel,
  getCustomerName,
  getCustomerEmail,
  getItemsCount,
} from "./orders.lib";

interface OrderStatsCardsProps {
  stats: OrderStats;
}

export const OrderStatsCards = ({ stats }: OrderStatsCardsProps) => {
  const totalOrders = stats.byStatus.reduce((sum, item) => sum + item.count, 0);
  const totalRevenue = stats.byStatus.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );
  const pendingOrders =
    stats.byStatus.find((s) => s.status === "pending")?.count || 0;
  const completedOrders =
    stats.byStatus.find((s) => s.status === "delivered")?.count || 0;
  const cancelledOrders =
    stats.byStatus.find((s) => s.status === "cancelled")?.count || 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalOrders.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalRevenue)} total revenue
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders}</div>
          <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <p className="text-xs text-muted-foreground">
            Successfully delivered
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Cancelled Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cancelledOrders}</div>
          <p className="text-xs text-muted-foreground">Cancelled or refunded</p>
        </CardContent>
      </Card>
    </div>
  );
};

interface OrderRowProps {
  order: Order;
}

export const OrderRow = ({ order }: OrderRowProps) => {
  const customerName = getCustomerName(order);
  const customerEmail = getCustomerEmail(order);
  const itemsCount = getItemsCount(order);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Link
              href={`/orders/${order.id}`}
              className="font-medium hover:underline text-blue-600"
            >
              {order.orderNumber}
            </Link>
            <div className="text-sm text-gray-500">{order.id}</div>
          </div>
          <div className="flex-1">
            <div className="font-medium">{customerName}</div>
            <div className="text-sm text-gray-500">{customerEmail}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {formatCurrency(order.totalAmount)}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Package className="h-3 w-3" />
              {itemsCount} items
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
              {getStatusLabel(order.paymentStatus)}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrdersHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  onFilter: () => void;
  isRefreshing?: boolean;
}

export const OrdersHeader = ({
  onRefresh,
  onExport,
  onFilter,
  isRefreshing = false,
}: OrdersHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onFilter}>
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
};
