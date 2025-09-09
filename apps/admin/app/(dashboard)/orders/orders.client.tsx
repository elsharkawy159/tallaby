"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  getAllOrders,
  deleteOrders,
  updateOrderStatus,
  exportOrders,
} from "@/actions/orders";
import { Order } from "./orders.types";
import { OrdersHeader } from "./orders.chunks";
import { getOrdersColumns } from "./_components/table-columns";
import { toast } from "sonner";

interface OrdersClientWrapperProps {
  filters?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
  };
}

export const OrdersClientWrapper = ({ filters }: OrdersClientWrapperProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-orders");

  const loadOrders = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const result = await getAllOrders({
        ...filters,
        status: activeTab === "all-orders" ? undefined : activeTab,
        limit: 100,
      });

      if (result.success) {
        const ordersData = (result.data || []).map((order: any) => ({
          ...order,
          totalAmount:
            typeof order.totalAmount === "string"
              ? parseFloat(order.totalAmount)
              : order.totalAmount,
        }));
        setOrders(ordersData as Order[]);
      } else {
        toast.error(result.error || "Failed to load orders");
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [filters, activeTab]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    loadOrders();

    const interval = setInterval(
      () => {
        loadOrders();
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleRefresh = () => {
    loadOrders();
  };

  const handleExport = async () => {
    try {
      const result = await exportOrders("csv");
      if (result.success) {
        // Create and download CSV
        const csvContent = [
          "Order Number,Customer Name,Customer Email,Total Amount,Status,Payment Status,Items Count,Created At",
          ...(result.data || []).map(
            (order) =>
              `"${order["Order Number"]}","${order["Customer Name"]}","${order["Customer Email"]}","${order["Total Amount"]}","${order["Status"]}","${order["Payment Status"]}","${order["Items Count"]}","${order["Created At"]}"`
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Orders exported to CSV successfully");
      } else {
        toast.error(result.error || "Failed to export orders");
      }
    } catch (error) {
      toast.error("Failed to export orders");
    }
  };

  const handleFilter = () => {
    // TODO: Implement filter modal
    toast.info("Coming Soon");
  };

  const handleDeleteSelected = async (orderIds: string[]) => {
    try {
      const result = await deleteOrders(orderIds);
      if (result.success) {
        toast.success(`${orderIds.length} orders deleted successfully`);
        loadOrders(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to delete orders");
      }
    } catch (error) {
      toast.error("Failed to delete orders");
    }
  };

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      let result;
      switch (action) {
        case "confirm":
          result = await updateOrderStatus(orderId, "confirmed");
          break;
        case "ship":
          result = await updateOrderStatus(orderId, "shipped");
          break;
        case "deliver":
          result = await updateOrderStatus(orderId, "delivered");
          break;
        case "cancel":
          result = await updateOrderStatus(orderId, "cancelled");
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success(`Order ${action}ed successfully`);
        loadOrders(); // Refresh the list
      } else {
        toast.error(result.error || `Failed to ${action} order`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} order`);
    }
  };

  const columns = getOrdersColumns(handleOrderAction);

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending":
        return orders.filter((order) => order.status === "pending");
      case "processing":
        return orders.filter((order) =>
          ["confirmed", "shipping_soon"].includes(order.status)
        );
      case "shipped":
        return orders.filter((order) =>
          ["shipped", "out_for_delivery"].includes(order.status)
        );
      case "delivered":
        return orders.filter((order) => order.status === "delivered");
      case "cancelled":
        return orders.filter((order) => order.status === "cancelled");
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const actionButtons = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleFilter}>
        Filter
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        Export
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <OrdersHeader
          onRefresh={handleRefresh}
          onExport={handleExport}
          onFilter={handleFilter}
          isRefreshing={isRefreshing}
        />
        <div className="text-center py-8">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrdersHeader
        onRefresh={handleRefresh}
        onExport={handleExport}
        onFilter={handleFilter}
        isRefreshing={isRefreshing}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all-orders">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="p-0 mt-4">
          <TableSection
            rows={filteredOrders}
            columns={columns}
            buttons={actionButtons}
            onDeleteSelected={handleDeleteSelected}
            searchColumnId="orderNumber"
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
