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
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react'
import { getCommerceAnalytics } from '@/lib/analytics/commerce.server'
import { AnalyticsRefreshButton } from './_components/analytics-refresh-button'
import { MetricCard } from './_components/cards/metric-card'
import { AreaChart } from './_components/charts/area-chart'
import { BarChart } from './_components/charts/bar-chart'
import { PieChart } from './_components/charts/pie-chart'

export default async function DashboardPage () {
  const commerce = await getCommerceAnalytics()

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Live store metrics from orders. Last 30 days vs previous 30 days.
          </p>
        </div>
        <AnalyticsRefreshButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(commerce.revenue.current)}
          percentageChange={commerce.revenue.changePercent}
          helpText="vs last period"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="Total Orders"
          value={commerce.orders.current.toLocaleString('en-EG')}
          percentageChange={commerce.orders.changePercent}
          helpText="vs last period"
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <MetricCard
          title="New Customers"
          value={commerce.customers.current.toLocaleString('en-EG')}
          percentageChange={commerce.customers.changePercent}
          helpText="vs last period"
          icon={<Users className="h-6 w-6" />}
        />
        <MetricCard
          title="Active Products"
          value={commerce.activeProducts.current.toLocaleString('en-EG')}
          percentageChange={commerce.activeProducts.changePercent}
          helpText="vs last period"
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart data={commerce.dailyRevenue} />
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order status distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart data={commerce.orderStatus} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="recent-orders">
          <TabsList>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="top-products">Top Products</TabsTrigger>
            <TabsTrigger value="seller-performance">Seller Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="recent-orders" className="mt-4 p-0">
            <DashboardTable
              headers={['Order', 'Customer', 'Status', 'Total']}
              rows={commerce.recentOrders.map((order) => [
                order.orderNumber,
                order.customer,
                order.status,
                formatCurrency(order.total)
              ])}
              empty="No orders yet"
            />
          </TabsContent>
          <TabsContent value="top-products" className="mt-4 p-0">
            <DashboardTable
              headers={['Product', 'Orders', 'Units', 'Revenue']}
              rows={commerce.topProducts.map((product) => [
                product.name,
                String(product.orders),
                String(product.units),
                formatCurrency(product.revenue)
              ])}
              empty="No product sales yet"
            />
          </TabsContent>
          <TabsContent value="seller-performance" className="mt-4 p-0">
            <DashboardTable
              headers={['Seller', 'Orders', 'Revenue']}
              rows={commerce.topSellers.map((seller) => [
                seller.name,
                String(seller.orders),
                formatCurrency(seller.revenue)
              ])}
              empty="No seller sales yet"
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Top selling categories by revenue (30 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BarChart data={commerce.salesByCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Activity</CardTitle>
            <CardDescription>New vs returning buyers</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart data={commerce.customerActivity} isMultiple />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function DashboardTable ({
  headers,
  rows,
  empty
}: {
  headers: string[]
  rows: string[][]
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">{empty}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {headers.map((header) => (
                <th key={header} className="pb-3 text-left text-sm font-medium first:text-left last:text-right">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-b last:border-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className={`py-3 text-sm ${cellIndex === row.length - 1 ? 'text-right' : 'text-left'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
