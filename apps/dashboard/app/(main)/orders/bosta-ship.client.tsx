"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CircleAlert, Copy, ExternalLink, LoaderCircle, MapPin, Package, RotateCw, Search, Truck } from "lucide-react";

import { bostaTrackingUrl } from "@workspace/lib/integrations";
import type { BostaShipPreview } from "@workspace/lib/shipping/bosta-ship";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { SegmentedControl, SegmentedControlItem } from "@workspace/ui/components/segmented-control";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { previewShipWithBosta, shipWithBosta, type BostaActionError } from "./bosta-ship.server";
import type { SellerOrderRow } from "./orders.types";

type Size = "SMALL" | "MEDIUM" | "LARGE";

/** Bosta state codes with their own label (orders.bosta.states.<code>); others show Bosta's text. */
const KNOWN_STATES = new Set([10, 11, 20, 21, 24, 30, 41, 45, 46, 47, 48, 49, 60, 100, 101, 102, 103, 104, 105]);

/** Stages in which an order can still go to Bosta. */
export function canShipWithBosta(order: SellerOrderRow): boolean {
  return (
    order.bostaConnected &&
    !order.flow.readOnly &&
    !order.flow.carrierManaged &&
    !order.bosta?.trackingNumber &&
    (order.flow.stage === "new" || order.flow.stage === "to_ship")
  );
}

export function useBostaErrorText() {
  const t = useTranslations("orders.bosta.errors");
  return (error: BostaActionError | string, message?: string) => {
    // Status flags from Bosta updates: "state_<code>" (investigation, on hold, …) and "exception: <reason>".
    if (error.startsWith("state_")) return t("attention");
    if (error === "exception") return message ? `${t("exception")} (${message})` : t("exception");
    const key = t.has(error) ? error : "unknown";
    return key === "unknown" && message ? `${t("unknown")} (${message})` : t(key);
  };
}

/** "Ship with Bosta": opens the confirm sheet. */
export function ShipWithBostaButton({ order, className }: { order: SellerOrderRow; className?: string }) {
  const t = useTranslations("orders.bosta");
  const [open, setOpen] = useState(false);
  if (!canShipWithBosta(order) || !order.storeId) return null;
  const retry = Boolean(order.bosta?.lastError);
  return (
    <>
      <Button size="sm" className={cn("bg-[#E30613] text-white hover:bg-[#c00510]", className)} onClick={() => setOpen(true)}>
        {retry ? <RotateCw className="size-4" aria-hidden /> : <Truck className="size-4" aria-hidden />}
        {retry ? t("retry") : t("ship")}
      </Button>
      {open && <BostaShipDialog order={order} storeId={order.storeId} onClose={() => setOpen(false)} />}
    </>
  );
}

function BostaShipDialog({ order, storeId, onClose }: { order: SellerOrderRow; storeId: string; onClose: () => void }) {
  const t = useTranslations("orders.bosta");
  const errorText = useBostaErrorText();
  const locale = useLocale();
  const router = useRouter();
  const [preview, setPreview] = useState<BostaShipPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [size, setSize] = useState<Size>("SMALL");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    previewShipWithBosta(storeId, order.id).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setLoadError(errorText(result.error));
        return;
      }
      setPreview(result.data);
      setSize(result.data.size);
      setPicking(!result.data.destination.ok);
    });
    return () => {
      cancelled = true;
    };
    // Loaded once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, order.id]);

  const destinationOk = Boolean(districtId) || Boolean(preview?.destination.ok);
  const canSend = Boolean(preview) && !preview?.blocker && destinationOk && !isPending;

  const send = () =>
    startTransition(async () => {
      setError(null);
      const result = await shipWithBosta(storeId, order.id, { districtId, size });
      if (!result.success) {
        setError(errorText(result.error, result.message));
        if (result.cityIds?.length) setPicking(true);
        router.refresh();
        return;
      }
      toast.success(t("shipped", { number: order.orderNumber, tracking: result.data.trackingNumber }));
      router.refresh();
      onClose();
    });

  const pickedLabel = districtId ? preview?.districtOptions.find((o) => o.districtId === districtId)?.label : null;

  return (
    <Dialog open onOpenChange={(next) => !next && !isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle", { number: order.orderNumber })}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{loadError}</p>
        ) : !preview ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {preview.blocker && (
              <p className="flex gap-2 rounded-lg bg-accent-soft p-3 text-sm text-accent-ink">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {errorText(preview.blocker)}
              </p>
            )}
            {preview.lastError && !error && (
              <p className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {t("lastAttempt")} {errorText(preview.lastError.split(":")[0]!, preview.lastError.split(":").slice(1).join(":").trim() || undefined)}
                </span>
              </p>
            )}

            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{preview.receiver.name || "—"}</p>
              {preview.receiver.phone && (
                <p className="text-muted-foreground" dir="ltr">
                  {preview.receiver.phone}
                </p>
              )}
              {preview.address && (
                <p className="mt-1 text-muted-foreground" dir="auto">
                  {[preview.address.line1, preview.address.line2, preview.address.city, preview.address.state].filter(Boolean).join("، ")}
                </p>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className={cn("mt-0.5 size-4 shrink-0", destinationOk ? "text-success" : "text-destructive")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t("bostaArea")}</p>
                  <p className={cn("text-muted-foreground", !destinationOk && "text-destructive")}>
                    {pickedLabel
                      ? pickedLabel
                      : preview.destination.ok
                        ? t("matched", {
                            area:
                              preview.districtOptions.find((o) => o.districtId === (preview.destination.ok ? preview.destination.districtId : null))
                                ?.label ?? preview.destination.city,
                          })
                        : t(`unmatched.${preview.destination.reason}`)}
                  </p>
                </div>
                {!picking && preview.districtOptions.length > 0 && (
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPicking(true)}>
                    {t("change")}
                  </Button>
                )}
              </div>
              {picking && preview.districtOptions.length > 0 && (
                <DistrictPicker
                  options={preview.districtOptions}
                  value={districtId}
                  onChange={(id) => {
                    setDistrictId(id);
                    setPicking(false);
                    setError(null);
                  }}
                />
              )}
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">{t("cod")}</dt>
                <dd className="mt-0.5 font-semibold tabular-nums" dir="auto">
                  {preview.prepaid ? t("prepaid") : formatMoney(preview.cod, locale)}
                </dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">{t("items")}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                  <Package className="size-4 text-muted-foreground" aria-hidden />
                  {preview.itemsCount}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{t("size")}</span>
              <SegmentedControl value={size} onValueChange={(value) => setSize(value as Size)} aria-label={t("size")}>
                <SegmentedControlItem value="SMALL">{t("sizes.SMALL")}</SegmentedControlItem>
                <SegmentedControlItem value="MEDIUM">{t("sizes.MEDIUM")}</SegmentedControlItem>
                <SegmentedControlItem value="LARGE">{t("sizes.LARGE")}</SegmentedControlItem>
              </SegmentedControl>
            </div>

            {preview.pickupLocationName && (
              <p className="text-xs text-muted-foreground" dir="auto">
                {t("pickupFrom", { name: preview.pickupLocationName })}
              </p>
            )}
            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("back")}
          </Button>
          <Button className="bg-[#E30613] text-white hover:bg-[#c00510]" disabled={!canSend} onClick={send}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Truck className="size-4" aria-hidden />}
            {isPending ? t("sending") : t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DistrictPicker({
  options,
  value,
  onChange,
}: {
  options: BostaShipPreview["districtOptions"];
  value: string | null;
  onChange: (districtId: string) => void;
}) {
  const t = useTranslations("orders.bosta");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.cityName.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <label className="flex h-9 items-center gap-2 rounded-md border px-2.5 text-muted-foreground focus-within:border-primary">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchArea")}
          aria-label={t("searchArea")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
      </label>
      <ul role="listbox" aria-label={t("bostaArea")} className="max-h-56 overflow-y-auto rounded-md border">
        {filtered.slice(0, 200).map((option) => (
          <li key={option.districtId} role="option" aria-selected={option.districtId === value}>
            <button
              type="button"
              onClick={() => onChange(option.districtId)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-muted",
                option.districtId === value && "bg-primary/10 font-medium",
              )}
            >
              <span className="min-w-0 truncate" dir="auto">
                {option.label}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{option.cityName}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">{t("noArea")}</li>}
      </ul>
    </div>
  );
}

/** The Bosta box in the order panel: tracking, status and what needs the seller. */
export function BostaDeliveryCard({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.bosta");
  const errorText = useBostaErrorText();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const bosta = order.bosta;
  const creating = Boolean(bosta?.creating);

  // A create call is in flight (often the auto-ship after a confirm): look again shortly.
  useEffect(() => {
    if (!creating) return;
    const timer = setTimeout(() => router.refresh(), 3000);
    return () => clearTimeout(timer);
  }, [creating, router]);

  if (!bosta) return null;

  const stateLabel =
    bosta.stateCode != null && KNOWN_STATES.has(bosta.stateCode) ? t(`states.${bosta.stateCode}`) : (bosta.state ?? t("states.unknown"));
  const [reason, ...rest] = (bosta.lastError ?? "").split(":");

  const copy = async () => {
    if (!bosta.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(bosta.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the number is on screen to copy by hand.
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-[#E30613] text-white">
          <Truck className="size-4" aria-hidden />
        </span>
        <p className="font-semibold">{t("cardTitle")}</p>
        {bosta.trackingNumber && (
          <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{stateLabel}</span>
        )}
      </div>
      {bosta.creating ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          {t("creating")}
        </p>
      ) : bosta.trackingNumber ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{t("tracking")}</span>
          <span className="font-mono font-medium" dir="ltr">
            {bosta.trackingNumber}
          </span>
          <Button type="button" size="icon" variant="ghost" className="size-7" onClick={copy} aria-label={t("copy")}>
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          </Button>
          <a
            href={bostaTrackingUrl(bosta.trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t("track")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      ) : null}
      {bosta.needsAttention && bosta.lastError && (
        <p className="flex gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {errorText(reason!, rest.join(":").trim() || undefined)}
        </p>
      )}
    </div>
  );
}
