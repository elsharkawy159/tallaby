import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import {
  Activity,
  Zap,
  Globe,
  Server,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const performanceData = [
  {
    metric: "Page Load Time",
    value: 2.4,
    target: 3.0,
    unit: "s",
    status: "good",
  },
  {
    metric: "Time to Interactive",
    value: 3.8,
    target: 4.0,
    unit: "s",
    status: "good",
  },
  {
    metric: "First Contentful Paint",
    value: 1.2,
    target: 1.8,
    unit: "s",
    status: "excellent",
  },
  {
    metric: "Largest Contentful Paint",
    value: 2.8,
    target: 2.5,
    unit: "s",
    status: "warning",
  },
  {
    metric: "Cumulative Layout Shift",
    value: 0.05,
    target: 0.1,
    unit: "",
    status: "excellent",
  },
];

const deviceData = [
  { device: "Desktop", users: 4250, percentage: 52.3, color: "#145163" },
  { device: "Mobile", users: 3100, percentage: 38.2, color: "#FDAD28" },
  { device: "Tablet", users: 770, percentage: 9.5, color: "#10b981" },
];

const browserData = [
  { browser: "Chrome", users: 3845, market_share: 65.2 },
  { browser: "Safari", users: 1203, market_share: 20.4 },
  { browser: "Firefox", users: 542, market_share: 9.2 },
  { browser: "Edge", users: 308, market_share: 5.2 },
];

const serverMetrics = [
  { metric: "CPU Usage", value: 45, threshold: 80, status: "healthy" },
  { metric: "Memory Usage", value: 62, threshold: 85, status: "healthy" },
  { metric: "Disk Usage", value: 78, threshold: 90, status: "warning" },
  { metric: "Network I/O", value: 34, threshold: 70, status: "healthy" },
];

export const PerformanceMetrics = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "poor":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Website Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Website Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.map((item) => (
              <div key={item.metric} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.metric}
                  </p>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                  <span className="text-sm text-gray-500">{item.unit}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>
                    Target: {item.target}
                    {item.unit}
                  </span>
                </div>
                <Progress
                  value={(item.value / item.target) * 100}
                  className="mt-2 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device and Browser Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Device Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="users"
                    label={({ device, percentage }) =>
                      `${device}: ${percentage}%`
                    }
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} users`, "Users"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Browser Market Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="browser" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [`${value} users`, "Users"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="users" fill="#145163" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Server Performance Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serverMetrics.map((metric) => (
              <div key={metric.metric} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.metric}
                  </p>
                  <Activity
                    className={`h-4 w-4 ${metric.status === "healthy" ? "text-green-500" : "text-yellow-500"}`}
                  />
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}%
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  Threshold: {metric.threshold}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
