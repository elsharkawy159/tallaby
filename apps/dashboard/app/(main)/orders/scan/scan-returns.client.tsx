"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, CameraOff, ExternalLink, LoaderCircle, PackageX, ScanLine, Search } from "lucide-react";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { formatDateTime } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { Note, SellerButton, SellerCard, TextInput } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { OrderStageBadge } from "../order-stage-badge";
import { updateSellerOrder } from "../orders.server";
import { parseScannedOrderNumber } from "./scan-returns.lib";
import { findOrderForReturnScan } from "./scan-returns.server";
import type { ScannedOrder } from "./scan-returns.types";

/** The browser's BarcodeDetector (Chrome on Android, and others); not in the TS DOM types yet. */
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

/** Camera scanning needs both the detector and camera access (https). */
const subscribeNoop = () => () => {};
const cameraScanSupported = () =>
  Boolean(detectorCtor()) && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

type Phase = "idle" | "scanning" | "looking";

/**
 * Orders › Scan returns (ROADMAP.md F-04e). Phone-first: the camera reads the
 * Code 128 order number printed on the slip or invoice; typing it (or a USB
 * barcode scanner, which types and presses Enter) works everywhere. The order
 * is looked up only among the seller's own orders, and "Mark returned" is the
 * same step as on the order panel (updateSellerOrder, action "return").
 */
export function ScanReturnsView() {
  const t = useTranslations("scanReturns");
  const tActions = useTranslations("orders.actions");
  const tReadOnly = useTranslations("orders.errors.readOnly");
  const locale = useLocale();
  const canScan = useSyncExternalStore(subscribeNoop, cameraScanSupported, () => false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [order, setOrder] = useState<ScannedOrder | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stopCamera = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const lookup = useCallback(
    async (raw: string) => {
      const code = parseScannedOrderNumber(raw);
      if (!code) {
        setOrder(null);
        setLookupError(t("errors.invalid"));
        return;
      }
      setPhase("looking");
      setLookupError(null);
      const res = await findOrderForReturnScan(code);
      setPhase("idle");
      if (res.ok) {
        setOrder(res.order);
      } else {
        setOrder(null);
        setLookupError(t(`errors.${res.error}`, { number: code }));
      }
    },
    [t],
  );

  const startCamera = async () => {
    const Ctor = detectorCtor();
    if (!Ctor) return;
    setCameraError(null);
    setOrder(null);
    setLookupError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopCamera();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setPhase("scanning");

      const detector = new Ctor({ formats: ["code_128", "qr_code"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const found = await detector.detect(video);
          const value = found.map((b) => b.rawValue).find((v) => parseScannedOrderNumber(v));
          if (value) {
            stopCamera();
            navigator.vibrate?.(80);
            await lookup(value);
            return;
          }
        } catch {
          // A frame the detector could not read; keep going.
        }
        timerRef.current = setTimeout(tick, 200);
      };
      void tick();
    } catch (error) {
      stopCamera();
      setPhase("idle");
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setCameraError(t(denied ? "cameraDenied" : "cameraFailed"));
    }
  };

  const cancelScan = () => {
    stopCamera();
    setPhase("idle");
  };

  const markReturned = () => {
    if (!order) return;
    startTransition(async () => {
      const res = await updateSellerOrder({ orderId: order.id, action: "return" });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(tActions("done.return", { number: order.orderNumber }));
      setOrder({ ...order, stage: "returned", canReturn: false });
      setConfirming(false);
    });
  };

  const whyNot = (o: ScannedOrder) => {
    if (o.readOnly) return tReadOnly(o.readOnly);
    if (o.carrierManaged) return t("carrierManaged");
    if (o.stage === "returned") return t("alreadyReturned");
    return t("notReturnable");
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3.5">
      <p className="text-pretty text-[13.5px] text-(--s-muted)">{t("description")}</p>

      {/* Camera */}
      <SellerCard className="flex flex-col gap-3 p-4">
          <div
            className={cn(
              "relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black",
              phase !== "scanning" && "hidden",
            )}
          >
            <video ref={videoRef} className="size-full object-cover" playsInline muted />
            {/* Aim guide: a wide box for a 1-D barcode. */}
            <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-1/3 -translate-y-1/2 rounded-md border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            <div className="pointer-events-none absolute inset-x-[10%] top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500" />
          </div>

          {phase === "scanning" ? (
            <>
              <p className="text-center text-[13px] text-(--s-muted)">{t("aim")}</p>
              <SellerButton variant="outline" className="w-full" onClick={cancelScan}>
                <CameraOff aria-hidden />
                {t("stopCamera")}
              </SellerButton>
            </>
          ) : canScan ? (
            <SellerButton className="w-full" onClick={startCamera} disabled={phase === "looking"}>
              {order || lookupError ? <ScanLine aria-hidden /> : <Camera aria-hidden />}
              {order || lookupError ? t("scanNext") : t("startCamera")}
            </SellerButton>
          ) : (
            <Note>{t("noCamera")}</Note>
          )}
          {cameraError && <Note tone="danger">{cameraError}</Note>}

          {/* Typed, or a USB/Bluetooth scanner (types the code and presses Enter). */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (phase === "scanning") stopCamera();
              void lookup(manual);
            }}
          >
            <TextInput
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder={t("manualPlaceholder")}
              aria-label={t("manualLabel")}
              dir="ltr"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="font-montserrat uppercase"
            />
            <SellerButton type="submit" variant="solid" className="h-[46px]" disabled={phase === "looking"}>
              <Search aria-hidden />
              {t("find")}
            </SellerButton>
          </form>
      </SellerCard>

      {phase === "looking" && (
        <p className="flex items-center justify-center gap-2 text-[13px] text-(--s-muted)">
          <LoaderCircle className="size-4 animate-spin" />
          {t("looking")}
        </p>
      )}

      {lookupError && phase !== "looking" && (
        <Note tone="danger" icon={PackageX}>
          {lookupError}
        </Note>
      )}

      {order && phase !== "looking" && (
        <SellerCard className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-montserrat text-lg font-bold text-(--s-ink)" dir="ltr">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-(--s-subtle)">
                  {[order.storeName, order.createdAt ? formatDateTime(order.createdAt, locale) : null]
                    .filter(Boolean)
                    .join("، ")}
                </p>
              </div>
              <OrderStageBadge stage={order.stage} className="shrink-0" />
            </div>

            <dl className="flex flex-col gap-1.5 text-[13px]">
              {order.customerName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-(--s-subtle)">{t("customer")}</dt>
                  <dd className="min-w-0 break-words text-end font-semibold text-(--s-text)">{order.customerName}</dd>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex justify-between gap-3">
                  <dt className="text-(--s-subtle)">{t("phone")}</dt>
                  <dd className="font-montserrat font-semibold text-(--s-text) tabular-nums" dir="ltr">
                    {order.customerPhone}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-(--s-subtle)">{t("total")}</dt>
                <dd className="font-montserrat font-bold text-(--s-ink) tabular-nums" dir="ltr">
                  <Money value={order.total} locale={locale} unit={order} />
                </dd>
              </div>
            </dl>
            <p className="break-words rounded-2xl bg-(--s-tint) p-3 text-[13px] text-(--s-body)">
              <span className="font-semibold">{t("items", { count: order.itemCount })}: </span>
              {order.itemsSummary}
            </p>

            {order.canReturn ? (
              <SellerButton variant="danger" className="w-full" disabled={isPending} onClick={() => setConfirming(true)}>
                {tActions("return")}
              </SellerButton>
            ) : (
              <Note>{whyNot(order)}</Note>
            )}

            <SellerButton asChild variant="outline" className="w-full">
              <Link href={`/orders?order=${encodeURIComponent(order.id)}`}>
                <ExternalLink aria-hidden />
                {t("openOrder")}
              </Link>
            </SellerButton>
        </SellerCard>
      )}

      <ConfirmActionDialog
        open={confirming}
        onOpenChange={(open) => !open && !isPending && setConfirming(false)}
        title={order ? tActions("dialog.returnTitle", { number: order.orderNumber }) : ""}
        description={tActions("dialog.returnDescription")}
        confirmLabel={tActions("return")}
        cancelLabel={tActions("dialog.back")}
        destructive
        pending={isPending}
        onConfirm={markReturned}
      />
    </div>
  );
}
