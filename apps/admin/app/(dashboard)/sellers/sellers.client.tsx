"use client";

import { useState, useTransition, Suspense } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Filter, Download, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { updateSellerStatus } from "./sellers.server";
import { getStatusOptions, getBusinessTypeOptions } from "./sellers.lib";
import type { SellerFilters, SellerStats, SellerStatus } from "./sellers.types";
import { SellersDataWrapper } from "./sellers.data";
import { SellersTableSkeleton } from "./sellers.skeleton";

interface SellersFiltersProps {
  filters: SellerFilters;
  onFiltersChange: (filters: SellerFilters) => void;
}

export const SellersFilters = ({
  filters,
  onFiltersChange,
}: SellersFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (
    key: keyof SellerFilters,
    value: string | boolean | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sellers..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 bg-blue-500 rounded-full" />
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || ""}
              onValueChange={(value) =>
                handleFilterChange("status", value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {getStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business Type</label>
            <Select
              value={filters.businessType || ""}
              onValueChange={(value) =>
                handleFilterChange("businessType", value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {getBusinessTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Verification</label>
            <Select
              value={filters.isVerified?.toString() || ""}
              onValueChange={(value) =>
                handleFilterChange(
                  "isVerified",
                  value === "true"
                    ? true
                    : value === "false"
                      ? false
                      : undefined
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All sellers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sellers</SelectItem>
                <SelectItem value="true">Verified only</SelectItem>
                <SelectItem value="false">Unverified only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

interface SellersActionsProps {
  onAction: (sellerId: string, action: string) => void;
}

export const SellersActions = ({ onAction }: SellersActionsProps) => {
  const [isPending, startTransition] = useTransition();

  const handleAction = (sellerId: string, action: string) => {
    startTransition(async () => {
      try {
        let status: SellerStatus;
        switch (action) {
          case "approve":
            status = "approved";
            break;
          case "suspend":
            status = "suspended";
            break;
          case "reactivate":
            status = "approved";
            break;
          default:
            toast.error("Invalid action");
            return;
        }

        const result = await updateSellerStatus(sellerId, status);

        if (result.success) {
          toast.success(result.message);
          onAction(sellerId, action);
        } else {
          toast.error(result.error || "Failed to update seller status");
        }
      } catch (error) {
        console.error("Error updating seller status:", error);
        toast.error("Something went wrong");
      }
    });
  };

  return { handleAction, isPending };
};

interface SellersTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: SellerStats;
}

export const SellersTabs = ({
  activeTab,
  onTabChange,
  stats,
}: SellersTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="all">
          All Sellers ({stats.totalSellers})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({stats.activeSellers})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({stats.pendingSellers})
        </TabsTrigger>
        <TabsTrigger value="suspended">
          Suspended ({stats.suspendedSellers})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

interface SellersHeaderProps {
  onFiltersChange: (filters: SellerFilters) => void;
}

export const SellersHeader = ({ onFiltersChange }: SellersHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sellers</h1>
        <p className="text-muted-foreground">
          Manage marketplace sellers and their accounts
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Seller
        </Button>
      </div>
    </div>
  );
};

// Client wrapper component to handle state management
interface SellersClientWrapperProps {
  initialFilters: SellerFilters;
  initialStats: SellerStats;
}

export const SellersClientWrapper = ({
  initialFilters,
  initialStats,
}: SellersClientWrapperProps) => {
  const [filters, setFilters] = useState<SellerFilters>(initialFilters);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  const handleFiltersChange = (newFilters: SellerFilters) => {
    setFilters(newFilters);
    // Update URL params here if needed
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update filters based on tab
    const tabFilters: SellerFilters = {};
    if (tab === "approved") tabFilters.status = "approved";
    else if (tab === "pending") tabFilters.status = "pending";
    else if (tab === "suspended") tabFilters.status = "suspended";

    setFilters({ ...filters, ...tabFilters });
  };

  const handleAction = (sellerId: string, action: string) => {
    startTransition(async () => {
      try {
        let status: SellerStatus;
        switch (action) {
          case "approve":
            status = "approved";
            break;
          case "suspend":
            status = "suspended";
            break;
          case "reactivate":
            status = "approved";
            break;
          default:
            toast.error("Invalid action");
            return;
        }

        const result = await updateSellerStatus(sellerId, status);

        if (result.success) {
          toast.success(result.message);
          // Trigger a page refresh to update the data
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to update seller status");
        }
      } catch (error) {
        console.error("Error updating seller status:", error);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-6">
      <SellersHeader onFiltersChange={handleFiltersChange} />

      <SellersFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <SellersTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        stats={stats}
      />

      {/* Render the data component with action handler */}
      <Suspense fallback={<SellersTableSkeleton />}>
        <SellersDataWrapper filters={filters} onAction={handleAction} />
      </Suspense>
    </div>
  );
};
