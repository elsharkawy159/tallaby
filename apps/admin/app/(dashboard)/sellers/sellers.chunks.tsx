"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
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
  Star,
  MoreHorizontal,
  Store,
  Users,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import type { Seller, SellerStatus } from "./sellers.types";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  getRatingDisplay,
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
        <AvatarImage src={seller.logoUrl} />
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
        <StatusBadge status={seller.status} />

        <div className="text-right">
          <div className="text-sm font-medium">
            {seller.productCount} products
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
              <Link href={`/sellers/${seller.id}`} className="w-full">
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sellers/${seller.id}/edit`} className="w-full">
                Edit seller
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/sellers/${seller.id}/products`} className="w-full">
                View products
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sellers/${seller.id}/orders`} className="w-full">
                View orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sellers/${seller.id}/payouts`} className="w-full">
                Manage payouts
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

interface SellerRowProps {
  seller: Seller;
  onAction?: (sellerId: string, action: string) => void;
}

export const SellerRow = ({ seller, onAction }: SellerRowProps) => {
  const handleAction = (action: string) => {
    onAction?.(seller.id, action);
  };

  return (
    <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={seller.logoUrl} />
            <AvatarFallback>{getInitials(seller.businessName)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/sellers/${seller.id}`}
              className="font-medium hover:underline"
            >
              {seller.businessName}
            </Link>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {seller.displayName}
              {seller.isVerified && (
                <CheckCircle className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 text-center">
        <StatusBadge status={seller.status} />
      </td>

      <td className="py-4 px-4 text-center">{seller.productCount}</td>

      <td className="py-4 px-4 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 font-medium">{getRatingDisplay(seller)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {seller.totalRatings} reviews
          </div>
        </div>
      </td>

      <td className="py-4 px-4 text-center">{seller.commissionRate}%</td>

      <td className="py-4 px-4 text-right font-medium">
        {formatCurrency(seller.walletBalance)}
      </td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {canApproveSeller(seller) && (
            <Button
              size="sm"
              onClick={() => handleAction("approve")}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          )}

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
                <Link href={`/sellers/${seller.id}`} className="w-full">
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sellers/${seller.id}/edit`} className="w-full">
                  Edit seller
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/sellers/${seller.id}/products`}
                  className="w-full"
                >
                  View products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sellers/${seller.id}/orders`} className="w-full">
                  View orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sellers/${seller.id}/payouts`} className="w-full">
                  Manage payouts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

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
      </td>
    </tr>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

export const StatsCard = ({ title, value, subtitle, icon }: StatsCardProps) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div className="p-6">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  </div>
);

export const SellerStatsCards = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
    <StatsCard
      title="Total Sellers"
      value={stats.totalSellers}
      subtitle="+2 from last month"
      icon={<Store className="h-4 w-4 text-gray-500" />}
    />
    <StatsCard
      title="Active Sellers"
      value={stats.activeSellers}
      subtitle={`${Math.round((stats.activeSellers / stats.totalSellers) * 100)}% of total`}
      icon={<Users className="h-4 w-4 text-gray-500" />}
    />
    <StatsCard
      title="Total Products"
      value={stats.totalProducts}
      subtitle="Across all sellers"
      icon={<ShoppingCart className="h-4 w-4 text-gray-500" />}
    />
    <StatsCard
      title="Revenue Generated"
      value={formatCurrency(stats.totalRevenue)}
      subtitle="Total seller sales"
      icon={<CreditCard className="h-4 w-4 text-gray-500" />}
    />
  </div>
);
