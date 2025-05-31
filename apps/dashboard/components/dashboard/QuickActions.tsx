import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Plus, Eye, Download, TrendingUp } from "lucide-react";

const quickActions = [
  {
    title: "Add New Product",
    description: "Create and list a new product",
    icon: Plus,
    color: "bg-blue-600 hover:bg-blue-700",
    action: () => console.log("Add new product"),
  },
  {
    title: "View All Orders",
    description: "Manage your customer orders",
    icon: Eye,
    color: "bg-green-600 hover:bg-green-700",
    action: () => console.log("View all orders"),
  },
  {
    title: "Download Reports",
    description: "Export sales and analytics data",
    icon: Download,
    color: "bg-purple-600 hover:bg-purple-700",
    action: () => console.log("Download reports"),
  },
  {
    title: "Marketing Center",
    description: "Create promotions and campaigns",
    icon: TrendingUp,
    color: "bg-orange-600 hover:bg-orange-700",
    action: () => console.log("Marketing center"),
  },
];

export const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
        <p className="text-sm text-gray-600">Frequently used features</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              onClick={action.action}
              className={`w-full justify-start h-auto py-4 px-4 ${action.color} text-white`}
              variant="default"
            >
              <div className="flex items-center w-full">
                <action.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {action.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
