"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";
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
  ArrowLeft,
  Shield,
  Hash,
  Languages,
  Coins,
  Megaphone,
  Link2,
  Building2,
} from "lucide-react";
import Link from "next/link";
import type { CustomerWithDetails } from "../customers.types";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getCustomerInitials,
  getCustomerFullName,
  getCustomerDisplayName,
  getCustomerDisplayPhone,
  getRoleBadgeVariant,
} from "../customers.lib";
import { CustomerOrdersList } from "./_components/customer-orders-list";
import type { CustomerOrder } from "./customer-profile.types";

interface CustomerProfileContentProps {
  customer: CustomerWithDetails;
}

function yesNo(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

export function CustomerProfileContent({
  customer,
}: CustomerProfileContentProps) {
  const displayName = getCustomerDisplayName(customer);
  const fullName = getCustomerFullName(customer);
  const initials = getCustomerInitials(customer);
  const displayPhone = getCustomerDisplayPhone(customer);

  const orders: CustomerOrder[] = (customer.orders || []).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              {customer.avatarUrl && (
                <AvatarImage src={customer.avatarUrl} alt={fullName} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold">{displayName}</h1>
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
                <Badge
                  variant={getRoleBadgeVariant(customer.role || "customer")}
                >
                  {customer.role || "customer"}
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
                {customer.isAvailable === false && (
                  <Badge variant="secondary">Unavailable</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-gray-500" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.stats?.totalOrders || customer.totalOrders || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                Number(customer.stats?.totalSpent || customer.totalSpent || 0),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.stats?.averageOrderValue
                ? formatCurrency(Number(customer.stats.averageOrderValue))
                : (customer.totalOrders ?? 0) > 0
                  ? formatCurrency(
                      Number(customer.totalSpent || 0) /
                        Number(customer.totalOrders || 1),
                    )
                  : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:underline"
                >
                  {customer.email}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            {displayPhone ? (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <a href={`tel:${displayPhone}`} className="hover:underline">
                  {displayPhone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span>—</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Joined:</span>
              <span>{formatDateShort(customer.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Login:</span>
              <span>
                {customer.lastLoginAt
                  ? formatDateShort(customer.lastLoginAt)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Timezone:</span>
              <span>{customer.timezone || "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account & Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm md:col-span-2">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground shrink-0">User ID:</span>
              <code className="font-mono text-xs break-all">{customer.id}</code>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Full name:</span>
              <span>{customer.fullName || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Language:</span>
              <span>{customer.preferredLanguage || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Currency:</span>
              <span>{customer.defaultCurrency || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Referral code:</span>
              <span className="font-mono text-xs">
                {customer.referralCode || "—"}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground shrink-0">
                Referred by:
              </span>
              {customer.referredBy ? (
                <code className="font-mono text-xs break-all">
                  {customer.referredBy}
                </code>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Marketing emails:</span>
              <span>{yesNo(customer.receiveMarketingEmails)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">2FA:</span>
              <span>
                {yesNo(customer.hasTwoFactorAuth)}
                {customer.hasTwoFactorAuth && customer.twoFactorMethod
                  ? ` (${customer.twoFactorMethod})`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Available:</span>
              <span>{yesNo(customer.isAvailable)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>
                {customer.createdAt ? formatDate(customer.createdAt) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span>
                {customer.updatedAt ? formatDate(customer.updatedAt) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {!customer.addresses || customer.addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No addresses on file for this customer.
            </div>
          ) : (
            <div className="space-y-4">
              {customer.addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{address.fullName}</span>
                        {address.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {address.addressType || "both"}
                        </Badge>
                        {address.isBusinessAddress && (
                          <Badge variant="outline" className="text-xs">
                            Business
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {address.company && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {address.company}
                          </div>
                        )}
                        <div>{address.phone}</div>
                        <div>
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </div>
                        <div>
                          {address.city}, {address.state} {address.postalCode}
                        </div>
                        <div>{address.country}</div>
                        {address.deliveryInstructions && (
                          <div>
                            <span className="font-medium text-foreground">
                              Delivery instructions:{" "}
                            </span>
                            {address.deliveryInstructions}
                          </div>
                        )}
                        {address.accessCode && (
                          <div>
                            <span className="font-medium text-foreground">
                              Access code:{" "}
                            </span>
                            <code className="font-mono text-xs">
                              {address.accessCode}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                    <MapsLinkButton
                      type="location"
                      latitude={address.latitude}
                      longitude={address.longitude}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerOrdersList orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
