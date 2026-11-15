"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  History,
  LoaderCircle,
  MapPin,
  Package,
  Printer,
  RotateCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

import { bostaTrackingUrl } from "@workspace/lib/integrations";
import type { BostaShipPreview } from "@workspace/lib/shipping/bosta-ship";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { IconButton, Modal, Note, Segmented, SellerButton, Tag, TextAction } from "@/components/seller-ui";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { BostaTimelineEvent } from "@workspace/lib/shipping/bosta-orders";
import {
  cancelShipmentWithBosta,
  loadBostaTimeline,
  previewShipWithBosta,
  shipWithBosta,
  type BostaActionError,
} from "./bosta-ship.server";
import type { OrderSummary, SellerOrderRow } from "./orders.types";
import { BOSTA_BUTTON, PhoneText } from "./orders-ui";

type Size = "SMALL" | "MEDIUM" | "LARGE";

/** Bosta state codes with their own label (orders.bosta.states.<code>); others show Bosta's text. */
const KNOWN_STATES = new Set([10, 11, 20, 21, 24, 30, 41, 45, 46, 47, 48, 49, 60, 100, 101, 102, 103, 104, 105]);

/** Bosta state codes before pickup, the only ones a business can cancel. */
const PRE_PICKUP = new Set([10, 11, 20]);

/** The labels PDF for these orders of one store (opened in a new tab). */
export function bostaLabelsUrl(storeId: string, orderIds: string[], type: "A6" | "A4", lang: string) {
  const params = new URLSearchParams({ storeId, orders: orderIds.join(","), type, lang: lang.startsWith("ar") ? "ar" : "en" });
  return `/api/bosta/labels?${params.toString()}`;
}

export function useBostaStateLabel() {
  const t = useTranslations("orders.bosta");
  return (code: number | null, text: string | null) =>
    code != null && KNOWN_STATES.has(code) ? t(`states.${code}`) : (text ?? t("states.unknown"));
}

/** A small Bosta pill for order cards and table rows: the state, or that the seller is needed. */
export function BostaChip({ order, className }: { order: SellerOrderRow; className?: string }) {
  const t = useTranslations("orders.bosta");
  const stateLabel = useBostaStateLabel();
  const bosta = order.bosta;
  if (!bosta) return null;
  const label = bosta.needsAttention
    ? t("chipAttention")
    : bosta.creating
      ? t("creating")
      : bosta.trackingNumber
        ? stateLabel(bosta.stateCode, bosta.state)
        : t("chipNotSent");
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-[9px] py-0.5 text-[11px] font-bold",
        bosta.needsAttention ? "bg-destructive-soft text-destructive" : "bg-[#E30613]/10 text-[#b0040f] dark:text-[#ff6b73]",
        className,
      )}
    >
      <Truck className="size-3 shrink-0" aria-hidden />
      <span className="truncate">
        {t("chipPrefix")}: {label}
      </span>
    </span>
  );
}

/** Stages in which an order can still go to Bosta. */
export function canShipWithBosta(order: Pick<OrderSummary, "bostaConnected" | "flow" | "bosta">): boolean {
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
      <SellerButton variant="solid" size="sm" className={cn(BOSTA_BUTTON, className)} onClick={() => setOpen(true)}>
        {retry ? <RotateCw aria-hidden /> : <Truck aria-hidden />}
        {retry ? t("retry") : t("ship")}
      </SellerButton>
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
    <Modal
      open
      onOpenChange={(next) => !next && !isPending && onClose()}
      width={512}
      className="max-h-[90dvh] overflow-y-auto"
      title={t("dialogTitle", { number: order.orderNumber })}
      description={t("dialogDescription")}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose} disabled={isPending}>
            {t("back")}
          </SellerButton>
          <SellerButton variant="solid" className={BOSTA_BUTTON} disabled={!canSend} onClick={send}>
            {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Truck aria-hidden />}
            {isPending ? t("sending") : t("send")}
          </SellerButton>
        </>
      }
    >
        {loadError ? (
          <Note tone="danger">{loadError}</Note>
        ) : !preview ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {preview.blocker && (
              <Note tone="amber" icon={CircleAlert}>
                {errorText(preview.blocker)}
              </Note>
            )}
            {preview.lastError && !error && (
              <Note tone="danger" icon={CircleAlert}>
                {t("lastAttempt")} {errorText(preview.lastError.split(":")[0]!, preview.lastError.split(":").slice(1).join(":").trim() || undefined)}
              </Note>
            )}

            <div className="rounded-2xl border border-(--s-line) p-3.5 text-[13px]">
              <p className="break-words font-bold text-(--s-text)">{preview.receiver.name || "—"}</p>
              {preview.receiver.phone && (
                <p className="text-(--s-muted)">
                  <PhoneText phone={preview.receiver.phone} />
                </p>
              )}
              {preview.address && (
                <p className="mt-1 break-words text-(--s-muted)" dir="auto">
                  {[preview.address.line1, preview.address.line2, preview.address.city, preview.address.state].filter(Boolean).join("، ")}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-(--s-line) p-3.5">
              <div className="flex items-start gap-2 text-[13px]">
                <MapPin className={cn("mt-0.5 size-4 shrink-0", destinationOk ? "text-success" : "text-destructive")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-(--s-text)">{t("bostaArea")}</p>
                  <p className={cn("break-words text-(--s-muted)", !destinationOk && "text-destructive")}>
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
                  <TextAction type="button" className="max-[600px]:min-h-10" onClick={() => setPicking(true)}>
                    {t("change")}
                  </TextAction>
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

            <dl className="grid grid-cols-2 gap-2 text-[13px]">
              <div className="min-w-0 rounded-2xl border border-(--s-line) p-3.5">
                <dt className="text-xs text-(--s-subtle)">{t("cod")}</dt>
                <dd className="mt-0.5 break-words font-montserrat font-bold text-(--s-ink) tabular-nums" dir="auto">
                  {preview.prepaid ? t("prepaid") : formatMoney(preview.cod, locale)}
                </dd>
              </div>
              <div className="min-w-0 rounded-2xl border border-(--s-line) p-3.5">
                <dt className="text-xs text-(--s-subtle)">{t("items")}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-montserrat font-bold text-(--s-ink)">
                  <Package className="size-4 text-(--s-subtle)" aria-hidden />
                  {preview.itemsCount}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-(--s-text)">{t("size")}</span>
              <Segmented<Size>
                value={size}
                onChange={setSize}
                label={t("size")}
                options={[
                  { value: "SMALL", label: t("sizes.SMALL") },
                  { value: "MEDIUM", label: t("sizes.MEDIUM") },
                  { value: "LARGE", label: t("sizes.LARGE") },
                ]}
              />
            </div>

            {preview.pickupLocationName && (
              <p className="text-xs text-(--s-subtle)" dir="auto">
                {t("pickupFrom", { name: preview.pickupLocationName })}
              </p>
            )}
            {error && <Note tone="danger">{error}</Note>}
          </div>
        )}
    </Modal>
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
    <div className="mt-3 flex flex-col gap-2 border-t border-(--s-line-soft) pt-3">
      <label className="flex h-10 items-center gap-2 rounded-full border-[1.5px] border-(--s-field) px-3 text-(--s-subtle) focus-within:border-(--s-primary)">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchArea")}
          aria-label={t("searchArea")}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-(--s-text) outline-none"
        />
      </label>
      <ul role="listbox" aria-label={t("bostaArea")} className="max-h-56 overflow-y-auto rounded-2xl border border-(--s-line)">
        {filtered.slice(0, 200).map((option) => (
          <li key={option.districtId} role="option" aria-selected={option.districtId === value}>
            <button
              type="button"
              onClick={() => onChange(option.districtId)}
              className={cn(
                "flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-start text-[13px] text-(--s-text) hover:bg-(--s-hover)",
                option.districtId === value && "bg-(--s-hover) font-semibold",
              )}
            >
              <span className="min-w-0 truncate" dir="auto">
                {option.label}
              </span>
              <span className="shrink-0 text-xs text-(--s-subtle)">{option.cityName}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="px-3 py-4 text-center text-[13px] text-(--s-subtle)">{t("noArea")}</li>}
      </ul>
    </div>
  );
}

/** The Bosta box in the order panel: tracking, status and what needs the seller. */
export function BostaDeliveryCard({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.bosta");
  const errorText = useBostaErrorText();
  const router = useRouter();
  const locale = useLocale();
  const stateLabelOf = useBostaStateLabel();
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<BostaTimelineEvent[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, startCancel] = useTransition();
  const bosta = order.bosta;
  const creating = Boolean(bosta?.creating);

  // A create call is in flight (often the auto-ship after a confirm): look again shortly.
  useEffect(() => {
    if (!creating) return;
    const timer = setTimeout(() => router.refresh(), 3000);
    return () => clearTimeout(timer);
  }, [creating, router]);

  if (!bosta) return null;

  const stateLabel = stateLabelOf(bosta.stateCode, bosta.state);
  const prePickup = bosta.stateCode == null || PRE_PICKUP.has(bosta.stateCode);
  const [reason, ...rest] = (bosta.lastError ?? "").split(":");

  const openHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && order.storeId) {
      loadBostaTimeline(order.storeId, order.id).then((result) => setHistory(result.success ? result.data : []));
    }
  };

  const cancelShipment = () =>
    startCancel(async () => {
      if (!order.storeId) return;
      const result = await cancelShipmentWithBosta(order.storeId, order.id);
      if (!result.success) {
        toast.error(errorText(result.error, result.message));
        return;
      }
      toast.success(t("cancelled", { number: order.orderNumber }));
      setConfirmCancel(false);
      router.refresh();
    });

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
    <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#E30613] text-white">
          <Truck className="size-4" aria-hidden />
        </span>
        <p className="font-bold text-(--s-ink)">{t("cardTitle")}</p>
        {bosta.trackingNumber && <Tag className="ms-auto whitespace-normal">{stateLabel}</Tag>}
      </div>
      {bosta.creating ? (
        <p className="flex items-center gap-2 text-(--s-muted)">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          {t("creating")}
        </p>
      ) : bosta.trackingNumber ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-(--s-subtle)">{t("tracking")}</span>
          <bdi className="break-all font-montserrat font-semibold text-(--s-text)" dir="ltr">
            {bosta.trackingNumber}
          </bdi>
          <IconButton onClick={copy} aria-label={t("copy")}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </IconButton>
          <a
            href={bostaTrackingUrl(bosta.trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-(--s-link) hover:underline max-[600px]:min-h-10"
          >
            {t("track")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      ) : null}
      {bosta.needsAttention && bosta.lastError && (
        <Note tone="danger" icon={CircleAlert}>
          {errorText(reason!, rest.join(":").trim() || undefined)}
        </Note>
      )}
      {bosta.trackingNumber && order.storeId && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-(--s-line-soft) pt-3">
          <SellerButton asChild variant="outline" size="xs">
            <a href={bostaLabelsUrl(order.storeId, [order.id], "A6", locale)} target="_blank" rel="noopener noreferrer">
              <Printer aria-hidden />
              {t("printA6")}
            </a>
          </SellerButton>
          <SellerButton asChild variant="mini" size="xs">
            <a href={bostaLabelsUrl(order.storeId, [order.id], "A4", locale)} target="_blank" rel="noopener noreferrer">
              {t("printA4")}
            </a>
          </SellerButton>
          <SellerButton variant="mini" size="xs" aria-expanded={historyOpen} onClick={openHistory}>
            <History aria-hidden />
            {t("history")}
            <ChevronDown className={cn("transition-transform", historyOpen && "rotate-180")} aria-hidden />
          </SellerButton>
          {prePickup &&
            (order.bostaCanCancel ? (
              <SellerButton
                variant="mini"
                size="xs"
                className="ms-auto border-destructive/40 text-destructive [&_svg]:text-destructive"
                disabled={isCancelling}
                onClick={() => setConfirmCancel(true)}
              >
                <XCircle aria-hidden />
                {t("cancel")}
              </SellerButton>
            ) : (
              <span className="ms-auto text-[11px] text-(--s-subtle)">{t("cancelInBosta")}</span>
            ))}
        </div>
      )}
      {historyOpen && (
        <ol className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-3">
          {history === null ? (
            <li className="flex items-center gap-2 text-xs text-(--s-subtle)">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            </li>
          ) : history.length === 0 ? (
            <li className="text-xs text-(--s-subtle)">{t("historyEmpty")}</li>
          ) : (
            [...history].reverse().map((event) => (
              <li key={`${event.stateCode}-${event.occurredAt}`} className="flex gap-2.5 text-xs">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#E30613]" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-(--s-text)">{stateLabelOf(event.stateCode, event.stateText)}</p>
                  {event.exceptionReason && (
                    <p className="text-(--s-subtle)" dir="auto">
                      {event.exceptionReason}
                    </p>
                  )}
                  <p className="text-(--s-subtle)">{formatDateTime(event.occurredAt, locale)}</p>
                </div>
              </li>
            ))
          )}
        </ol>
      )}
      <ConfirmActionDialog
        open={confirmCancel}
        onOpenChange={(open) => !open && !isCancelling && setConfirmCancel(false)}
        title={t("cancelTitle", { number: order.orderNumber })}
        description={t("cancelDescription")}
        confirmLabel={t("cancel")}
        cancelLabel={t("back")}
        destructive
        pending={isCancelling}
        onConfirm={cancelShipment}
      />
    </div>
  );
}
