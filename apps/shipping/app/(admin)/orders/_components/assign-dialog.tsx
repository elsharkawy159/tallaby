"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

import { PACKAGE_VOLUMES } from "@workspace/lib/shipping";
import { bulkAssignProvider, getEligibleRiderCount } from "../batch.server";
import type { BulkAssignTarget } from "../batch.dto";
import type { BulkAssignSuccess, BulkInvalidOrder } from "../batch.types";
import type { ProviderOption } from "../orders.types";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: BulkAssignTarget;
  /** Orders in the current selection/filter, for the dialog's header count. */
  count: number;
  providers: ProviderOption[];
  onAssigned: () => void;
}

export function AssignDialog({
  open,
  onOpenChange,
  target,
  count,
  providers,
  onAssigned,
}: AssignDialogProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [providerId, setProviderId] = useState<string>("");
  const [weightKg, setWeightKg] = useState("1");
  const [volume, setVolume] = useState<(typeof PACKAGE_VOLUMES)[number]>("Small");
  const [invalid, setInvalid] = useState<BulkInvalidOrder[] | null>(null);
  const [result, setResult] = useState<BulkAssignSuccess | null>(null);
  const [riderCount, setRiderCount] = useState<number | null>(null);

  const provider = providers.find((p) => p.id === providerId);
  const isEgyptPost = provider?.code === "wassalha_egypt_post";
  const isTallaby = provider?.code === "tallaby";

  // Reset to a clean form every time the dialog is (re)opened for a new target.
  useEffect(() => {
    if (open) {
      setProviderId("");
      setWeightKg("1");
      setVolume("Small");
      setInvalid(null);
      setResult(null);
      setRiderCount(null);
    }
  }, [open]);

  useEffect(() => {
    if (!isTallaby) {
      setRiderCount(null);
      return;
    }
    getEligibleRiderCount().then((res) => {
      if (res.success) setRiderCount(res.data ?? 0);
    });
  }, [isTallaby]);

  function submit() {
    if (!providerId) return;

    startTransition(async () => {
      const res = await bulkAssignProvider({
        providerId,
        target,
        weightKg: Number(weightKg) || 1,
        volume,
      });

      if (res.success && res.data) {
        setResult(res.data);
        setInvalid(null);
        onAssigned();
        if (res.data.exportUrl) {
          window.location.href = res.data.exportUrl;
        }
      } else {
        setInvalid(res.invalid ?? null);
        toast.error(res.error ?? tCommon("somethingWrong"));
      }
    });
  }

  function close() {
    onOpenChange(false);
    if (result) router.refresh();
  }

  const assignTitle =
    count === 1
      ? t("assignTitle", { count })
      : t("assignTitle_other", { count });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {t("assignedTo", { name: result.providerName })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {result.assigned === 1
                  ? t("assignedSummary", {
                      count: result.assigned,
                      batch: result.batchLabel,
                    })
                  : t("assignedSummary_other", {
                      count: result.assigned,
                      batch: result.batchLabel,
                    })}
              </p>

              {result.exportUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={result.exportUrl}>{t("downloadSheet")}</a>
                </Button>
              )}

              {result.riderSplit && result.riderSplit.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("splitAcross", { count: result.riderSplit.length })}
                  </p>
                  {result.riderSplit.map((rider) => (
                    <Link
                      key={rider.riderId}
                      href={`/riders/${rider.riderId}`}
                      className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                    >
                      <Avatar>
                        <AvatarImage src={rider.avatarUrl ?? undefined} />
                        <AvatarFallback>{(rider.fullName ?? "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {rider.fullName ?? tCommon("unnamedRider")}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {rider.phone ?? tCommon("noPhone")}
                          {rider.email ? ` · ${rider.email}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {t("riderOrders", { count: rider.orderCount })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={close}>{tCommon("done")}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{assignTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assign-provider">{t("provider")}</Label>
                <Select value={providerId} onValueChange={setProviderId} disabled={isPending}>
                  <SelectTrigger id="assign-provider" className="w-full">
                    <SelectValue placeholder={t("selectProvider")} />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEgyptPost && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assign-weight">{t("weightKg")}</Label>
                    <Input
                      id="assign-weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">{t("weightHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assign-volume">{t("packageVolume")}</Label>
                    <Select
                      value={volume}
                      onValueChange={(v) => setVolume(v as (typeof PACKAGE_VOLUMES)[number])}
                      disabled={isPending}
                    >
                      <SelectTrigger id="assign-volume" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_VOLUMES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isTallaby && (
                <p className="text-sm text-muted-foreground">
                  {riderCount === null
                    ? t("checkingRiders")
                    : riderCount === 0
                      ? t("noTallabyDriver")
                      : riderCount === 1
                        ? t("splitAcrossRiders", { count: riderCount })
                        : t("splitAcrossRiders_other", { count: riderCount })}
                </p>
              )}

              {invalid && invalid.length > 0 && (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">
                    {invalid.length === 1
                      ? t("invalidAssign", { count: invalid.length })
                      : t("invalidAssign_other", { count: invalid.length })}
                  </p>
                  {invalid.map((item) => (
                    <p key={item.orderId} className="text-muted-foreground">
                      {item.orderNumber} — {item.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={submit}
                disabled={!providerId || isPending || (isTallaby && riderCount === 0)}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {t("assign")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
