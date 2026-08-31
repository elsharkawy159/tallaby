"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleAlert, Loader2, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";

import { formatCurrency } from "@/lib/format";
import {
  translateCollectionMethod,
  translateFailureReason,
} from "@/lib/rider-labels";
import {
  DELIVERY_FAILURE_REASONS,
  COLLECTION_METHODS,
  type CollectionMethod,
  type DeliveryFailureReasonCode,
  type RiderStatus,
  type ShippingStatus,
} from "@/lib/shipping-status";
import { collectPayment, riderUpdateStatus } from "../rider.server";

interface DeliveryActionsProps {
  shipmentId: string;
  status: ShippingStatus;
  /** Amount to collect on delivery, in EGP. Zero for prepaid orders. */
  codAmount: number;
}

type View = "idle" | "collecting" | "failing";

export function DeliveryActions({
  shipmentId,
  status,
  codAmount,
}: DeliveryActionsProps) {
  const t = useTranslations("rider");
  const tReasons = useTranslations("failureReasons");
  const tMethods = useTranslations("collectionMethods");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<View>("idle");
  const [amount, setAmount] = useState(codAmount.toFixed(2));
  const [method, setMethod] = useState<CollectionMethod>("cash");
  const [reasonCode, setReasonCode] = useState<DeliveryFailureReasonCode | null>(
    null
  );
  const [note, setNote] = useState("");

  const reset = () => {
    setView("idle");
    setAmount(codAmount.toFixed(2));
    setMethod("cash");
    setReasonCode(null);
    setNote("");
  };

  const updateStatus = (next: RiderStatus, reason?: DeliveryFailureReasonCode) => {
    startTransition(async () => {
      const result = await riderUpdateStatus({
        shipmentId,
        status: next,
        reasonCode: reason,
        failureReason: note || undefined,
      });

      if (result.success) {
        toast.success(result.message ?? t("updated"));
        reset();
        router.refresh();
      } else {
        toast.error(result.error ?? t("somethingWrong"));
      }
    });
  };

  const confirmCollection = () => {
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error(t("invalidAmount"));
      return;
    }

    startTransition(async () => {
      const result = await collectPayment({ shipmentId, amount: parsed, method });

      if (result.success) {
        toast.success(result.message ?? t("paymentCollected"));
        reset();
        router.refresh();
      } else {
        toast.error(result.error ?? t("somethingWrong"));
      }
    });
  };

  if (status === "assigned") {
    return (
      <Button
        className="h-12 w-full text-base"
        disabled={isPending}
        onClick={() => updateStatus("out_for_delivery")}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Truck className="size-5" />
        )}
        {t("startDelivery")}
      </Button>
    );
  }

  if (status !== "out_for_delivery") return null;

  if (view === "collecting") {
    const parsed = Number(amount);
    const discrepancy = Number.isNaN(parsed) ? 0 : parsed - codAmount;

    return (
      <div className="space-y-3 rounded-xl border bg-white p-4 dark:bg-gray-950">
        <p className="text-sm font-medium">{t("collectPayment")}</p>

        <div className="space-y-2">
          <Label htmlFor="cod-amount">{t("amountCollected")}</Label>
          <Input
            id="cod-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            {t("expected")}: {formatCurrency(codAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cod-method">{t("paymentMethod")}</Label>
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as CollectionMethod)}
            disabled={isPending}
          >
            <SelectTrigger id="cod-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_METHODS.map((value) => (
                <SelectItem key={value} value={value}>
                  {translateCollectionMethod(tMethods, value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {discrepancy !== 0 && (
          <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
            {t(discrepancy > 0 ? "discrepancyMore" : "discrepancyLess", {
              amount: formatCurrency(Math.abs(discrepancy)),
            })}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={isPending}
            onClick={reset}
          >
            {t("cancel")}
          </Button>
          <Button
            className="h-11 flex-1 bg-green-600 text-white hover:bg-green-600/90"
            disabled={isPending}
            onClick={confirmCollection}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("confirmCollected")}
          </Button>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setReasonCode("payment_not_collected");
            setView("failing");
          }}
          className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("paymentNotCollectedLink")}
        </button>
      </div>
    );
  }

  if (view === "failing") {
    return (
      <div className="space-y-3 rounded-xl border bg-white p-4 dark:bg-gray-950">
        <p className="text-sm font-medium">{t("whatWentWrong")}</p>

        <div className="grid grid-cols-1 gap-2">
          {DELIVERY_FAILURE_REASONS.map((reason) => (
            <button
              key={reason.code}
              type="button"
              disabled={isPending}
              onClick={() => setReasonCode(reason.code)}
              className={`rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
                reasonCode === reason.code
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:bg-muted"
              }`}
            >
              {translateFailureReason(tReasons, reason.code)}
            </button>
          ))}
        </div>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("addNoteOptional")}
          rows={2}
          disabled={isPending}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={isPending}
            onClick={reset}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            className="h-11 flex-1"
            disabled={isPending || !reasonCode}
            onClick={() => reasonCode && updateStatus("failed", reasonCode)}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("confirmFailed")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-12 w-full bg-green-600 text-base text-white hover:bg-green-600/90"
        disabled={isPending}
        onClick={() =>
          codAmount > 0 ? setView("collecting") : updateStatus("delivered")
        }
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : codAmount > 0 ? (
          <Wallet className="size-5" />
        ) : (
          <CheckCircle2 className="size-5" />
        )}
        {codAmount > 0
          ? t("collectAmount", { amount: formatCurrency(codAmount) })
          : t("markDelivered")}
      </Button>

      <Button
        variant="outline"
        className="h-12 w-full text-base"
        disabled={isPending}
        onClick={() => setView("failing")}
      >
        <CircleAlert className="size-5" />
        {t("deliveryFailed")}
      </Button>
    </div>
  );
}
