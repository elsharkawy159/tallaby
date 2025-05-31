"use client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getCustomersColumns } from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";

// Mock data for demonstration
const customers = [
  {
    id: "cust_01",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 12,
    totalSpent: 1250.75,
    lastOrderDate: "2023-10-05T14:30:00Z",
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "cust_02",
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@example.com",
    phone: "+1 (555) 234-5678",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 8,
    totalSpent: 876.5,
    lastOrderDate: "2023-10-12T11:45:00Z",
    createdAt: "2023-02-20T15:45:00Z",
  },
  {
    id: "cust_03",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@example.com",
    phone: "+1 (555) 345-6789",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 5,
    totalSpent: 450.25,
    lastOrderDate: "2023-09-28T09:15:00Z",
    createdAt: "2023-03-10T09:15:00Z",
  },
  {
    id: "cust_04",
    firstName: "Sarah",
    lastName: "Davis",
    email: "sarah.davis@example.com",
    phone: "+1 (555) 456-7890",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 15,
    totalSpent: 1875.2,
    lastOrderDate: "2023-10-15T16:20:00Z",
    createdAt: "2023-01-05T14:20:00Z",
  },
  {
    id: "cust_05",
    firstName: "Robert",
    lastName: "Wilson",
    email: "robert.wilson@example.com",
    phone: "+1 (555) 567-8901",
    role: "customer",
    isVerified: false,
    isSuspended: false,
    totalOrders: 1,
    totalSpent: 89.99,
    lastOrderDate: "2023-10-10T13:10:00Z",
    createdAt: "2023-09-30T11:50:00Z",
  },
  {
    id: "cust_06",
    firstName: "Jennifer",
    lastName: "Lee",
    email: "jennifer.lee@example.com",
    phone: "+1 (555) 678-9012",
    role: "seller",
    isVerified: true,
    isSuspended: false,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    createdAt: "2023-05-18T16:30:00Z",
  },
  {
    id: "cust_07",
    firstName: "David",
    lastName: "Garcia",
    email: "david.garcia@example.com",
    phone: "+1 (555) 789-0123",
    role: "customer",
    isVerified: true,
    isSuspended: true,
    totalOrders: 4,
    totalSpent: 356.75,
    lastOrderDate: "2023-08-15T10:25:00Z",
    createdAt: "2023-04-22T13:25:00Z",
  },
  {
    id: "cust_08",
    firstName: "Lisa",
    lastName: "Martinez",
    email: "lisa.martinez@example.com",
    phone: "+1 (555) 890-1234",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 9,
    totalSpent: 1120.45,
    lastOrderDate: "2023-10-08T12:15:00Z",
    createdAt: "2023-02-10T10:15:00Z",
  },
  {
    id: "cust_09",
    firstName: "Kevin",
    lastName: "Thompson",
    email: "kevin.thompson@example.com",
    phone: "+1 (555) 901-2345",
    role: "customer",
    isVerified: true,
    isSuspended: false,
    totalOrders: 6,
    totalSpent: 789.3,
    lastOrderDate: "2023-09-25T15:40:00Z",
    createdAt: "2023-03-15T17:40:00Z",
  },
  {
    id: "cust_10",
    firstName: "Karen",
    lastName: "Robinson",
    email: "karen.robinson@example.com",
    phone: "+1 (555) 012-3456",
    role: "admin",
    isVerified: true,
    isSuspended: false,
    totalOrders: 2,
    totalSpent: 245.99,
    lastOrderDate: "2023-07-18T14:50:00Z",
    createdAt: "2023-06-05T12:50:00Z",
  },
];

export default function CustomersPage() {
  const columns = getCustomersColumns();

  // Calculate customer metrics
  const totalCustomers = customers.length;
  const verifiedCustomers = customers.filter((c) => c.isVerified).length;
  const suspendedCustomers = customers.filter((c) => c.isSuspended).length;
  const newCustomersThisMonth = customers.filter((c) => {
    const createdDate = new Date(c.createdAt);
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );
  const averageOrderValue =
    totalRevenue /
    customers.reduce((sum, customer) => sum + customer.totalOrders, 0);

  return (
    <>
      {/* <DashboardShell> */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/customers/create">
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {newCustomersThisMonth} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((verifiedCustomers / totalCustomers) * 100).toFixed(1)}% of
              total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Spend per Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalRevenue / totalCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-customers">
        <TabsList>
          <TabsTrigger value="all-customers">All Customers</TabsTrigger>
          <TabsTrigger value="high-value">High Value</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="unverified">Unverified</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
        <TabsContent value="all-customers" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={customers}
            filterableColumns={[
              {
                id: "role",
                title: "Role",
                options: [
                  { label: "Customer", value: "customer" },
                  { label: "Seller", value: "seller" },
                  { label: "Admin", value: "admin" },
                  { label: "Support", value: "support" },
                ],
              },
              {
                id: "isVerified",
                title: "Status",
                options: [
                  { label: "Verified", value: "true" },
                  { label: "Unverified", value: "false" },
                ],
              },
            ]}
            searchableColumns={[
              {
                id: "firstName",
                title: "First Name",
              },
              {
                id: "lastName",
                title: "Last Name",
              },
              {
                id: "email",
                title: "Email",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="high-value" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={customers.filter((customer) => customer.totalSpent > 1000)}
            searchableColumns={[
              {
                id: "firstName",
                title: "First Name",
              },
              {
                id: "lastName",
                title: "Last Name",
              },
              {
                id: "email",
                title: "Email",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="recent" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={[...customers]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 5)}
            searchableColumns={[
              {
                id: "firstName",
                title: "First Name",
              },
              {
                id: "lastName",
                title: "Last Name",
              },
              {
                id: "email",
                title: "Email",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="unverified" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={customers.filter((customer) => !customer.isVerified)}
            searchableColumns={[
              {
                id: "firstName",
                title: "First Name",
              },
              {
                id: "lastName",
                title: "Last Name",
              },
              {
                id: "email",
                title: "Email",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="suspended" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={customers.filter((customer) => customer.isSuspended)}
            searchableColumns={[
              {
                id: "firstName",
                title: "First Name",
              },
              {
                id: "lastName",
                title: "Last Name",
              },
              {
                id: "email",
                title: "Email",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
      {/* </DashboardShell> */}
    </>
  );
}
