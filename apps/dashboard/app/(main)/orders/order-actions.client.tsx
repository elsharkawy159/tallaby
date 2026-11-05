"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, PackageCheck, PackagePlus, RefreshCw, Truck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { CheckRow, Field, Modal, SellerButton, TextArea } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import type { SellerOrderAction } from "./order-flow.lib";
import type { SellerOrderRow, StockShortage } from "./orders.types";
import { restockReturnedOrder, updateSellerOrder } from "./orders.server";

/** Big moves ask first. "return" has its own dialog, with the stock choice. */
type ConfirmedAction = "deliver" | "cancel";
const isConfirmed = (a: SellerOrderAction): a is ConfirmedAction =>
  a === "deliver" || a === "cancel";

const DESTRUCTIVE: SellerOrderAction[] = ["fail", "return", "cancel"];

const ICON: Partial<Record<SellerOrderAction, React.ComponentType<{ className?: string }>>> = {
  confirm: Check,
  ship: Truck,
  deliver: PackageCheck,
};

/** "Send out again" reads better than "Mark out for delivery" after a failed attempt. */
export function actionLabelKey(order: Pick<SellerOrderRow, "flow">, action: SellerOrderAction) {
  return action === "ship" && order.flow.stage === "failed" ? "retry" : action;
}

export function OrderActions({
  order,
  compact = false,
  className,
}: {
  order: SellerOrderRow;
  /** Table rows and cards: the main button only, the rest in the menu. */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("orders.actions");
  const tBosta = useTranslations("orders.bosta");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<ConfirmedAction | null>(null);
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");
  const [returning, setReturning] = useState(false);
  // Most returned items are fine to sell again; off for damaged ones.
  const [restock, setRestock] = useState(true);
  const [short, setShort] = useState<{ action: SellerOrderAction; items: StockShortage[] } | null>(null);

  const { primary, actions, corrections } = order.flow;
  if (!primary && corrections.length === 0 && !order.canRestockReturn) return null;
  const secondary = actions.filter((a) => a !== primary);

  const run = (
    action: SellerOrderAction,
    options: { failureReason?: string; restock?: boolean; addMissingStock?: boolean } = {},
  ) =>
    startTransition(async () => {
      const res = await updateSellerOrder({
        orderId: order.id,
        action,
        reason: options.failureReason,
        restock: options.restock,
        addMissingStock: options.addMissingStock,
      });
      if (!res.success) {
        // Not enough stock: offer the fix here, so the seller doesn't have to leave the order.
        if (res.shortage?.length) {
          setShort({ action, items: res.shortage });
          setConfirming(null);
          return;
        }
        toast.error(res.error);
        return;
      }
      toast.success(t(`done.${actionLabelKey(order, action)}`, { number: order.orderNumber }));
      if (action === "confirm" && order.bostaAutoShip) {
        // The Bosta shipment is created after the response (BS-09); show it once it exists.
        toast.info(tBosta("autoSending", { number: order.orderNumber }));
        setTimeout(() => router.refresh(), 4000);
      }
      setConfirming(null);
      setFailing(false);
      setReason("");
      setReturning(false);
      setShort(null);
    });

  const restockNow = () =>
    startTransition(async () => {
      const res = await restockReturnedOrder({ orderId: order.id });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(t("done.restocked", { number: order.orderNumber }));
    });

  const pick = (action: SellerOrderAction) => {
    if (action === "fail") setFailing(true);
    else if (action === "return") {
      setRestock(true);
      setReturning(true);
    } else if (isConfirmed(action)) setConfirming(action);
    else run(action);
  };

  const PrimaryIcon = primary ? ICON[primary] : undefined;
  const destructiveItem = (action: SellerOrderAction) =>
    DESTRUCTIVE.includes(action) ? "text-destructive focus:text-destructive" : undefined;

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {primary && (
          <SellerButton
            variant="solid"
            size="sm"
            className="flex-1"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              pick(primary);
            }}
          >
            {PrimaryIcon && <PrimaryIcon aria-hidden />}
            {t(actionLabelKey(order, primary))}
          </SellerButton>
        )}

        {order.canRestockReturn && (
          <SellerButton
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              restockNow();
            }}
          >
            <PackagePlus aria-hidden />
            {t("restock")}
          </SellerButton>
        )}

        {/* A closed order (delivered, returned, cancelled) can still move to another status. */}
        {!primary && corrections.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SellerButton
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isPending}
                onClick={(e) => e.stopPropagation()}
              >
                <RefreshCw aria-hidden />
                {t("changeStatus")}
                <ChevronDown aria-hidden />
              </SellerButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {corrections.map((action) => (
                <DropdownMenuItem key={action} className={destructiveItem(action)} onSelect={() => pick(action)}>
                  {t(actionLabelKey(order, action))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {secondary.length > 0 &&
          (compact ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SellerButton
                  variant="outline"
                  size="sm"
                  className="w-10 px-0"
                  disabled={isPending}
                  aria-label={t("more")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronDown aria-hidden />
                </SellerButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondary.map((action) => (
                  <DropdownMenuItem key={action} className={destructiveItem(action)} onSelect={() => pick(action)}>
                    {t(actionLabelKey(order, action))}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            secondary.map((action) => (
              <SellerButton
                key={action}
                variant="outline"
                size="sm"
                disabled={isPending}
                className={cn("max-[720px]:flex-1", DESTRUCTIVE.includes(action) && "text-destructive")}
                onClick={() => pick(action)}
              >
                {t(actionLabelKey(order, action))}
              </SellerButton>
            ))
          ))}
      </div>

      <ConfirmActionDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && !isPending && setConfirming(null)}
        title={confirming ? t(`dialog.${confirming}Title`, { number: order.orderNumber }) : ""}
        description={confirming ? t(`dialog.${confirming}Description`) : ""}
        confirmLabel={confirming ? t(confirming) : ""}
        cancelLabel={t("dialog.back")}
        destructive={confirming === "cancel"}
        pending={isPending}
        onConfirm={() => confirming && run(confirming)}
      />

      <Modal
        open={failing}
        onOpenChange={(open) => !open && !isPending && setFailing(false)}
        title={t("failDialog.title", { number: order.orderNumber })}
        description={t("failDialog.description")}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setFailing(false)} disabled={isPending}>
              {t("dialog.back")}
            </SellerButton>
            <SellerButton
              variant="danger"
              disabled={isPending || !reason.trim()}
              onClick={() => run("fail", { failureReason: reason.trim() })}
            >
              {t("failDialog.save")}
            </SellerButton>
          </>
        }
      >
        <Field label={t("failDialog.reason")} htmlFor={`fail-${order.id}`}>
          <TextArea
            id={`fail-${order.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("failDialog.placeholder")}
            maxLength={500}
            rows={3}
          />
        </Field>
      </Modal>

      <Modal
        open={returning}
        onOpenChange={(open) => !open && !isPending && setReturning(false)}
        title={t("dialog.returnTitle", { number: order.orderNumber })}
        description={t("dialog.returnDescription")}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setReturning(false)} disabled={isPending}>
              {t("dialog.back")}
            </SellerButton>
            <SellerButton variant="danger" disabled={isPending} onClick={() => run("return", { restock })}>
              {t("return")}
            </SellerButton>
          </>
        }
      >
        <CheckRow
          className="rounded-2xl border border-(--s-field) p-3.5"
          label={t("dialog.returnRestock")}
          description={t("dialog.returnRestockHint")}
          checked={restock}
          onChange={(e) => setRestock(e.target.checked)}
        />
      </Modal>

      <Modal
        open={short !== null}
        onOpenChange={(open) => !open && !isPending && setShort(null)}
        title={t("shortage.title")}
        description={t("shortage.description")}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setShort(null)} disabled={isPending}>
              {t("dialog.back")}
            </SellerButton>
            <SellerButton
              variant="solid"
              className="h-auto min-h-[42px] min-w-0 shrink whitespace-normal py-1.5 leading-tight"
              disabled={isPending || !short}
              onClick={() => short && run(short.action, { addMissingStock: true })}
            >
              <PackagePlus aria-hidden />
              {t("shortage.addAndContinue")}
            </SellerButton>
          </>
        }
      >
        <ul className="divide-y divide-(--s-line-soft) rounded-2xl border border-(--s-line) text-[13px]">
          {short?.items.map((item) => (
            <li key={item.title} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0 break-words text-(--s-text)">{item.title}</span>
              <span className="shrink-0 text-(--s-subtle) tabular-nums">
                {t("shortage.counts", { need: item.need, have: item.have })}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
