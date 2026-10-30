"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, CameraOff, ExternalLink, LoaderCircle, PackageX, ScanLine, Search } from "lucide-react";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
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
    <div className="mx-auto w-full max-w-md space-y-4">
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>

      {/* Camera */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div
            className={cn(
              "relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black",
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
              <p className="text-center text-sm text-muted-foreground">{t("aim")}</p>
              <Button variant="outline" className="h-11 w-full" onClick={cancelScan}>
                <CameraOff className="size-4" />
                {t("stopCamera")}
              </Button>
            </>
          ) : canScan ? (
            <Button className="h-12 w-full text-base" onClick={startCamera} disabled={phase === "looking"}>
              {order || lookupError ? <ScanLine className="size-5" /> : <Camera className="size-5" />}
              {order || lookupError ? t("scanNext") : t("startCamera")}
            </Button>
          ) : (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{t("noCamera")}</p>
          )}
          {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}

          {/* Typed, or a USB/Bluetooth scanner (types the code and presses Enter). */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (phase === "scanning") stopCamera();
              void lookup(manual);
            }}
          >
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder={t("manualPlaceholder")}
              aria-label={t("manualLabel")}
              dir="ltr"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-11 uppercase"
            />
            <Button type="submit" variant="secondary" className="h-11 shrink-0" disabled={phase === "looking"}>
              <Search className="size-4" />
              {t("find")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {phase === "looking" && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {t("looking")}
        </p>
      )}

      {lookupError && phase !== "looking" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <PackageX className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p>{lookupError}</p>
          </CardContent>
        </Card>
      )}

      {order && phase !== "looking" && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold" dir="ltr">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[order.storeName, order.createdAt ? formatDateTime(order.createdAt, locale) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <OrderStageBadge stage={order.stage} className="shrink-0" />
            </div>

            <dl className="space-y-1.5 text-sm">
              {order.customerName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("customer")}</dt>
                  <dd className="text-end font-medium">{order.customerName}</dd>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("phone")}</dt>
                  <dd className="font-medium" dir="ltr">
                    {order.customerPhone}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("total")}</dt>
                <dd className="font-medium tabular-nums" dir="ltr">
                  {formatMoney(order.total, locale)}
                </dd>
              </div>
            </dl>
            <p className="rounded-md bg-muted/60 p-2 text-sm">
              <span className="font-medium">{t("items", { count: order.itemCount })}: </span>
              {order.itemsSummary}
            </p>

            {order.canReturn ? (
              <Button
                variant="destructive"
                className="h-12 w-full text-base"
                disabled={isPending}
                onClick={() => setConfirming(true)}
              >
                {tActions("return")}
              </Button>
            ) : (
              <p className="rounded-md border border-dashed p-2 text-sm text-muted-foreground">{whyNot(order)}</p>
            )}

            <Link
              href={`/orders?order=${encodeURIComponent(order.id)}`}
              className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
            >
              <ExternalLink className="size-4" />
              {t("openOrder")}
            </Link>
          </CardContent>
        </Card>
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
