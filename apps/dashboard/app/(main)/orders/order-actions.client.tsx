"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, PackageCheck, PackagePlus, RefreshCw, Truck } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
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
  /** Table rows: the main button only, the rest in the menu. */
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

  return (
    <>
      <div className={cn("flex items-center gap-1.5", className)}>
        {order.canRestockReturn && (
          <Button
            size="sm"
            variant="outline"
            className={compact ? undefined : "flex-1 sm:flex-none"}
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              restockNow();
            }}
          >
            <PackagePlus className="size-4" />
            {t("restock")}
          </Button>
        )}

        {/* A closed order (delivered, returned, cancelled) can still move to another status. */}
        {!primary && corrections.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={compact ? undefined : "flex-1 sm:flex-none"}
                disabled={isPending}
                onClick={(e) => e.stopPropagation()}
              >
                <RefreshCw className="size-4" />
                {t("changeStatus")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {corrections.map((action) => (
                <DropdownMenuItem
                  key={action}
                  className={DESTRUCTIVE.includes(action) ? "text-destructive focus:text-destructive" : undefined}
                  onSelect={() => pick(action)}
                >
                  {t(actionLabelKey(order, action))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {primary && (
          <Button
            size="sm"
            className={compact ? undefined : "flex-1 sm:flex-none"}
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              pick(primary);
            }}
          >
            {PrimaryIcon && <PrimaryIcon className="size-4" />}
            {t(actionLabelKey(order, primary))}
          </Button>
        )}

        {secondary.length > 0 &&
          (compact ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="px-2"
                  disabled={isPending}
                  aria-label={t("more")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondary.map((action) => (
                  <DropdownMenuItem
                    key={action}
                    className={DESTRUCTIVE.includes(action) ? "text-destructive focus:text-destructive" : undefined}
                    onSelect={() => pick(action)}
                  >
                    {t(actionLabelKey(order, action))}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            secondary.map((action) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                disabled={isPending}
                className={DESTRUCTIVE.includes(action) ? "text-destructive hover:text-destructive" : undefined}
                onClick={() => pick(action)}
              >
                {t(actionLabelKey(order, action))}
              </Button>
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

      <Dialog open={failing} onOpenChange={(open) => !open && !isPending && setFailing(false)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("failDialog.title", { number: order.orderNumber })}</DialogTitle>
            <DialogDescription>{t("failDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`fail-${order.id}`}>{t("failDialog.reason")}</Label>
            <Textarea
              id={`fail-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("failDialog.placeholder")}
              maxLength={500}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailing(false)} disabled={isPending}>
              {t("dialog.back")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !reason.trim()}
              onClick={() => run("fail", { failureReason: reason.trim() })}
            >
              {t("failDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returning} onOpenChange={(open) => !open && !isPending && setReturning(false)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("dialog.returnTitle", { number: order.orderNumber })}</DialogTitle>
            <DialogDescription>{t("dialog.returnDescription")}</DialogDescription>
          </DialogHeader>
          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal">
            <Checkbox
              className="mt-0.5"
              checked={restock}
              onCheckedChange={(value) => setRestock(value === true)}
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{t("dialog.returnRestock")}</span>
              <span className="block text-xs text-muted-foreground">{t("dialog.returnRestockHint")}</span>
            </span>
          </Label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(false)} disabled={isPending}>
              {t("dialog.back")}
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={() => run("return", { restock })}>
              {t("return")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={short !== null} onOpenChange={(open) => !open && !isPending && setShort(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("shortage.title")}</DialogTitle>
            <DialogDescription>{t("shortage.description")}</DialogDescription>
          </DialogHeader>
          <ul className="divide-y rounded-lg border text-sm">
            {short?.items.map((item) => (
              <li key={item.title} className="flex items-center justify-between gap-3 p-3">
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {t("shortage.counts", { need: item.need, have: item.have })}
                </span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShort(null)} disabled={isPending}>
              {t("dialog.back")}
            </Button>
            <Button
              disabled={isPending || !short}
              onClick={() => short && run(short.action, { addMissingStock: true })}
            >
              <PackagePlus className="size-4" />
              {t("shortage.addAndContinue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
