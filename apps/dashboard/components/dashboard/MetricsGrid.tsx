import { DollarSign, ShoppingBag, Package, Star } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";

const metrics = [
  {
    title: "Total Sales",
    value: "$12,345",
    change: "+12.5%",
    changeText: "from last month",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    title: "Total Orders",
    value: "234",
    change: "+8.2%",
    changeText: "from last week",
    icon: ShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Total Products",
    value: "89",
    change: "+3",
    changeText: "new this week",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Average Rating",
    value: "4.8/5",
    change: "+0.2",
    changeText: "from last month",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
];

export const MetricsGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          className="hover:shadow-lg transition-shadow duration-200"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </p>
                <div className="flex items-center text-sm">
                  <span className={`font-medium ${metric.color}`}>
                    {metric.change}
                  </span>
                  <span className="text-gray-500 ml-1">
                    {metric.changeText}
                  </span>
                </div>
              </div>
              <div className={`${metric.bgColor} p-3 rounded-full`}>
                <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
