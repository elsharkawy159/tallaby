import { Button } from "@workspace/ui/components/button";
import {
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import { MetricCard } from "./_components/cards/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AreaChart } from "./_components/charts/area-chart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { BarChart } from "./_components/charts/bar-chart";
import { PieChart } from "./_components/charts/pie-chart";

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* <DateRangePicker /> */}
          <Button size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$45,231.89"
          percentageChange={20.1}
          trend="positive"
          helpText="vs last period"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="Total Orders"
          value="2,345"
          percentageChange={-5.2}
          trend="negative"
          helpText="vs last period"
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <MetricCard
          title="New Customers"
          value="573"
          percentageChange={12.5}
          trend="positive"
          helpText="vs last period"
          icon={<Users className="h-6 w-6" />}
        />
        <MetricCard
          title="Active Products"
          value="12,456"
          percentageChange={0}
          trend="neutral"
          helpText="vs last period"
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Daily revenue for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart
              data={[
                { date: "2023-01-01", value: 1200 },
                { date: "2023-01-02", value: 1300 },
                { date: "2023-01-03", value: 1400 },
                { date: "2023-01-04", value: 1500 },
                { date: "2023-01-05", value: 1700 },
                { date: "2023-01-06", value: 1600 },
                { date: "2023-01-07", value: 1800 },
                { date: "2023-01-08", value: 2000 },
                { date: "2023-01-09", value: 2200 },
                { date: "2023-01-10", value: 2100 },
                { date: "2023-01-11", value: 2300 },
                { date: "2023-01-12", value: 2400 },
                { date: "2023-01-13", value: 2500 },
                { date: "2023-01-14", value: 2600 },
                { date: "2023-01-15", value: 2750 },
                { date: "2023-01-16", value: 2900 },
                { date: "2023-01-17", value: 3000 },
                { date: "2023-01-18", value: 2800 },
                { date: "2023-01-19", value: 2700 },
                { date: "2023-01-20", value: 2900 },
                { date: "2023-01-21", value: 3100 },
                { date: "2023-01-22", value: 3200 },
                { date: "2023-01-23", value: 3300 },
                { date: "2023-01-24", value: 3400 },
                { date: "2023-01-25", value: 3500 },
                { date: "2023-01-26", value: 3700 },
                { date: "2023-01-27", value: 3800 },
                { date: "2023-01-28", value: 3700 },
                { date: "2023-01-29", value: 3900 },
                { date: "2023-01-30", value: 4100 },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order status distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart
              data={[
                { name: "Pending", value: 120, color: "#f59e0b" },
                { name: "Processing", value: 210, color: "#3b82f6" },
                { name: "Shipped", value: 450, color: "#10b981" },
                { name: "Delivered", value: 1500, color: "#6366f1" },
                { name: "Cancelled", value: 65, color: "#ef4444" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="recent-orders">
          <TabsList>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="top-products">Top Products</TabsTrigger>
            <TabsTrigger value="seller-performance">
              Seller Performance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recent-orders" className="p-0 mt-4">
            {/* <RecentOrdersTable /> */}
          </TabsContent>
          <TabsContent value="top-products" className="p-0 mt-4">
            {/* <TopSellingProductsTable /> */}
          </TabsContent>
          <TabsContent value="seller-performance" className="p-0 mt-4">
            {/* <SellerPerformanceTable /> */}
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Top selling categories by revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BarChart
              data={[
                { name: "Electronics", value: 12500 },
                { name: "Clothing", value: 8750 },
                { name: "Home & Kitchen", value: 6500 },
                { name: "Beauty", value: 5100 },
                { name: "Sports", value: 4200 },
                { name: "Books", value: 3800 },
                { name: "Toys", value: 2900 },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Activity</CardTitle>
            <CardDescription>New vs returning customers</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart
              data={[
                { date: "2023-01-01", new: 120, returning: 90 },
                { date: "2023-01-02", new: 132, returning: 103 },
                { date: "2023-01-03", new: 141, returning: 118 },
                { date: "2023-01-04", new: 135, returning: 124 },
                { date: "2023-01-05", new: 150, returning: 130 },
                { date: "2023-01-06", new: 142, returning: 135 },
                { date: "2023-01-07", new: 160, returning: 145 },
                { date: "2023-01-08", new: 175, returning: 152 },
                { date: "2023-01-09", new: 185, returning: 168 },
                { date: "2023-01-10", new: 180, returning: 174 },
                { date: "2023-01-11", new: 195, returning: 182 },
                { date: "2023-01-12", new: 205, returning: 189 },
                { date: "2023-01-13", new: 215, returning: 195 },
                { date: "2023-01-14", new: 225, returning: 205 },
              ]}
              isMultiple={true}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
