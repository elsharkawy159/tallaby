"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, LoaderCircle, ShieldCheck } from "lucide-react";
import { SellerButton } from "@/components/seller-ui";
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
    <div className="flex flex-col items-start gap-1.5 border-t border-(--s-line-soft) pt-3">
      {blocked && <p className="text-xs font-semibold text-destructive">{t("blockedNote")}</p>}
      <SellerButton
        variant="mini"
        size="xs"
        disabled={isPending}
        onClick={toggle}
        className={cn(!blocked && "border-destructive/40 text-destructive [&_svg]:text-destructive")}
      >
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : blocked ? <ShieldCheck aria-hidden /> : <Ban aria-hidden />}
        {blocked ? t("unblockCustomer") : t("blockCustomer")}
      </SellerButton>
    </div>
  );
}
