"use client";

import { useState, useTransition } from "react";
import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
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
import { cancelOrder } from "@/actions/order";
import { isCancelOrderEnabled } from "./order-confirmation.lib";
import posthog from "posthog-js";

interface OrderCancelButtonProps {
  orderId: string;
  status: string;
  /** The order page's signed access link, for a guest without the cookie. */
  accessToken?: string;
}

export function OrderCancelButton({
  orderId,
  status,
  accessToken,
}: OrderCancelButtonProps) {
  const t = useTranslations("orders");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Shown until the order is on its way; then it can no longer be cancelled.
  if (!isCancelOrderEnabled(status)) {
    return null;
  }

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrder(orderId, undefined, accessToken);

      if (!result.success) {
        toast.error(result.error || tToast("failedToCancelOrder"));
        return;
      }

      posthog.capture("order_cancelled", { order_id: orderId, previous_status: status });
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
      disabled={isPending}
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
