"use client";

import { useState } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  CallButton,
  EmailButton,
  WhatsAppButton,
} from "@workspace/ui/components/contact-buttons";
import { buildWhatsAppUrl } from "@workspace/ui/lib/contact";
import {
  BellRing,
  Calendar,
  CheckCheck,
  Clock,
  Globe,
  Mail,
  Package,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { markCartReminded } from "@/actions/pending-carts";
import { getPublicUrl } from "@/lib/utils";
import { getStorefrontProductUrl } from "../../products/products.lib";
import type { PendingCart, PendingCartItem } from "../pending-carts.types";
import {
  buildCartReminderMessage,
  formatCurrency,
  formatDate,
  getCartContactPhone,
  getContactEmail,
  getCustomerEmail,
  getCustomerInitials,
  getCustomerName,
  parseVariantOption,
} from "../pending-carts.lib";

function resolveProductImageUrl(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return getPublicUrl(image, "products");
}

interface CartQuickViewDialogProps {
  cart: PendingCart | null;
  open: boolean;
  isLoadingItems?: boolean;
  onOpenChange: (open: boolean) => void;
  onReminded?: (cartId: string, reminderSentAt: string | null) => void;
}

export function CartQuickViewDialog({
  cart,
  open,
  isLoadingItems = false,
  onOpenChange,
  onReminded,
}: CartQuickViewDialogProps) {
  if (!open || !cart) return null;

  const customerName = getCustomerName(cart);
  const customerEmail = getCustomerEmail(cart);
  const contactEmail = getContactEmail(cart);
  const contactPhone = getCartContactPhone(cart);

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
            {cart.reminderSentAt && (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCheck className="mr-1 h-3 w-3" />
                Reminded {formatDate(cart.reminderSentAt)}
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
              <div className="flex-1 min-w-0 space-y-3">
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
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{customerEmail}</span>
                  </div>
                  {contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{contactPhone}</span>
                      {!cart.user?.phone && (
                        <span className="text-xs text-muted-foreground">
                          (from address)
                        </span>
                      )}
                    </div>
                  )}
                  {cart.user?.preferredLanguage && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{cart.user.preferredLanguage.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-xs truncate">{cart.userId}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ReminderButton
                    cart={cart}
                    phone={contactPhone}
                    isLoadingItems={isLoadingItems}
                    onReminded={onReminded}
                  />
                  <WhatsAppButton phone={contactPhone} />
                  <CallButton phone={contactPhone} />
                  {contactEmail ? (
                    <EmailButton email={contactEmail} />
                  ) : (
                    <Button variant="outline" size="sm" disabled title="No email on file">
                      <Mail className="size-4" />
                      Email
                    </Button>
                  )}
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
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <h4 className="font-semibold text-sm">
                Cart items ({isLoadingItems ? "…" : cart.items.length})
              </h4>
            </div>

            {isLoadingItems ? (
              <p className="text-sm text-muted-foreground">Loading items…</p>
            ) : cart.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">This cart is empty.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReminderButton({
  cart,
  phone,
  isLoadingItems,
  onReminded,
}: {
  cart: PendingCart;
  phone: string | null;
  isLoadingItems: boolean;
  onReminded?: (cartId: string, reminderSentAt: string | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const whatsAppUrl = buildWhatsAppUrl(phone);

  const disabledReason = cart.reminderSentAt
    ? `Reminder already sent on ${formatDate(cart.reminderSentAt)}`
    : !whatsAppUrl
      ? "No valid WhatsApp number for this customer"
      : isLoadingItems
        ? "Loading cart items…"
        : cart.items.length === 0
          ? "This cart is empty"
          : null;

  const handleSend = async () => {
    const url = buildWhatsAppUrl(phone, buildCartReminderMessage(cart));
    if (!url) return;

    // Open synchronously inside the click so the popup isn't blocked.
    window.open(url, "_blank", "noopener,noreferrer");

    setIsSaving(true);
    try {
      const result = await markCartReminded(cart.id);
      if (result.success) {
        toast.success("Reminder marked as sent");
        onReminded?.(cart.id, result.reminderSentAt ?? new Date().toISOString());
      } else if ("alreadyReminded" in result && result.alreadyReminded) {
        toast.info("Another admin already reminded this customer");
        onReminded?.(cart.id, result.reminderSentAt ?? null);
      } else {
        toast.error(result.error || "Failed to record the reminder");
      }
    } catch {
      toast.error("Failed to record the reminder");
    } finally {
      setIsSaving(false);
    }
  };

  const button = (
    <Button
      size="sm"
      onClick={handleSend}
      disabled={Boolean(disabledReason) || isSaving}
      className="bg-[#25D366] text-white hover:bg-[#1ebe5b] disabled:bg-muted disabled:text-muted-foreground"
    >
      {cart.reminderSentAt ? (
        <>
          <CheckCheck className="mr-2 h-4 w-4" />
          Reminded
        </>
      ) : (
        <>
          <BellRing className="mr-2 h-4 w-4" />
          {isSaving ? "Saving…" : "Send WhatsApp reminder"}
        </>
      )}
    </Button>
  );

  if (!disabledReason) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Disabled buttons swallow pointer events; the span keeps the tooltip. */}
        <span tabIndex={0} className="inline-flex">
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function CartItemRow({ item }: { item: PendingCartItem }) {
  const imageSrc = resolveProductImageUrl(item.productImage);
  const storefrontUrl = getStorefrontProductUrl(item.productSlug);
  const sku = item.variantSku ?? item.productSku;
  const showVariantTitle =
    item.variantTitle && item.variantTitle !== item.productTitle;

  const thumbnail = imageSrc ? (
    <Image
      src={imageSrc}
      alt={item.variantTitle ?? item.productTitle}
      fill
      className="object-cover"
      sizes="64px"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <Package className="h-5 w-5 text-muted-foreground" />
    </div>
  );

  return (
    <li className="flex gap-3 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {storefrontUrl ? (
          <Link
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-full w-full"
            aria-label={`View ${item.productTitle} on storefront`}
          >
            {thumbnail}
          </Link>
        ) : (
          thumbnail
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {storefrontUrl ? (
              <Link
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-medium hover:underline"
                title={item.productTitle}
              >
                {item.productTitle}
              </Link>
            ) : (
              <p className="truncate font-medium" title={item.productTitle}>
                {item.productTitle}
              </p>
            )}
            {showVariantTitle && (
              <p
                className="truncate text-sm text-muted-foreground"
                title={item.variantTitle ?? undefined}
              >
                {item.variantTitle}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {item.quantity} × {formatCurrency(item.price)}
            </p>
          </div>
        </div>

        {(item.variantOptions.length > 0 || item.savedForLater) && (
          <div className="flex flex-wrap gap-1.5">
            {item.variantOptions.map((option) => {
              const { name, value } = parseVariantOption(option);
              return (
                <Badge
                  key={option}
                  variant="outline"
                  className="max-w-full font-normal"
                  title={option}
                >
                  {name && (
                    <span className="text-muted-foreground">{name}:&nbsp;</span>
                  )}
                  <span className="truncate">{value}</span>
                </Badge>
              );
            })}
            {item.savedForLater && (
              <Badge variant="secondary">Saved for later</Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="truncate">{item.sellerName}</span>
          {sku && (
            <span className="font-mono" title="SKU">
              {sku}
            </span>
          )}
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
    </li>
  );
}
