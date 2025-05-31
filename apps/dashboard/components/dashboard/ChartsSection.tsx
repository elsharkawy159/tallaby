import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { date: "1", sales: 2400 },
  { date: "2", sales: 1398 },
  { date: "3", sales: 9800 },
  { date: "4", sales: 3908 },
  { date: "5", sales: 4800 },
  { date: "6", sales: 3800 },
  { date: "7", sales: 4300 },
  { date: "8", sales: 5200 },
  { date: "9", sales: 3100 },
  { date: "10", sales: 4600 },
  { date: "11", sales: 5800 },
  { date: "12", sales: 4200 },
  { date: "13", sales: 6100 },
  { date: "14", sales: 5300 },
  { date: "15", sales: 4900 },
  { date: "16", sales: 7200 },
  { date: "17", sales: 6800 },
  { date: "18", sales: 5400 },
  { date: "19", sales: 8100 },
  { date: "20", sales: 7600 },
  { date: "21", sales: 6200 },
  { date: "22", sales: 8900 },
  { date: "23", sales: 7400 },
  { date: "24", sales: 9200 },
  { date: "25", sales: 8300 },
  { date: "26", sales: 7800 },
  { date: "27", sales: 9600 },
  { date: "28", sales: 8700 },
  { date: "29", sales: 10200 },
  { date: "30", sales: 9800 },
];

const ordersData = [
  { status: "Pending", count: 12 },
  { status: "Processing", count: 35 },
  { status: "Shipped", count: 89 },
  { status: "Delivered", count: 156 },
];

export const ChartsSection = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Sales Trend
          </CardTitle>
          <p className="text-sm text-gray-600">
            Daily sales for the last 30 days
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value}`, "Sales"]}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Orders by Status
          </CardTitle>
          <p className="text-sm text-gray-600">
            Current month order distribution
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`${value}`, "Orders"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
