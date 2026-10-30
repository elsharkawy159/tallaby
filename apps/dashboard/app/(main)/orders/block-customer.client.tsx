"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { blockCustomerPhone, unblockCustomerPhone } from "../stores/[storeId]/settings/protection/protection.server";
import type { SellerOrderRow } from "./orders.types";

/**
 * Block / unblock the order's phone on its store (ROADMAP.md F-02c). Only for
 * store-website orders: a blocked phone can no longer order on that store.
 */
export function BlockCustomerButton({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.details");
  const tErrors = useTranslations("blockedCustomers.errors");
  const router = useRouter();
  const [blocked, setBlocked] = useState(order.customerBlocked);
  const [isPending, startTransition] = useTransition();

  if (!order.storeId || !order.customerPhone) return null;
  const storeId = order.storeId;
  const phone = order.customerPhone;

  const toggle = () => {
    startTransition(async () => {
      const result = blocked
        ? await unblockCustomerPhone(storeId, { phone })
        : await blockCustomerPhone(storeId, { phone, reason: t("blockReason", { number: order.orderNumber }) });
      if (!result.success) {
        toast.error(tErrors(result.error));
        return;
      }
      setBlocked(!blocked);
      toast.success(blocked ? t("customerUnblocked") : t("customerBlocked"));
      router.refresh();
    });
  };

  return (
    <div className="space-y-1.5 border-t pt-3">
      {blocked && <p className="text-xs font-medium text-destructive">{t("blockedNote")}</p>}
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={toggle}
        className={cn(
          SMALL_BUTTON_CLASS,
          "-ms-2",
          blocked ? "text-muted-foreground" : "text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        {isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : blocked ? (
          <ShieldCheck className="size-3.5" />
        ) : (
          <Ban className="size-3.5" />
        )}
        {blocked ? t("unblockCustomer") : t("blockCustomer")}
      </Button>
    </div>
  );
}
