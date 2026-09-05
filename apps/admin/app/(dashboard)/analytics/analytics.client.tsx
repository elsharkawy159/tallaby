'use client'

import { formatCurrency } from '@workspace/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/components/tabs'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  LineChart as LineChartIcon,
  Package,
  PieChart as PieChartIcon,
  ShoppingCart,
  TrendingUp,
  Users
} from 'lucide-react'
import type { AdminAnalyticsPayload } from '@/lib/analytics/analytics.types'
import { AreaChart } from '../_components/charts/area-chart'
import { BarChart } from '../_components/charts/bar-chart'
import { LineChart } from '../_components/charts/line-chart'
import { PieChart } from '../_components/charts/pie-chart'

function ChangeLabel ({ value }: { value: number }) {
  const isPositive = value >= 0
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className={`flex items-center pt-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      <Icon className="mr-1 h-4 w-4" />
      {isPositive ? '+' : ''}
      {value}% from last period
    </div>
  )
}

function stockStatus (quantity: number) {
  if (quantity <= 0) {
    return { label: 'Out of Stock', className: 'bg-red-100 text-red-800' }
  }
  if (quantity <= 10) {
    return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' }
  }
  return { label: 'In Stock', className: 'bg-green-100 text-green-800' }
}

export function AnalyticsDashboard ({ data }: { data: AdminAnalyticsPayload }) {
  const { commerce } = data
  // PostHog UI temporarily disabled — see analytics.server.ts
  // const { posthog } = data

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(commerce.revenue.current)}</div>
            <ChangeLabel value={commerce.revenue.changePercent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commerce.orders.current.toLocaleString('en-EG')}
            </div>
            <ChangeLabel value={commerce.orders.changePercent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commerce.customers.current.toLocaleString('en-EG')}
            </div>
            <ChangeLabel value={commerce.customers.changePercent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(commerce.aov.current)}</div>
            <ChangeLabel value={commerce.aov.changePercent} />
          </CardContent>
        </Card>
      </div>

      {/* Temporarily disabled — PostHog storefront traffic card
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Storefront traffic (PostHog)</CardTitle>
          <CardDescription>
            Unique visitors, pageviews, and checkout funnel for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {posthog.message && (
            <p className="text-sm text-muted-foreground">{posthog.message}</p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Unique visitors</p>
              <p className="text-2xl font-bold">
                {posthog.uniqueVisitors.toLocaleString('en-EG')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pageviews</p>
              <p className="text-2xl font-bold">
                {posthog.pageviews.toLocaleString('en-EG')}
              </p>
            </div>
          </div>
          <div className="h-[240px]">
            <LineChart data={posthog.dailyPageviews} valueKind="number" />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {posthog.funnel.map((step) => (
              <div key={step.event} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{step.label}</p>
                <p className="text-lg font-semibold">
                  {step.users.toLocaleString('en-EG')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      */}

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Monthly revenue for the past year</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart data={commerce.monthlyRevenue} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
                <CardDescription>Monthly orders for the past year</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChart
                  data={commerce.monthlyOrders.map((item) => ({
                    name: item.date.slice(0, 7),
                    value: item.value
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
                <LineChart data={commerce.monthlyAov} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition</CardTitle>
              <CardDescription>New vs returning buyers</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AreaChart data={commerce.customerActivity} isMultiple />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue per buyer</CardTitle>
              <CardDescription>Average revenue per unique buyer each month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart data={commerce.monthlyClv} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Highest revenue-generating products</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart
                  data={commerce.topProducts.map((product) => ({
                    name: product.name,
                    value: product.revenue
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Revenue, orders, and units sold</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium">Product</th>
                      <th className="pb-3 text-right font-medium">Revenue</th>
                      <th className="pb-3 text-right font-medium">Orders</th>
                      <th className="pb-3 text-right font-medium">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commerce.topProducts.map((product) => (
                      <tr key={product.productId} className="border-b last:border-0">
                        <td className="py-3">{product.name}</td>
                        <td className="py-3 text-right">{formatCurrency(product.revenue)}</td>
                        <td className="py-3 text-right">{product.orders}</td>
                        <td className="py-3 text-right">{product.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Stock levels for top products</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left font-medium">Product</th>
                    <th className="pb-3 text-right font-medium">In Stock</th>
                    <th className="pb-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commerce.topProducts.map((product) => {
                    const status = stockStatus(product.quantity)
                    return (
                      <tr key={product.productId} className="border-b last:border-0">
                        <td className="py-3">{product.name}</td>
                        <td className="py-3 text-right">{product.quantity}</td>
                        <td className="py-3 text-right">
                          <span className={`rounded px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Top performing product categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <PieChart data={commerce.salesByCategory} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Revenue, catalog size, and period growth</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium">Category</th>
                      <th className="pb-3 text-right font-medium">Revenue</th>
                      <th className="pb-3 text-right font-medium">Products</th>
                      <th className="pb-3 text-right font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commerce.categories.map((category) => (
                      <tr key={category.categoryId} className="border-b last:border-0">
                        <td className="py-3">{category.name}</td>
                        <td className="py-3 text-right">{formatCurrency(category.revenue)}</td>
                        <td className="py-3 text-right">{category.products}</td>
                        <td className="py-3 text-right">{category.growthPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Category Growth</CardTitle>
              <CardDescription>Period-over-period growth by category</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart
                data={commerce.categories.map((category) => ({
                  name: category.name,
                  value: category.growthPercent
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
