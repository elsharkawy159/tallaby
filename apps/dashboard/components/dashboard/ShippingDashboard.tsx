import { Truck, Package, MapPin, Clock, Plus, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";

const shipments = [
  {
    id: "SH001",
    orderId: "#ORD-001",
    customer: "John Smith",
    carrier: "FedEx",
    trackingNumber: "FX123456789",
    status: "In Transit",
    destination: "New York, NY",
    estimatedDelivery: "2024-01-18",
  },
  {
    id: "SH002",
    orderId: "#ORD-002",
    customer: "Sarah Johnson",
    carrier: "UPS",
    trackingNumber: "UPS987654321",
    status: "Delivered",
    destination: "Los Angeles, CA",
    estimatedDelivery: "2024-01-17",
  },
  {
    id: "SH003",
    orderId: "#ORD-003",
    customer: "Mike Davis",
    carrier: "DHL",
    trackingNumber: "DHL456789123",
    status: "Processing",
    destination: "Chicago, IL",
    estimatedDelivery: "2024-01-20",
  },
  {
    id: "SH004",
    orderId: "#ORD-004",
    customer: "Emily Brown",
    carrier: "USPS",
    trackingNumber: "USPS789123456",
    status: "Shipped",
    destination: "Miami, FL",
    estimatedDelivery: "2024-01-19",
  },
];

const carriers = [
  { name: "FedEx", rate: "$12.50", deliveryTime: "2-3 days", status: "Active" },
  { name: "UPS", rate: "$11.75", deliveryTime: "2-4 days", status: "Active" },
  { name: "DHL", rate: "$15.00", deliveryTime: "1-2 days", status: "Active" },
  { name: "USPS", rate: "$8.50", deliveryTime: "3-5 days", status: "Active" },
];

export const ShippingDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Shipping & Logistics
          </h1>
          <p className="text-gray-600 mt-1">
            Manage shipments, carriers, and delivery tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#E9520E] hover:bg-[#D4460C]">
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Carrier
          </Button>
        </div>
      </div>

      {/* Shipping Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Shipments</p>
                <p className="text-2xl font-bold text-gray-900">47</p>
                <p className="text-sm text-blue-600">+5 new today</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Pickup</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-orange-600">Needs attention</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On-Time Delivery</p>
                <p className="text-2xl font-bold text-gray-900">94.5%</p>
                <p className="text-sm text-green-600">+2.1% this month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Shipping Cost</p>
                <p className="text-2xl font-bold text-gray-900">$11.94</p>
                <p className="text-sm text-red-600">+$0.50 this month</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by tracking number, order ID, or customer..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">All Status</Button>
              <Button variant="outline">Carrier</Button>
              <Button variant="outline">Date Range</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipments Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.id}
                      </TableCell>
                      <TableCell>{shipment.orderId}</TableCell>
                      <TableCell>{shipment.customer}</TableCell>
                      <TableCell>{shipment.carrier}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            shipment.status === "Delivered"
                              ? "default"
                              : shipment.status === "In Transit" ||
                                  shipment.status === "Shipped"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.estimatedDelivery}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Track
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Carriers */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Carriers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carriers.map((carrier) => (
                <div
                  key={carrier.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{carrier.name}</p>
                    <p className="text-sm text-gray-600">
                      {carrier.deliveryTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{carrier.rate}</p>
                    <Badge variant="outline" className="text-xs">
                      {carrier.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
