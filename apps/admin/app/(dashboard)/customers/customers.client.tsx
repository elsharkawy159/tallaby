"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { ShoppingBag, Store, Users, Wallet } from "lucide-react";
import { KpiCard, KpiGrid, percentOf } from "../_components/cards/kpi-card";
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
      <KpiGrid className="mb-6">
        <KpiCard
          label="Customers"
          value={stats.totalCustomers}
          icon={<Users />}
          today={stats.newCustomersToday}
          hint={`${stats.newCustomersThisMonth.toLocaleString("en-EG")} new this month, ${stats.guestCustomers.toLocaleString("en-EG")} guests`}
        />
        <KpiCard
          label="Came from a seller's store"
          value={stats.customersFromStores}
          icon={<Store />}
          hint={`${percentOf(stats.customersFromStores, stats.buyers)} of buyers, from ${stats.originStoreCount.toLocaleString("en-EG")} ${stats.originStoreCount === 1 ? "store" : "stores"}`}
        />
        <KpiCard
          label="Avg. spend per customer"
          value={formatCurrency(stats.averageSpendPerCustomer)}
          icon={<Wallet />}
          hint={`Across ${stats.buyers.toLocaleString("en-EG")} customers who ordered`}
        />
        <KpiCard
          label="Avg. order value"
          value={formatCurrency(stats.averageOrderValue)}
          icon={<ShoppingBag />}
          hint={`${stats.highValueCustomers.toLocaleString("en-EG")} customers spent over EGP 1,000`}
        />
      </KpiGrid>

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
