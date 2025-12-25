"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar";
import { Separator } from "@workspace/ui/components/separator";
import {
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  User,
  Globe,
  Clock,
} from "lucide-react";
import type { Customer } from "../customers.types";
import {
  formatCurrency,
  formatDateShort,
  getCustomerInitials,
  getCustomerFullName,
  getRoleBadgeVariant,
} from "../customers.lib";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

interface CustomerQuickViewDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerQuickViewDialog({
  customer,
  open,
  onOpenChange,
}: CustomerQuickViewDialogProps) {
  if (!open || !customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            View customer profile and order history
          </DialogDescription>
        </DialogHeader>

        {customer ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                {customer.avatarUrl && (
                  <AvatarImage
                    src={customer.avatarUrl}
                    alt={getCustomerFullName(customer)}
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getCustomerInitials(customer)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-semibold">
                    {getCustomerFullName(customer)}
                  </h3>
                  {customer.isSuspended && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {!customer.isVerified && !customer.isSuspended && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  {customer.isVerified && !customer.isSuspended && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getRoleBadgeVariant(customer.role)}>
                    {customer.role}
                  </Badge>
                  {customer.isVerified && (
                    <Badge variant="outline" className="text-green-600">
                      Verified
                    </Badge>
                  )}
                  {customer.isSuspended && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                  {customer.isGuest && <Badge variant="outline">Guest</Badge>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <a
                    href={`mailto:${customer.email}`}
                    className="hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span>{formatDateShort(customer.createdAt)}</span>
                </div>
                {customer.lastLoginAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Login:</span>
                    <span>{formatDateShort(customer.lastLoginAt)}</span>
                  </div>
                )}
                {customer.timezone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timezone:</span>
                    <span>{customer.timezone}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Order Statistics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Order Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total Orders
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {customer.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total Spent
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(customer.totalSpent) || 0)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Avg. Order Value
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {customer.totalOrders > 0
                      ? formatCurrency(
                          Number(customer.totalSpent || 0) /
                            Number(customer.totalOrders || 1)
                        )
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>
              {customer.lastOrderDate && (
                <div className="text-sm text-muted-foreground">
                  Last order: {formatDateShort(customer.lastOrderDate)}
                </div>
              )}
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex gap-2">
              <Link href={`/customers/${customer.id}`}>
                <Button variant="outline">View Full Profile</Button>
              </Link>
              <Link href={`/customers/${customer.id}/orders`}>
                <Button variant="outline">View Orders</Button>
              </Link>
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="outline">Edit Customer</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Customer not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
