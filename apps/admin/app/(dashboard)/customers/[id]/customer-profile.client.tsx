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
  MapPin,
  ExternalLink,
  ArrowLeft,
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
import { Separator } from "@workspace/ui/components/separator";
import { CustomerOrdersList } from "./_components/customer-orders-list";

interface CustomerProfileContentProps {
  customer: CustomerWithDetails;
}

export function CustomerProfileContent({
  customer,
}: CustomerProfileContentProps) {
  const displayName = getCustomerDisplayName(customer);
  const fullName = getCustomerFullName(customer);
  const initials = getCustomerInitials(customer);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Stats Cards */}
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
                Number(customer.stats?.totalSpent || customer.totalSpent || 0)
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
                : customer.totalOrders > 0
                  ? formatCurrency(
                      Number(customer.totalSpent || 0) /
                        Number(customer.totalOrders || 1)
                    )
                  : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <a href={`mailto:${customer.email}`} className="hover:underline">
                {customer.email}
              </a>
            </div>
            {(() => {
              const displayPhone = getCustomerDisplayPhone(customer);
              return displayPhone ? (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <a href={`tel:${displayPhone}`} className="hover:underline">
                    {displayPhone}
                  </a>
                </div>
              ) : null;
            })()}
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
        </CardContent>
      </Card>

      {/* Addresses */}
      {customer.addresses && customer.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customer.addresses.map((address) => {
                const googleMapsUrl =
                  address.latitude && address.longitude
                    ? `https://www.google.com/maps?q=${address.latitude},${address.longitude}`
                    : null;

                return (
                  <div
                    key={address.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {address.fullName}
                          </span>
                          {address.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {address.addressType}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{address.phone}</div>
                          <div>
                            {address.addressLine1}
                            {address.addressLine2 &&
                              `, ${address.addressLine2}`}
                          </div>
                          <div>
                            {address.city}, {address.state} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                        </div>
                      </div>
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>View on Map</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerOrdersList orders={customer.orders || []} />
        </CardContent>
      </Card>
    </div>
  );
}
