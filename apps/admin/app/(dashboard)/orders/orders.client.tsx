"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Trash2 } from "lucide-react";
import {
  deleteOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  exportOrders,
} from "@/actions/orders";
import { DataTable } from "../_components/data-table/data-table";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import { Order } from "./orders.types";
import { OrdersHeader } from "./orders.chunks";
import { getOrdersColumns, getOrdersFilters } from "./_components/table-columns";
import { ORDERS_DEFAULT_SORT, ORDER_TABS } from "./orders.params";
import { toast } from "sonner";

const AUTO_REFRESH_MS = 10 * 60 * 1000;

interface OrdersClientWrapperProps {
  orders: Order[];
  totalCount: number;
  paymentMethods: string[];
}

function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

export const OrdersClientWrapper = ({
  orders,
  totalCount,
  paymentMethods,
}: OrdersClientWrapperProps) => {
  const router = useRouter();
  const url = useTableUrlState();
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // A custom status mix (from the Status filter) highlights no tab.
  const statusParam = url.getList("status");
  const activeTab =
    ORDER_TABS.find((tab) => sameSet(tab.statuses, statusParam))?.value ?? "";

  const handleExport = async () => {
    try {
      const result = await exportOrders("csv");
      if (result.success) {
        const csvContent = [
          "Order Number,Customer Name,Customer Email,Total Amount,Status,Payment Status,Items Count,Created At",
          ...(result.data || []).map(
            (order) =>
              `"${order["Order Number"]}","${order["Customer Name"]}","${order["Customer Email"]}","${order["Total Amount"]}","${order["Status"]}","${order["Payment Status"]}","${order["Items Count"]}","${order["Created At"]}"`
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const href = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(href);

        toast.success("Orders exported to CSV successfully");
      } else {
        toast.error(result.error || "Failed to export orders");
      }
    } catch {
      toast.error("Failed to export orders");
    }
  };

  const handleDeleteSelected = async (
    selected: Order[],
    clearSelection: () => void
  ) => {
    const confirmed = window.confirm(
      `Delete ${selected.length} order${selected.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const result = await deleteOrders(selected.map((order) => order.id));
      if (result.success) {
        toast.success(`${selected.length} orders deleted successfully`);
        clearSelection();
        refresh();
      } else {
        toast.error(result.error || "Failed to delete orders");
      }
    } catch {
      toast.error("Failed to delete orders");
    }
  };

  const handleOrderAction = useCallback(
    async (orderId: string, action: string) => {
      try {
        const statusMap: Record<string, string> = {
          confirm: "confirmed",
          ship: "shipped",
          deliver: "delivered",
          cancel: "cancelled",
        };
        const status = statusMap[action] || action;

        const result = await updateOrderStatus(
          orderId,
          status as Parameters<typeof updateOrderStatus>[1]
        );

        if (result.success) {
          toast.success(`Order status updated to ${status.replace(/_/g, " ")}`);
          refresh();
        } else {
          toast.error(result.error || `Failed to update order status`);
        }
      } catch {
        toast.error(`Failed to update order status`);
      }
    },
    [refresh]
  );

  const handlePaymentStatusChange = useCallback(
    async (orderId: string, paymentStatus: string) => {
      try {
        const result = await updateOrderPaymentStatus(
          orderId,
          paymentStatus as Parameters<typeof updateOrderPaymentStatus>[1]
        );

        if (result.success) {
          toast.success(
            `Payment status updated to ${paymentStatus.replace(/_/g, " ")}`
          );
          refresh();
        } else {
          toast.error(result.error || `Failed to update payment status`);
        }
      } catch {
        toast.error(`Failed to update payment status`);
      }
    },
    [refresh]
  );

  const columns = useMemo(
    () => getOrdersColumns(handleOrderAction, handlePaymentStatusChange),
    [handleOrderAction, handlePaymentStatusChange]
  );
  const filters = useMemo(
    () => getOrdersFilters(paymentMethods),
    [paymentMethods]
  );

  return (
    <div className="space-y-6">
      <OrdersHeader
        onRefresh={refresh}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const tab = ORDER_TABS.find((item) => item.value === value);
          url.setParams({ status: tab ? tab.statuses : null });
        }}
      >
        <TabsList className="h-auto flex-wrap">
          {ORDER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={orders}
        getRowId={(order) => order.id}
        filterableColumns={filters}
        emptyMessage="No orders match these filters."
        isLoading={isRefreshing}
        serverSide={{
          rowCount: totalCount,
          defaultSort: ORDERS_DEFAULT_SORT,
          searchPlaceholder: "Search order #, customer name, email or phone…",
        }}
        bulkActions={(selected, clearSelection) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteSelected(selected, clearSelection)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected
          </Button>
        )}
      />
    </div>
  );
};
