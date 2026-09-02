"use client";

import { useState, useTransition } from "react";
import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cancelOrder } from "@/actions/order";
import {
  canShowCancelOrderButton,
  isCancelOrderDisabledForDelivery,
  isCancelOrderEnabled,
} from "./order-confirmation.lib";

interface OrderCancelButtonProps {
  orderId: string;
  status: string;
  isAuthenticated: boolean;
}

export function OrderCancelButton({
  orderId,
  status,
  isAuthenticated,
}: OrderCancelButtonProps) {
  const t = useTranslations("orders");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated || !canShowCancelOrderButton(status)) {
    return null;
  }

  const isEnabled = isCancelOrderEnabled(status);
  const isOutForDelivery = isCancelOrderDisabledForDelivery(status);
  const isDisabled = !isEnabled || isOutForDelivery;

  const disabledReason = isOutForDelivery
    ? t("cancelOrderDisabledOutForDelivery")
    : t("cancelOrderDisabled");

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrder(orderId);

      if (!result.success) {
        toast.error(result.error || tToast("failedToCancelOrder"));
        return;
      }

      toast.success(tToast("orderCancelledSuccessfully"));
      setOpen(false);
      router.refresh();
    });
  };

  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isDisabled || isPending}
      className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      {isPending ? t("cancellingOrder") : t("cancelOrder")}
    </Button>
  );

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cancelOrderTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("cancelOrderDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("keepOrder")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleCancel();
            }}
            disabled={isPending}
            className="gap-2 bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("cancellingOrder")}
              </>
            ) : (
              t("confirmCancelOrder")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
