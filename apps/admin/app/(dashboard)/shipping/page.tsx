//@ts-ignore
//@ts-nocheck
"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import {
  Plus,
  Filter,
  RefreshCw,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Search,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTable } from "../_components/data-table/data-table";

// Mock data for demonstration
const shipments = [
  {
    id: "ship_001",
    trackingNumber: "TRCK123456789",
    orderId: "ORD-10001",
    orderNumber: "ORD-10001",
    customerName: "John Smith",
    carrier: "FedEx",
    serviceLevel: "Express",
    status: "delivered",
    origin: "Los Angeles, CA",
    destination: "New York, NY",
    estimatedDeliveryDate: "2023-10-12",
    actualDeliveryDate: "2023-10-11",
    cost: 15.75,
    createdAt: "2023-10-08T10:30:00Z",
    items: 2,
    weight: 4.5,
  },
  {
    id: "ship_002",
    trackingNumber: "TRCK234567890",
    orderId: "ORD-10002",
    orderNumber: "ORD-10002",
    customerName: "Emily Johnson",
    carrier: "UPS",
    serviceLevel: "Ground",
    status: "in_transit",
    origin: "Chicago, IL",
    destination: "Denver, CO",
    estimatedDeliveryDate: "2023-10-14",
    actualDeliveryDate: null,
    cost: 12.5,
    createdAt: "2023-10-10T15:45:00Z",
    items: 1,
    weight: 2.2,
  },
  {
    id: "ship_003",
    trackingNumber: "TRCK345678901",
    orderId: "ORD-10003",
    orderNumber: "ORD-10003",
    customerName: "Michael Brown",
    carrier: "USPS",
    serviceLevel: "Priority",
    status: "out_for_delivery",
    origin: "Seattle, WA",
    destination: "Portland, OR",
    estimatedDeliveryDate: "2023-10-13",
    actualDeliveryDate: null,
    cost: 8.95,
    createdAt: "2023-10-11T09:15:00Z",
    items: 3,
    weight: 5.8,
  },
  {
    id: "ship_004",
    trackingNumber: "TRCK456789012",
    orderId: "ORD-10004",
    orderNumber: "ORD-10004",
    customerName: "Sarah Davis",
    carrier: "DHL",
    serviceLevel: "Express",
    status: "pending",
    origin: "Miami, FL",
    destination: "Atlanta, GA",
    estimatedDeliveryDate: "2023-10-15",
    actualDeliveryDate: null,
    cost: 18.25,
    createdAt: "2023-10-12T14:20:00Z",
    items: 1,
    weight: 1.5,
  },
  {
    id: "ship_005",
    trackingNumber: "TRCK567890123",
    orderId: "ORD-10005",
    orderNumber: "ORD-10005",
    customerName: "Robert Wilson",
    carrier: "FedEx",
    serviceLevel: "Ground",
    status: "exception",
    origin: "Boston, MA",
    destination: "Washington, DC",
    estimatedDeliveryDate: "2023-10-13",
    actualDeliveryDate: null,
    cost: 14.3,
    createdAt: "2023-10-09T11:50:00Z",
    items: 2,
    weight: 3.7,
  },
  {
    id: "ship_006",
    trackingNumber: "TRCK678901234",
    orderId: "ORD-10006",
    orderNumber: "ORD-10006",
    customerName: "Jennifer Lee",
    carrier: "UPS",
    serviceLevel: "Next Day Air",
    status: "delivered",
    origin: "San Francisco, CA",
    destination: "San Diego, CA",
    estimatedDeliveryDate: "2023-10-11",
    actualDeliveryDate: "2023-10-11",
    cost: 22.5,
    createdAt: "2023-10-10T16:30:00Z",
    items: 1,
    weight: 2.0,
  },
  {
    id: "ship_007",
    trackingNumber: "TRCK789012345",
    orderId: "ORD-10007",
    orderNumber: "ORD-10007",
    customerName: "David Garcia",
    carrier: "USPS",
    serviceLevel: "First Class",
    status: "in_transit",
    origin: "Phoenix, AZ",
    destination: "Las Vegas, NV",
    estimatedDeliveryDate: "2023-10-14",
    actualDeliveryDate: null,
    cost: 6.75,
    createdAt: "2023-10-11T13:25:00Z",
    items: 2,
    weight: 1.2,
  },
  {
    id: "ship_008",
    trackingNumber: "TRCK890123456",
    orderId: "ORD-10008",
    orderNumber: "ORD-10008",
    customerName: "Lisa Martinez",
    carrier: "DHL",
    serviceLevel: "Standard",
    status: "delivered",
    origin: "Dallas, TX",
    destination: "Houston, TX",
    estimatedDeliveryDate: "2023-10-12",
    actualDeliveryDate: "2023-10-12",
    cost: 10.25,
    createdAt: "2023-10-09T10:15:00Z",
    items: 4,
    weight: 6.3,
  },
];

export default function ShippingPage() {
  const columns = [
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => {
        const shipment = row.original;
        return (
          <div>
            <Link
              href={`/withAuth/shipping/${shipment.id}`}
              className="font-medium hover:underline"
            >
              {row.getValue("trackingNumber")}
            </Link>
            <div className="text-xs text-gray-500">{shipment.carrier}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => {
        const orderId = row.original.orderId;
        const orderNumber = row.getValue("orderNumber") as string;
        return (
          <Link
            href={`/withAuth/orders/${orderId}`}
            className="text-blue-600 hover:underline"
          >
            {orderNumber}
          </Link>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <ShipmentStatusBadge status={status} />;
      },
    },
    {
      accessorKey: "destination",
      header: "Destination",
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
            {row.getValue("destination")}
          </div>
        );
      },
    },
    {
      accessorKey: "estimatedDeliveryDate",
      header: "Delivery Date",
      cell: ({ row }) => {
        const estimatedDate = row.getValue("estimatedDeliveryDate") as string;
        const actualDate = row.original.actualDeliveryDate;
        const status = row.original.status;

        if (status === "delivered" && actualDate) {
          return (
            <div>
              <div className="font-medium">
                {new Date(actualDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-green-600">Delivered</div>
            </div>
          );
        }

        return (
          <div>
            <div>{new Date(estimatedDate).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">Estimated</div>
          </div>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = parseInt(row.getValue("items"));
        const weight = row.original.weight;

        return (
          <div>
            <div className="font-medium">
              {items} item{items !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-gray-500">{weight} kg</div>
          </div>
        );
      },
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => {
        const cost = parseFloat(row.getValue("cost"));
        return (
          <div className="font-medium text-right">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            }).format(cost)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const shipment = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/shipping/${shipment.id}`}
                    className="w-full"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/orders/${shipment.orderId}`}
                    className="w-full"
                  >
                    View order
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Print label</DropdownMenuItem>
                <DropdownMenuItem>Print packing slip</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Track shipment</DropdownMenuItem>
                <DropdownMenuItem>Update status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping</h1>
          <p className="text-muted-foreground">
            Manage shipments and delivery tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/withAuth/shipping/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              Total Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments.filter((s) => s.status === "delivered").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (shipments.filter((s) => s.status === "delivered").length /
                  shipments.length) *
                  100
              )}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="h-4 w-4 mr-2 text-gray-500" />
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                shipments.filter(
                  (s) =>
                    s.status === "in_transit" || s.status === "out_for_delivery"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-gray-500" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments.filter((s) => s.status === "exception").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Shipment Tracking</h2>
            <p className="text-sm text-gray-500">
              Track shipments by tracking number or order ID
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Enter tracking # or order ID"
                className="pl-8"
              />
            </div>
            <Button>Track</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all-shipments">
        <TabsList>
          <TabsTrigger value="all-shipments">All Shipments</TabsTrigger>
          <TabsTrigger value="in-transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
        </TabsList>
        <TabsContent value="all-shipments" className="p-0 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Service Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Levels</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="ground">Ground</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select defaultValue="date-desc">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="delivery-date">Delivery Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={shipments}
            searchableColumns={[
              {
                id: "trackingNumber",
                title: "Tracking Number",
              },
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
            filterableColumns={[
              {
                id: "status",
                title: "Status",
                options: [
                  { label: "Pending", value: "pending" },
                  { label: "In Transit", value: "in_transit" },
                  { label: "Out for Delivery", value: "out_for_delivery" },
                  { label: "Delivered", value: "delivered" },
                  { label: "Exception", value: "exception" },
                ],
              },
              {
                id: "carrier",
                title: "Carrier",
                options: [
                  { label: "FedEx", value: "FedEx" },
                  { label: "UPS", value: "UPS" },
                  { label: "USPS", value: "USPS" },
                  { label: "DHL", value: "DHL" },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="in-transit" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={shipments.filter(
              (s) =>
                s.status === "in_transit" || s.status === "out_for_delivery"
            )}
            searchableColumns={[
              {
                id: "trackingNumber",
                title: "Tracking Number",
              },
              {
                id: "orderNumber",
                title: "Order Number",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="delivered" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={shipments.filter((s) => s.status === "delivered")}
            searchableColumns={[
              {
                id: "trackingNumber",
                title: "Tracking Number",
              },
              {
                id: "orderNumber",
                title: "Order Number",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="exceptions" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={shipments.filter((s) => s.status === "exception")}
            searchableColumns={[
              {
                id: "trackingNumber",
                title: "Tracking Number",
              },
              {
                id: "orderNumber",
                title: "Order Number",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

// Status badge component
function ShipmentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 flex items-center gap-1 justify-center">
          <CheckCircle className="h-3 w-3" />
          Delivered
        </Badge>
      );
    case "in_transit":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-2 flex items-center gap-1 justify-center">
          <Truck className="h-3 w-3" />
          In Transit
        </Badge>
      );
    case "out_for_delivery":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-2 flex items-center gap-1 justify-center">
          <Truck className="h-3 w-3" />
          Out for Delivery
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-2 flex items-center gap-1 justify-center">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "exception":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-2 flex items-center gap-1 justify-center">
          <AlertTriangle className="h-3 w-3" />
          Exception
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-2">
          {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
        </Badge>
      );
  }
}
