"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Activity, Eye, ShoppingCart, Users, Wifi } from "lucide-react";

export const RealTimeWidget = () => {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 247,
    currentOrders: 12,
    pageViews: 1834,
    conversionRate: 3.2,
    serverStatus: "healthy",
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData((prev) => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        currentOrders: prev.currentOrders + Math.floor(Math.random() * 3) - 1,
        pageViews: prev.pageViews + Math.floor(Math.random() * 20),
        conversionRate: Math.max(
          0,
          prev.conversionRate + Math.random() * 0.4 - 0.2
        ),
        serverStatus: Math.random() > 0.1 ? "healthy" : "warning",
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Real-Time Metrics
          <Badge className={getStatusColor(realTimeData.serverStatus)}>
            <Wifi className="h-3 w-3 mr-1" />
            {realTimeData.serverStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeData.activeUsers}
            </p>
            <p className="text-sm text-gray-500">Active Users</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeData.currentOrders}
            </p>
            <p className="text-sm text-gray-500">Live Orders</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <Eye className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeData.pageViews.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Page Views</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <Activity className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeData.conversionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
