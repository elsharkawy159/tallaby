"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { RefreshCw } from "lucide-react";
import type { PendingCartStats } from "./pending-carts.types";
import { formatCurrency } from "./pending-carts.lib";

interface CartStatsCardsProps {
  stats: PendingCartStats;
}

export const CartStatsCards = ({ stats }: CartStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Carts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.activeCarts.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Not ordered yet</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">With Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.withItems.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ready for abandoned-cart outreach
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cart Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.cartValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Sum of active cart line items
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.abandoned.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            No activity for {stats.abandonedDays}+ days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface PendingCartsHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const PendingCartsHeader = ({
  onRefresh,
  isRefreshing = false,
}: PendingCartsHeaderProps) => {
  return (
    <div className="flex items-center justify-end mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
    </div>
  );
};
