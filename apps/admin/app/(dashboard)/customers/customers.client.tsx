"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Users } from "lucide-react";
import {
  customersFilters,
  getCustomersColumns,
} from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import {
  CUSTOMERS_DEFAULT_SORT,
  CUSTOMERS_VIEW_PARAM,
} from "./customers.params";
import type { Customer, CustomerStats } from "./customers.types";
import { formatCurrency } from "./customers.lib";
import { CustomerQuickViewDialog } from "./_components/customer-quick-view-dialog";

interface CustomersContentProps {
  customers: Customer[];
  totalCount: number;
  stats: CustomerStats;
}

export function CustomersContent({
  customers,
  totalCount,
  stats,
}: CustomersContentProps) {
  const url = useTableUrlState();
  const activeView = url.get(CUSTOMERS_VIEW_PARAM) || "all";
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const columns = useMemo(
    () => getCustomersColumns({ onQuickView: setSelectedCustomer }),
    []
  );

  return (
    <>
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
            <p className="text-xs text-muted-foreground">
              Lifetime value per buying customer
            </p>
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

      <Tabs
        value={activeView}
        onValueChange={(value) =>
          url.setParams({
            [CUSTOMERS_VIEW_PARAM]: value === "all" ? null : value,
          })
        }
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">
            All Customers ({stats.totalCustomers.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="high-value">
            High Value ({stats.highValueCustomers.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="new">
            New · 30 days ({stats.newCustomersRecent.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="unverified">
            Unverified ({stats.unverifiedCustomers.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({stats.suspendedCustomers.toLocaleString()})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={customers}
          getRowId={(customer) => customer.id}
          filterableColumns={customersFilters}
          emptyMessage="No customers match these filters."
          serverSide={{
            rowCount: totalCount,
            defaultSort: CUSTOMERS_DEFAULT_SORT,
            searchPlaceholder: "Search name, email or phone…",
          }}
        />
      </div>

      {/* Quick View Dialog */}
      <CustomerQuickViewDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onOpenChange={() => setSelectedCustomer(null)}
      />
    </>
  );
}
