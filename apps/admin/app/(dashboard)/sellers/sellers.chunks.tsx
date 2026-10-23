"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  HEARD_ABOUT_US_LABELS,
  type HeardAboutUsSource,
} from "@workspace/lib/sellers";
import { KpiCard, KpiGrid, percentOf } from "../_components/cards/kpi-card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  CheckCircle,
  Clock,
  Ban,
  AlertTriangle,
  MoreHorizontal,
  Users,
  ShoppingCart,
  Gift,
  Globe,
  Megaphone,
} from "lucide-react";
import type { Seller, SellerStatus } from "./sellers.types";
import { customerHref, ordersHref, sellerHref, sellerWalletHref } from "../_components/entity/entity-href.lib";
import type { HeardAboutUsCount, SellerStats } from "./sellers.types";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  getInitials,
  canApproveSeller,
  canSuspendSeller,
  canReactivateSeller,
} from "./sellers.lib";

interface StatusBadgeProps {
  status: SellerStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getIcon = () => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "suspended":
        return <Ban className="h-3 w-3" />;
      case "restricted":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge
      className={`${getStatusColor(status)} px-2 flex items-center gap-1 justify-center`}
    >
      {getIcon()}
      {getStatusLabel(status)}
    </Badge>
  );
};

interface SellerCardProps {
  seller: Seller;
  onAction?: (sellerId: string, action: string) => void;
}

export const SellerCard = ({ seller, onAction }: SellerCardProps) => {
  const handleAction = (action: string) => {
    onAction?.(seller.id, action);
  };

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={seller.logoUrl || undefined} />
        <AvatarFallback>{getInitials(seller.businessName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <Link
          href={`/sellers/${seller.id}`}
          className="font-medium hover:underline block truncate"
        >
          {seller.businessName}
        </Link>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{seller.displayName}</span>
          {seller.isVerified && (
            <CheckCircle className="h-3 w-3 text-blue-500" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusBadge status={seller.status || "pending"} />

        <div className="text-right">
          <div className="text-sm font-medium">
            <Link
              href={`/products?seller=${encodeURIComponent(seller.slug)}`}
              className="hover:underline"
            >
              {seller.productCount} products
            </Link>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(seller.walletBalance)} balance
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={sellerHref(seller.id)} className="w-full">
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={customerHref(seller.id)} className="w-full">
                Owner account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/products?seller=${encodeURIComponent(seller.slug)}`} className="w-full">
                View products
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ordersHref({ seller: seller.id })} className="w-full">
                View orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={sellerWalletHref(seller.id)} className="w-full">
                Store wallet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {canApproveSeller(seller) && (
              <DropdownMenuItem
                onClick={() => handleAction("approve")}
                className="text-green-600"
              >
                Approve seller
              </DropdownMenuItem>
            )}

            {canSuspendSeller(seller) && (
              <DropdownMenuItem
                onClick={() => handleAction("suspend")}
                className="text-red-600"
              >
                Suspend seller
              </DropdownMenuItem>
            )}

            {canReactivateSeller(seller) && (
              <DropdownMenuItem
                onClick={() => handleAction("reactivate")}
                className="text-green-600"
              >
                Reactivate seller
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

/** Header KPIs of the sellers directory, plus where sellers heard about us. */
export const SellerStatsCards = ({ stats }: { stats: SellerStats }) => (
  <div className="space-y-4">
    <KpiGrid>
      <KpiCard
        label="Sellers"
        value={stats.totalSellers}
        icon={<Users />}
        today={stats.newSellersToday}
        hint={`${stats.newSellersThisMonth.toLocaleString("en-EG")} new this month`}
      />
      <KpiCard
        label="Website published"
        value={stats.sellersWithPublishedSite}
        icon={<Globe />}
        hint={`${percentOf(stats.sellersWithPublishedSite, stats.totalSellers)} of sellers, ${stats.totalStores.toLocaleString("en-EG")} stores in total`}
      />
      <KpiCard
        label="Selling (last 30 days)"
        value={stats.sellersSellingLast30Days}
        icon={<ShoppingCart />}
        hint={`${percentOf(stats.sellersSellingLast30Days, stats.totalSellers)} of sellers got an order`}
      />
      <KpiCard
        label="In free trial"
        value={stats.sellersInTrial}
        icon={<Gift />}
        hint={
          stats.negativeWallets > 0
            ? `${stats.negativeWallets.toLocaleString("en-EG")} with a negative wallet`
            : "No negative wallets"
        }
      />
    </KpiGrid>
    <HeardAboutUsBreakdown counts={stats.heardAboutUs} />
  </div>
);

/**
 * Ranked bars of the "where did you hear about us" answers (0099). One hue:
 * the job is comparing channel sizes, so length carries it and every bar is
 * labelled. A row filters the table to that source.
 */
export const HeardAboutUsBreakdown = ({ counts }: { counts: HeardAboutUsCount[] }) => {
  const channels = counts
    .filter((row): row is HeardAboutUsCount & { source: HeardAboutUsSource } => row.source !== "unknown")
    .sort((a, b) => b.count - a.count);
  const answered = channels.reduce((sum, row) => sum + row.count, 0);
  const unanswered = counts.find((row) => row.source === "unknown")?.count ?? 0;
  const max = Math.max(1, ...channels.map((row) => row.count));

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="size-4 text-primary" aria-hidden />
          Where sellers heard about us
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {answered > 0
            ? `${answered.toLocaleString("en-EG")} answered, ${unanswered.toLocaleString("en-EG")} not yet. Select a channel to list its sellers.`
            : "No answers yet. Sellers are asked once, the next time they open their dashboard."}
        </p>
      </CardHeader>
      {answered > 0 && (
        <CardContent className="px-5">
          <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
            {channels.map((row) => {
              const share = row.count / answered;
              return (
                <li key={row.source}>
                  <Link
                    href={`/sellers?source=${row.source}`}
                    title={`${HEARD_ABOUT_US_LABELS[row.source]}: ${row.count} sellers (${Math.round(share * 100)}%)`}
                    className="group grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 rounded-md py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate group-hover:underline">{HEARD_ABOUT_US_LABELS[row.source]}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${(row.count / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-end tabular-nums text-muted-foreground">
                      <span className="font-medium text-foreground">{row.count.toLocaleString("en-EG")}</span>{" "}
                      {Math.round(share * 100)}%
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  );
};
