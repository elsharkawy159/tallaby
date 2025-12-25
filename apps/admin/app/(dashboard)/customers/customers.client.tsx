"use client";

import { useState } from "react";
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
  Users,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getCustomersColumns } from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";
import type { Customer, CustomerStats } from "./customers.types";
import { formatCurrency } from "./customers.lib";
import { CustomerQuickViewDialog } from "./_components/customer-quick-view-dialog";

interface CustomersContentProps {
  customers: Customer[];
  stats: CustomerStats;
}

export function CustomersContent({ customers, stats }: CustomersContentProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const handleQuickView = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const columns = getCustomersColumns({ onQuickView: handleQuickView });

  // Filter customers for different tabs
  const highValueCustomers = customers.filter(
    (customer) => Number(customer.totalSpent) > 1000
  );

  const recentCustomers = [...customers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const unverifiedCustomers = customers.filter(
    (customer) => !customer.isVerified
  );

  const suspendedCustomers = customers.filter(
    (customer) => customer.isSuspended
  );

  return (
    <>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newCustomersThisMonth} new this month
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
            <div className="text-2xl font-bold">{stats.verifiedCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? (
                    (stats.verifiedCustomers / stats.totalCustomers) *
                    100
                  ).toFixed(1)
                : 0}
              % of total
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
              {formatCurrency(stats.averageSpendPerCustomer)}
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
              {formatCurrency(stats.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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
            data={highValueCustomers}
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
            data={recentCustomers}
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
            data={unverifiedCustomers}
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
            data={suspendedCustomers}
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

      {/* Quick View Dialog */}
      <CustomerQuickViewDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onOpenChange={() => setSelectedCustomer(null)}
      />
    </>
  );
}
