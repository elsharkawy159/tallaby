"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Separator } from "@workspace/ui/components/separator";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Globe,
  Package,
  User,
} from "lucide-react";
import type { PendingCart } from "../pending-carts.types";
import {
  formatCurrency,
  formatDate,
  formatVariant,
  getCustomerEmail,
  getCustomerInitials,
  getCustomerName,
} from "../pending-carts.lib";

interface CartQuickViewDialogProps {
  cart: PendingCart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartQuickViewDialog({
  cart,
  open,
  onOpenChange,
}: CartQuickViewDialogProps) {
  if (!open || !cart) return null;

  const customerName = getCustomerName(cart);
  const customerEmail = getCustomerEmail(cart);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cart Details</DialogTitle>
          <DialogDescription>
            Full cart contents and customer info for analytics and outreach
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{cart.status}</Badge>
            {cart.isAbandoned && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Abandoned
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {cart.id}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Items</p>
              <p className="font-medium">{cart.itemCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Value</p>
              <p className="font-medium">{formatCurrency(cart.totalValue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">{cart.currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Session</p>
              <p className="font-medium truncate" title={cart.sessionId ?? undefined}>
                {cart.sessionId ? cart.sessionId.slice(0, 12) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(cart.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated</p>
              <p className="font-medium">{formatDate(cart.updatedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last activity</p>
              <p className="font-medium">{formatDate(cart.lastActivity)}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Customer</h4>
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                {cart.user?.avatarUrl && (
                  <AvatarImage
                    src={cart.user.avatarUrl}
                    alt={customerName}
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getCustomerInitials(cart)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{customerName}</h3>
                  {cart.user?.isGuest ? (
                    <Badge variant="outline">Guest</Badge>
                  ) : (
                    <Badge variant="secondary">Registered</Badge>
                  )}
                  {cart.user?.receiveMarketingEmails ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Marketing opted in
                    </Badge>
                  ) : (
                    <Badge variant="outline">Marketing opted out</Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {cart.user?.email ? (
                      <a
                        href={`mailto:${cart.user.email}`}
                        className="hover:underline"
                      >
                        {customerEmail}
                      </a>
                    ) : (
                      <span>{customerEmail}</span>
                    )}
                  </div>
                  {cart.user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${cart.user.phone}`}
                        className="hover:underline"
                      >
                        {cart.user.phone}
                      </a>
                    </div>
                  )}
                  {cart.user?.preferredLanguage && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{cart.user.preferredLanguage.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{cart.userId}</span>
                  </div>
                </div>
                {cart.user?.id && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/customers/${cart.user.id}`}>
                      View customer profile
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <h4 className="font-semibold text-sm">
                Cart items ({cart.items.length})
              </h4>
            </div>

            {cart.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">This cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const variantLabel = formatVariant(item.variant);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 border rounded-lg"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-muted">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productTitle}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.productTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.sellerName}
                              {item.productSku ? ` · SKU ${item.productSku}` : ""}
                            </p>
                          </div>
                          <p className="font-medium whitespace-nowrap">
                            {formatCurrency(item.lineTotal)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {item.quantity} × {formatCurrency(item.price)}
                          </span>
                          {variantLabel && (
                            <Badge variant="outline" className="font-normal">
                              {variantLabel}
                            </Badge>
                          )}
                          {item.savedForLater && (
                            <Badge variant="secondary">Saved for later</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Added {formatDate(item.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatDate(item.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
