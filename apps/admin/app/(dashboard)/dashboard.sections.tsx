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
import {
  getCategoryAndActivity,
  getDashboardMetrics,
  getDashboardTables,
  getRevenueAndStatus
} from '@/lib/analytics/commerce.server'
import { MetricCard } from './_components/cards/metric-card'
import { AreaChart } from './_components/charts/area-chart'
import { BarChart } from './_components/charts/bar-chart'
import { PieChart } from './_components/charts/pie-chart'

/**
 * Each export below is an async Server Component that owns exactly one query
 * group. page.tsx renders them inside separate <Suspense> boundaries, so the
 * dashboard shell paints immediately and each section appears as its own data
 * lands — instead of every card waiting on the slowest aggregate.
 */

export async function MetricsSection () {
  const metrics = await getDashboardMetrics()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.revenue.current)}
        percentageChange={metrics.revenue.changePercent}
        helpText="vs last period"
        icon={<DollarSign className="h-6 w-6" />}
      />
      <MetricCard
        title="Total Orders"
        value={metrics.orders.current.toLocaleString('en-EG')}
        percentageChange={metrics.orders.changePercent}
        helpText="vs last period"
        icon={<ShoppingCart className="h-6 w-6" />}
      />
      <MetricCard
        title="New Customers"
        value={metrics.customers.current.toLocaleString('en-EG')}
        percentageChange={metrics.customers.changePercent}
        helpText="vs last period"
        icon={<Users className="h-6 w-6" />}
      />
      <MetricCard
        title="Active Products"
        value={metrics.activeProducts.current.toLocaleString('en-EG')}
        percentageChange={metrics.activeProducts.changePercent}
        helpText="vs last period"
        icon={<Package className="h-6 w-6" />}
      />
    </div>
  )
}

export async function RevenueAndStatusSection () {
  const { dailyRevenue, orderStatus } = await getRevenueAndStatus()

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-full lg:col-span-4">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Daily revenue for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <AreaChart data={dailyRevenue} />
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-3">
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>Current order status distribution</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <PieChart data={orderStatus} />
        </CardContent>
      </Card>
    </div>
  )
}

export async function TablesSection () {
  const { recentOrders, topProducts, topSellers } = await getDashboardTables()

  return (
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
            rows={recentOrders.map((order) => [
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
            rows={topProducts.map((product) => [
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
            rows={topSellers.map((seller) => [
              seller.name,
              String(seller.orders),
              formatCurrency(seller.revenue)
            ])}
            empty="No seller sales yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export async function CategoryAndActivitySection () {
  const { salesByCategory, customerActivity } = await getCategoryAndActivity()

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
          <CardDescription>Top selling categories by revenue (30 days)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <BarChart data={salesByCategory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Activity</CardTitle>
          <CardDescription>New vs returning buyers</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <AreaChart data={customerActivity} isMultiple />
        </CardContent>
      </Card>
    </div>
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
      <CardContent>
        <div className="overflow-x-auto">
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
        </div>
      </CardContent>
    </Card>
  )
}
