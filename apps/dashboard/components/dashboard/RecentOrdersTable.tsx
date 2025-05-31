import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

const recentOrders = [
  {
    id: "#ORD-001",
    customer: "Alice Johnson",
    amount: "$234.50",
    status: "delivered",
    date: "2024-05-25",
  },
  {
    id: "#ORD-002",
    customer: "Bob Smith",
    amount: "$156.00",
    status: "shipped",
    date: "2024-05-25",
  },
  {
    id: "#ORD-003",
    customer: "Carol Davis",
    amount: "$89.99",
    status: "processing",
    date: "2024-05-24",
  },
  {
    id: "#ORD-004",
    customer: "David Wilson",
    amount: "$312.75",
    status: "pending",
    date: "2024-05-24",
  },
  {
    id: "#ORD-005",
    customer: "Emma Brown",
    amount: "$78.25",
    status: "delivered",
    date: "2024-05-23",
  },
  {
    id: "#ORD-006",
    customer: "Frank Miller",
    amount: "$445.00",
    status: "shipped",
    date: "2024-05-23",
  },
  {
    id: "#ORD-007",
    customer: "Grace Lee",
    amount: "$167.50",
    status: "processing",
    date: "2024-05-22",
  },
  {
    id: "#ORD-008",
    customer: "Henry Taylor",
    amount: "$203.80",
    status: "pending",
    date: "2024-05-22",
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "delivered":
      return "default";
    case "shipped":
      return "secondary";
    case "processing":
      return "outline";
    case "pending":
      return "destructive";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const RecentOrdersTable = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Recent Orders
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Latest orders from your customers
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All Orders
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">
                      {order.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{order.customer}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">
                      {order.amount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600 text-sm">{order.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
