"use client";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { ChartsSection } from "./ChartsSection";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { QuickActions } from "./QuickActions";
import { RealTimeWidget } from "./RealTimeWidget";
import { useTranslations } from "next-intl";

export const AnalyticsDashboard = () => {
  const t = useTranslations();

  const metrics = [
    {
      title: t("dashboard.totalSales"),
      value: "$15,234",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
      period: t("dashboard.fromLastMonth"),
    },
    {
      title: t("dashboard.totalOrders"),
      value: "287",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: ShoppingBag,
      period: t("dashboard.fromLastWeek"),
    },
    {
      title: t("dashboard.totalProducts"),
      value: "94",
      change: "+3 new",
      changeType: "positive" as const,
      icon: Package,
      period: t("dashboard.thisWeek"),
    },
    {
      title: t("dashboard.customerRating"),
      value: "4.8/5",
      change: "+0.2",
      changeType: "positive" as const,
      icon: Star,
      period: t("dashboard.fromLastMonth"),
    },
    {
      title: t("dashboard.conversionRate"),
      value: "3.4%",
      change: "+0.8%",
      changeType: "positive" as const,
      icon: TrendingUp,
      period: t("dashboard.fromLastMonth"),
    },
    {
      title: t("dashboard.activeCustomers"),
      value: "1,245",
      change: "+15.3%",
      changeType: "positive" as const,
      icon: Users,
      period: t("dashboard.fromLastMonth"),
    },
  ];

  return (
    <div className="p-6">
      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <metric.icon className="h-6 w-6 text-primary" />
              </div>
              <span
                className={`text-sm font-medium ${
                  metric.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metric.change}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {metric.period}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ChartsSection />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
        <div>
          <QuickActions />
        </div>
        <div>
          <RealTimeWidget />
        </div>
      </div>
    </div>
  );
};
