"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellRing, LoaderCircle, Send } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { PUSH_CATEGORIES, type PushCategory, type PushPrefs } from "@/lib/push/push-alerts.lib";
import { SMALL_BUTTON_CLASS, SectionCard } from "./settings-ui";
import {
  removePushSubscriptionAction,
  savePushPrefsAction,
  savePushSubscriptionAction,
  sendTestPushAction,
} from "./push-alerts.server";

/** Categories with no notification type yet ("Soon" badge, switch disabled). Low stock arrived with F-10 (0125). */
const SOON: ReadonlySet<PushCategory> = new Set<PushCategory>([]);

type Support = "checking" | "unsupported" | "iosInstall" | "supported";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function registerWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/**
 * Settings › Phone alerts (ROADMAP.md F-06): turn push on or off for this
 * browser, and the per-type switches (shared by all the seller's devices).
 * On iOS, push works only in the installed app (iOS 16.4+), so Safari shows
 * an install hint instead of the button.
 */
export function PushAlertsSection({ publicKey, initialPrefs }: { publicKey: string; initialPrefs: PushPrefs }) {
  const t = useTranslations("pushAlerts");
  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [prefs, setPrefs] = useState<PushPrefs>(initialPrefs);
  const [busy, startBusy] = useTransition();
  const [testing, startTesting] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const capable = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!capable) {
        if (!cancelled) setSupport(isIos() && !isStandalone() ? "iosInstall" : "unsupported");
        return;
      }
      setPermission(Notification.permission);
      try {
        const registration = await registerWorker();
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;
        setSubscription(existing);
        setSupport("supported");
        // Keep the saved device current (language, owner after an account switch).
        if (existing && Notification.permission === "granted") void savePushSubscriptionAction(existing.toJSON());
      } catch {
        if (!cancelled) setSupport("unsupported");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = () =>
    startBusy(async () => {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          toast.error(t("errors.denied"));
          return;
        }
        const registration = await registerWorker();
        await navigator.serviceWorker.ready;
        const sub =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }));
        const saved = await savePushSubscriptionAction(sub.toJSON());
        if (!saved.success) {
          await sub.unsubscribe().catch(() => undefined);
          toast.error(t(`errors.${saved.error}`));
          return;
        }
        setSubscription(sub);
        toast.success(t("turnedOn"));
      } catch {
        toast.error(t("errors.generic"));
      }
    });

  const turnOff = () =>
    startBusy(async () => {
      const sub = subscription;
      if (!sub) return;
      try {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
        setSubscription(null);
        toast.success(t("turnedOff"));
      } catch {
        toast.error(t("errors.generic"));
      }
    });

  const sendTest = () =>
    startTesting(async () => {
      const result = await sendTestPushAction();
      if (result.success) toast.success(t("testSent"));
      else toast.error(t(`errors.${result.error === "generic" ? "testFailed" : result.error}`));
    });

  const setPref = useCallback(
    (category: PushCategory, value: boolean) => {
      const previous = prefs;
      const next = { ...prefs, [category]: value };
      setPrefs(next);
      void savePushPrefsAction(next).then((result) => {
        if (!result.success) {
          setPrefs(previous);
          toast.error(t(`errors.${result.error}`));
        }
      });
    },
    [prefs, t],
  );

  const on = Boolean(subscription) && permission === "granted";

  return (
    <SectionCard id="push-alerts" icon={BellRing} title={t("title")} description={t("description")}>
      {support === "checking" ? (
        <p className="text-[13px] text-muted-foreground">{t("checking")}</p>
      ) : support === "iosInstall" ? (
        <p className="rounded-xl bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">{t("iosHint")}</p>
      ) : support === "unsupported" ? (
        <p className="text-[13px] text-muted-foreground">{t("unsupported")}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{on ? t("statusOn") : t("statusOff")}</p>
            <div className="flex flex-wrap gap-2">
              {on ? (
                <>
                  <Button variant="neutral" className={SMALL_BUTTON_CLASS} disabled={testing} onClick={sendTest}>
                    {testing ? <LoaderCircle className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
                    {t("sendTest")}
                  </Button>
                  <Button variant="neutral" className={SMALL_BUTTON_CLASS} disabled={busy} onClick={turnOff}>
                    {busy ? <LoaderCircle className="animate-spin" /> : null}
                    {t("turnOff")}
                  </Button>
                </>
              ) : (
                <Button className={SMALL_BUTTON_CLASS} disabled={busy || permission === "denied"} onClick={turnOn}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <BellRing />}
                  {t("turnOn")}
                </Button>
              )}
            </div>
          </div>
          {permission === "denied" ? (
            <p className="text-[13px] text-destructive">{t("blocked")}</p>
          ) : null}
          <ul className="flex flex-col divide-y rounded-xl border">
            {PUSH_CATEGORIES.map((category) => {
              const soon = SOON.has(category);
              const id = `push-pref-${category}`;
              return (
                <li key={category} className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <label htmlFor={id} className="min-w-0">
                    <span className="block text-[13px] font-semibold">
                      {t(`types.${category}.title`)}
                      {soon ? (
                        <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {t("soon")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">{t(`types.${category}.description`)}</span>
                  </label>
                  <Switch
                    id={id}
                    checked={prefs[category]}
                    disabled={soon}
                    onCheckedChange={(value) => setPref(category, value)}
                  />
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">{t("allDevices")}</p>
        </>
      )}
    </SectionCard>
  );
}
