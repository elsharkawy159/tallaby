import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  ShoppingCart,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@workspace/ui/lib/utils";

const customerBehaviorData = [
  { time: "00:00", visitors: 45, purchases: 12, bounceRate: 68 },
  { time: "03:00", visitors: 23, purchases: 5, bounceRate: 72 },
  { time: "06:00", visitors: 78, purchases: 18, bounceRate: 58 },
  { time: "09:00", visitors: 245, purchases: 67, bounceRate: 45 },
  { time: "12:00", visitors: 298, purchases: 89, bounceRate: 42 },
  { time: "15:00", visitors: 356, purchases: 112, bounceRate: 38 },
  { time: "18:00", visitors: 423, purchases: 145, bounceRate: 35 },
  { time: "21:00", visitors: 198, purchases: 78, bounceRate: 48 },
];

const conversionFunnelData = [
  { stage: "Website Visits", count: 10000, percentage: 100, color: "#145163" },
  { stage: "Product Views", count: 6500, percentage: 65, color: "#1e6b7a" },
  { stage: "Add to Cart", count: 2800, percentage: 28, color: "#FDAD28" },
  { stage: "Checkout Started", count: 1400, percentage: 14, color: "#f4951b" },
  { stage: "Payment Completed", count: 980, percentage: 9.8, color: "#e8850e" },
];

const cohortData = [
  { month: "Jan", week1: 100, week2: 85, week3: 72, week4: 68 },
  { month: "Feb", week1: 100, week2: 88, week3: 75, week4: 71 },
  { month: "Mar", week1: 100, week2: 82, week3: 69, week4: 65 },
  { month: "Apr", week1: 100, week2: 90, week3: 78, week4: 74 },
  { month: "May", week1: 100, week2: 87, week3: 73, week4: 69 },
  { month: "Jun", week1: 100, week2: 85, week3: 71, week4: 67 },
];

const topProducts = [
  {
    name: "Wireless Headphones",
    sales: 1245,
    revenue: 62250,
    growth: 15.2,
    trend: "up",
  },
  {
    name: "Smart Watch",
    sales: 987,
    revenue: 148050,
    growth: 8.7,
    trend: "up",
  },
  {
    name: "Laptop Stand",
    sales: 756,
    revenue: 22680,
    growth: -2.1,
    trend: "down",
  },
  { name: "USB-C Hub", sales: 654, revenue: 32700, growth: 12.8, trend: "up" },
  {
    name: "Wireless Mouse",
    sales: 543,
    revenue: 16290,
    growth: 5.4,
    trend: "up",
  },
];

export const AdvancedAnalytics = () => {
  return (
    <div className="space-y-6">
      {/* Customer Behavior Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Customer Behavior by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerBehaviorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stackId="1"
                    stroke="#145163"
                    fill="#145163"
                    fillOpacity={0.3}
                    name="Visitors"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    stackId="2"
                    stroke="#FDAD28"
                    fill="#FDAD28"
                    fillOpacity={0.6}
                    name="Purchases"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.sales} sales • $
                        {product.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        product.trend === "up" ? "default" : "destructive"
                      }
                      className="flex items-center gap-1"
                    >
                      {product.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {product.growth > 0 ? "+" : ""}
                      {product.growth}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Conversion Funnel Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {conversionFunnelData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="text-center">
                  <div
                    className="w-full h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.percentage}%
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {stage.stage}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stage.count.toLocaleString()} users
                  </p>
                </div>
                {index < conversionFunnelData.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-2 w-4 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Retention Cohort */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Customer Retention Cohort Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Retention Rate"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="week1"
                  stroke="#145163"
                  strokeWidth={2}
                  name="Week 1"
                />
                <Line
                  type="monotone"
                  dataKey="week2"
                  stroke="#FDAD28"
                  strokeWidth={2}
                  name="Week 2"
                />
                <Line
                  type="monotone"
                  dataKey="week3"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Week 3"
                />
                <Line
                  type="monotone"
                  dataKey="week4"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Week 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
