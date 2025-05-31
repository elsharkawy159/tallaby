"use client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { DownloadIcon, FilterIcon, PlusIcon, RefreshCw } from "lucide-react";
import { DataTable } from "../_components/data-table/data-table";
import { getOrdersColumns } from "./_components/table-columns";

// Mock data for demonstration
const orders = [
  {
    id: "ord_01",
    orderNumber: "ORD-10001",
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    totalAmount: 124.99,
    items: 2,
    status: "pending",
    paymentStatus: "pending",
    createdAt: "2023-10-15T10:30:00Z",
  },
  {
    id: "ord_02",
    orderNumber: "ORD-10002",
    customerName: "Emily Johnson",
    customerEmail: "emily.johnson@example.com",
    totalAmount: 89.5,
    items: 1,
    status: "confirmed",
    paymentStatus: "paid",
    createdAt: "2023-10-14T15:45:00Z",
  },
  {
    id: "ord_03",
    orderNumber: "ORD-10003",
    customerName: "Michael Brown",
    customerEmail: "michael.brown@example.com",
    totalAmount: 356.75,
    items: 4,
    status: "shipped",
    paymentStatus: "paid",
    createdAt: "2023-10-13T09:15:00Z",
  },
  {
    id: "ord_04",
    orderNumber: "ORD-10004",
    customerName: "Sarah Davis",
    customerEmail: "sarah.davis@example.com",
    totalAmount: 67.25,
    items: 1,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: "2023-10-12T14:20:00Z",
  },
  {
    id: "ord_05",
    orderNumber: "ORD-10005",
    customerName: "Robert Wilson",
    customerEmail: "robert.wilson@example.com",
    totalAmount: 215.0,
    items: 3,
    status: "cancelled",
    paymentStatus: "refunded",
    createdAt: "2023-10-11T11:50:00Z",
  },
  {
    id: "ord_06",
    orderNumber: "ORD-10006",
    customerName: "Jennifer Lee",
    customerEmail: "jennifer.lee@example.com",
    totalAmount: 178.45,
    items: 2,
    status: "confirmed",
    paymentStatus: "paid",
    createdAt: "2023-10-10T16:30:00Z",
  },
  {
    id: "ord_07",
    orderNumber: "ORD-10007",
    customerName: "David Garcia",
    customerEmail: "david.garcia@example.com",
    totalAmount: 432.0,
    items: 5,
    status: "shipping_soon",
    paymentStatus: "paid",
    createdAt: "2023-10-09T13:25:00Z",
  },
  {
    id: "ord_08",
    orderNumber: "ORD-10008",
    customerName: "Lisa Martinez",
    customerEmail: "lisa.martinez@example.com",
    totalAmount: 99.99,
    items: 1,
    status: "out_for_delivery",
    paymentStatus: "paid",
    createdAt: "2023-10-08T10:15:00Z",
  },
  {
    id: "ord_09",
    orderNumber: "ORD-10009",
    customerName: "Kevin Thompson",
    customerEmail: "kevin.thompson@example.com",
    totalAmount: 185.5,
    items: 3,
    status: "pending",
    paymentStatus: "pending",
    createdAt: "2023-10-07T17:40:00Z",
  },
  {
    id: "ord_10",
    orderNumber: "ORD-10010",
    customerName: "Karen Robinson",
    customerEmail: "karen.robinson@example.com",
    totalAmount: 267.75,
    items: 4,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: "2023-10-06T12:50:00Z",
  },
];

export default function OrdersPage() {
  const columns = getOrdersColumns();

  return (
    <>
      {/* <DashboardShell> */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              -2.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">
              +15.6% from last month
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
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              -5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-orders">
        <TabsList>
          <TabsTrigger value="all-orders">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all-orders" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders}
            filterableColumns={[
              {
                id: "status",
                title: "Status",
                options: [
                  { label: "Pending", value: "pending" },
                  { label: "Confirmed", value: "confirmed" },
                  { label: "Shipping Soon", value: "shipping_soon" },
                  { label: "Shipped", value: "shipped" },
                  { label: "Out for Delivery", value: "out_for_delivery" },
                  { label: "Delivered", value: "delivered" },
                  { label: "Cancelled", value: "cancelled" },
                ],
              },
              {
                id: "paymentStatus",
                title: "Payment",
                options: [
                  { label: "Pending", value: "pending" },
                  { label: "Paid", value: "paid" },
                  { label: "Failed", value: "failed" },
                  { label: "Refunded", value: "refunded" },
                ],
              },
            ]}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
              {
                id: "customerEmail",
                title: "Customer Email",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="pending" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders.filter((order) => order.status === "pending")}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="processing" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders.filter((order) =>
              ["confirmed", "shipping_soon"].includes(order.status)
            )}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="shipped" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders.filter((order) =>
              ["shipped", "out_for_delivery"].includes(order.status)
            )}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="delivered" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders.filter((order) => order.status === "delivered")}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="cancelled" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={orders.filter((order) => order.status === "cancelled")}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
      {/* </DashboardShell> */}
    </>
  );
}
