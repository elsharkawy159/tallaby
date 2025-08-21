"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  Download,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
} from "lucide-react";
import { BarChart } from "../_components/charts/bar-chart";
import { LineChart } from "recharts";
import { AreaChart } from "../_components/charts/area-chart";
import { PieChart } from "../_components/charts/pie-chart";

// Mock data for demonstration
const salesData = [
  { date: "2023-01", revenue: 45200, orders: 1245, customers: 985 },
  { date: "2023-02", revenue: 48900, orders: 1352, customers: 1032 },
  { date: "2023-03", revenue: 52300, orders: 1485, customers: 1120 },
  { date: "2023-04", revenue: 47800, orders: 1352, customers: 1087 },
  { date: "2023-05", revenue: 53100, orders: 1542, customers: 1156 },
  { date: "2023-06", revenue: 59700, orders: 1687, customers: 1289 },
  { date: "2023-07", revenue: 62400, orders: 1785, customers: 1345 },
  { date: "2023-08", revenue: 58900, orders: 1654, customers: 1298 },
  { date: "2023-09", revenue: 63800, orders: 1823, customers: 1367 },
  { date: "2023-10", revenue: 72500, orders: 2065, customers: 1524 },
  { date: "2023-11", revenue: 86700, orders: 2354, customers: 1732 },
  { date: "2023-12", revenue: 93200, orders: 2587, customers: 1845 },
];

const categorySales = [
  { name: "Electronics", value: 352000 },
  { name: "Clothing", value: 215000 },
  { name: "Home & Kitchen", value: 178000 },
  { name: "Books", value: 98000 },
  { name: "Beauty", value: 87000 },
  { name: "Sports", value: 76000 },
  { name: "Toys", value: 45000 },
];

const topProducts = [
  { name: "Smartphone X Pro", value: 58700 },
  { name: "Wireless Headphones", value: 42300 },
  { name: "Laptop Pro 15", value: 37800 },
  { name: "Smart Watch Series 5", value: 31200 },
  { name: "Gaming Console X", value: 29400 },
];

const customerAcquisition = [
  { date: "2023-01", new: 320, returning: 665 },
  { date: "2023-02", new: 345, returning: 687 },
  { date: "2023-03", new: 378, returning: 742 },
  { date: "2023-04", new: 351, returning: 736 },
  { date: "2023-05", new: 389, returning: 767 },
  { date: "2023-06", new: 423, returning: 866 },
  { date: "2023-07", new: 456, returning: 889 },
  { date: "2023-08", new: 435, returning: 863 },
  { date: "2023-09", new: 476, returning: 891 },
  { date: "2023-10", new: 512, returning: 1012 },
  { date: "2023-11", new: 587, returning: 1145 },
  { date: "2023-12", new: 632, returning: 1213 },
];

export default function AnalyticsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your store&apos;s performance and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* <DateRangePicker /> */}
          <Button size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$743,500</div>
            <div className="flex items-center pt-1 text-xs text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20,879</div>
            <div className="flex items-center pt-1 text-xs text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +8.2% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,780</div>
            <div className="flex items-center pt-1 text-xs text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +5.7% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$35.61</div>
            <div className="flex items-center pt-1 text-xs text-red-600">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -1.2% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4 mt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Monthly revenue for the past year
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart
                data={salesData.map((item) => ({
                  date: item.date,
                  value: item.revenue,
                }))}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
                <CardDescription>
                  Monthly orders for the past year
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChart
                  data={salesData.map((item) => ({
                    name: item.date,
                    value: item.orders,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
                <CardDescription>Monthly average order value</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <LineChart
                  data={salesData.map((item) => ({
                    date: item.date,
                    value: Math.round(item.revenue / item.orders),
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 mt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Customer Acquisition</CardTitle>
              <CardDescription>New vs. returning customers</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AreaChart data={customerAcquisition} isMultiple={true} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Rate</CardTitle>
                <CardDescription>Monthly retention rate</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <LineChart
                  data={salesData.map((item, index) => ({
                    date: item.date,
                    value:
                      index > 0
                        ? Math.round(
                            (customerAcquisition[index].returning /
                              (customerAcquisition[index - 1].new +
                                customerAcquisition[index - 1].returning)) *
                              100
                          )
                        : 0,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
                <CardDescription>Average revenue per customer</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <LineChart
                  data={salesData.map((item) => ({
                    date: item.date,
                    value: Math.round(item.revenue / item.customers),
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>
                  Highest revenue-generating products
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart data={topProducts} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>
                  Revenue, orders, and conversion rate
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium">Product</th>
                      <th className="pb-3 text-right font-medium">Revenue</th>
                      <th className="pb-3 text-right font-medium">Orders</th>
                      <th className="pb-3 text-right font-medium">
                        Conv. Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">Smartphone X Pro</td>
                      <td className="py-3 text-right">$58,700</td>
                      <td className="py-3 text-right">587</td>
                      <td className="py-3 text-right">4.2%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Wireless Headphones</td>
                      <td className="py-3 text-right">$42,300</td>
                      <td className="py-3 text-right">845</td>
                      <td className="py-3 text-right">5.8%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Laptop Pro 15</td>
                      <td className="py-3 text-right">$37,800</td>
                      <td className="py-3 text-right">235</td>
                      <td className="py-3 text-right">3.5%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Smart Watch Series 5</td>
                      <td className="py-3 text-right">$31,200</td>
                      <td className="py-3 text-right">650</td>
                      <td className="py-3 text-right">6.1%</td>
                    </tr>
                    <tr>
                      <td className="py-3">Gaming Console X</td>
                      <td className="py-3 text-right">$29,400</td>
                      <td className="py-3 text-right">245</td>
                      <td className="py-3 text-right">4.8%</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>
                Product stock levels and low stock alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left font-medium">Product</th>
                    <th className="pb-3 text-right font-medium">In Stock</th>
                    <th className="pb-3 text-right font-medium">Threshold</th>
                    <th className="pb-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">Smartphone X Pro</td>
                    <td className="py-3 text-right">45</td>
                    <td className="py-3 text-right">20</td>
                    <td className="py-3 text-right">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        In Stock
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Wireless Headphones</td>
                    <td className="py-3 text-right">78</td>
                    <td className="py-3 text-right">25</td>
                    <td className="py-3 text-right">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        In Stock
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Laptop Pro 15</td>
                    <td className="py-3 text-right">12</td>
                    <td className="py-3 text-right">15</td>
                    <td className="py-3 text-right">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Smart Watch Series 5</td>
                    <td className="py-3 text-right">0</td>
                    <td className="py-3 text-right">10</td>
                    <td className="py-3 text-right">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Out of Stock
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Gaming Console X</td>
                    <td className="py-3 text-right">32</td>
                    <td className="py-3 text-right">20</td>
                    <td className="py-3 text-right">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        In Stock
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>
                  Top performing product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <PieChart data={categorySales} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Revenue, products, and conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium">Category</th>
                      <th className="pb-3 text-right font-medium">Revenue</th>
                      <th className="pb-3 text-right font-medium">Products</th>
                      <th className="pb-3 text-right font-medium">
                        Conv. Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">Electronics</td>
                      <td className="py-3 text-right">$352,000</td>
                      <td className="py-3 text-right">1,245</td>
                      <td className="py-3 text-right">4.8%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Clothing</td>
                      <td className="py-3 text-right">$215,000</td>
                      <td className="py-3 text-right">932</td>
                      <td className="py-3 text-right">3.9%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Home & Kitchen</td>
                      <td className="py-3 text-right">$178,000</td>
                      <td className="py-3 text-right">845</td>
                      <td className="py-3 text-right">3.2%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Books</td>
                      <td className="py-3 text-right">$98,000</td>
                      <td className="py-3 text-right">728</td>
                      <td className="py-3 text-right">5.4%</td>
                    </tr>
                    <tr>
                      <td className="py-3">Beauty</td>
                      <td className="py-3 text-right">$87,000</td>
                      <td className="py-3 text-right">512</td>
                      <td className="py-3 text-right">4.1%</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Growth</CardTitle>
              <CardDescription>
                Year-over-year growth by category
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart
                data={[
                  { name: "Electronics", value: 18.5 },
                  { name: "Clothing", value: 12.3 },
                  { name: "Home & Kitchen", value: 15.7 },
                  { name: "Books", value: 5.2 },
                  { name: "Beauty", value: 21.9 },
                  { name: "Sports", value: 14.1 },
                  { name: "Toys", value: 8.7 },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
