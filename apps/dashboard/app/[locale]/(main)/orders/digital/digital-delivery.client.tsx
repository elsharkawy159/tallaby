"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, Download, LoaderCircle, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { Modal, Note, SellerButton, Tag, type BadgeTone } from "@/components/seller-ui";
import { formatDate } from "@/lib/i18n/format";
import type { SellerOrderRow } from "../orders.types";
import { digitalLinkActions, type DigitalLinkStatus } from "./digital-delivery.lib";
import type { DigitalDeliveryView } from "./digital-delivery.query";
import {
  confirmDigitalPayment,
  createDigitalLinks,
  getDigitalLink,
  getDigitalWhatsAppLink,
  loadDigitalDelivery,
  makeNewDigitalLink,
  type DigitalViewResult,
} from "./digital-delivery.server";

const STATUS_TONE: Record<DigitalLinkStatus, BadgeTone> = {
  ready: "success",
  downloaded: "info",
  expired: "warning",
  revoked: "danger",
  pending: "muted",
};

/** Whether the order panel should ask the server for the digital part (a store order with a digital line, not a test). */
export function hasDigitalDelivery(order: SellerOrderRow): boolean {
  return Boolean(order.hasDigital && order.storeId && !order.isTest);
}

/** Copies text the server returns after the click; Safari needs the ClipboardItem promise form for that. */
async function copyFromServer(load: () => Promise<string | null>): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      let failed = false;
      const blob = load().then((text) => {
        if (!text) {
          failed = true;
          throw new Error("no link");
        }
        return new Blob([text], { type: "text/plain" });
      });
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return !failed;
    }
    const text = await load();
    if (!text) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Confirm = { kind: "payment" } | { kind: "new_link"; digitalOrderId: string; email: boolean };

/**
 * "Digital delivery" on the order panel (ROADMAP.md F-108d): confirm a
 * transfer, then send the one-time download link on WhatsApp, copy it, or
 * make a new one. Loads its state when the order opens; the links themselves
 * are fetched only when the seller presses Send or Copy.
 */
export function DigitalDeliveryPanel({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.digital");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [view, setView] = useState<DigitalDeliveryView | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const storeId = order.storeId;
  const enabled = hasDigitalDelivery(order);

  useEffect(() => {
    if (!enabled || !storeId) return;
    let live = true;
    loadDigitalDelivery({ storeId, orderId: order.id }).then((next) => live && setView(next));
    return () => {
      live = false;
    };
  }, [enabled, storeId, order.id]);

  if (!enabled || !storeId || !view) return null;
  const ids = { storeId, orderId: order.id };

  const apply = (result: DigitalViewResult, done: string) => {
    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    setView(result.view);
    toast.success(done);
    return true;
  };

  const runConfirm = () => {
    const current = confirm;
    if (!current) return;
    startTransition(async () => {
      if (current.kind === "payment") {
        if (apply(await confirmDigitalPayment(ids), t("paymentConfirmed"))) router.refresh();
      } else {
        const result = await makeNewDigitalLink({ ...ids, digitalOrderId: current.digitalOrderId, email: current.email });
        const done = !current.email ? t("newLinkDone") : result.success && result.emailed ? t("emailed") : t("emailFailed");
        apply(result, done);
      }
      setConfirm(null);
    });
  };

  const createLinks = () => startTransition(async () => void apply(await createDigitalLinks(ids), t("linksCreated")));

  const sendWhatsApp = () => {
    // Opened now, filled after the server answers: a window opened after an await is blocked as a pop-up.
    const win = window.open("about:blank", "_blank");
    startTransition(async () => {
      const result = await getDigitalWhatsAppLink(ids);
      if (!result.success) {
        win?.close();
        toast.error(result.error);
        return;
      }
      if (win) {
        win.opener = null;
        win.location.replace(result.url);
      } else {
        window.location.assign(result.url);
      }
    });
  };

  const copyLink = (digitalOrderId: string) =>
    startTransition(async () => {
      let error: string | null = null;
      const ok = await copyFromServer(async () => {
        const result = await getDigitalLink({ ...ids, digitalOrderId });
        if (!result.success) error = result.error;
        return result.success ? result.url : null;
      });
      if (ok) toast.success(t("copied"));
      else toast.error(error ?? t("copyFailed"));
    });

  const hasReady = view.links.some((link) => link.status === "ready");
  const busy = pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-(--s-text)">
        <Download className="size-4 text-(--s-subtle)" aria-hidden />
        {t("title")}
      </p>

      {view.stage === "awaiting_payment" && (
        <>
          <p className="text-xs leading-relaxed text-(--s-muted)">{t("awaitingPayment")}</p>
          <SellerButton size="sm" variant="solid" disabled={pending} onClick={() => setConfirm({ kind: "payment" })}>
            {busy ?? <Check aria-hidden />}
            {t("paymentReceived")}
          </SellerButton>
        </>
      )}
      {view.stage === "awaiting_online_payment" && <p className="text-xs leading-relaxed text-(--s-muted)">{t("awaitingOnline")}</p>}
      {view.stage === "closed" && <p className="text-xs leading-relaxed text-(--s-muted)">{t("closed")}</p>}
      {view.stage === "missing_links" && (
        <>
          <p className="text-xs leading-relaxed text-(--s-muted)">{t("missingLinks")}</p>
          <SellerButton size="sm" variant="solid" disabled={pending} onClick={createLinks}>
            {busy ?? <RefreshCw aria-hidden />}
            {t("createLinks")}
          </SellerButton>
        </>
      )}
      {view.undeliverableLines > 0 && <Note tone="amber">{t("undeliverable")}</Note>}

      {view.links.length > 0 && (
        <ul className="divide-y divide-(--s-line-soft) rounded-xl border border-(--s-line-soft)">
          {view.links.map((link) => {
            const actions = view.stage === "closed" ? [] : digitalLinkActions(link.status, { hasEmail: view.hasEmail });
            const date = link.expiresAt ? formatDate(link.expiresAt, locale, { dateStyle: "medium" }) : null;
            return (
              <li key={link.digitalOrderId} className="flex flex-col gap-2 p-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 flex-1 break-words text-[13px] font-semibold text-(--s-text)" dir="auto">
                    {link.productName}
                  </span>
                  <Tag tone={STATUS_TONE[link.status]}>{t(`status.${link.status}`)}</Tag>
                </div>
                {date && (link.status === "ready" || link.status === "expired") && (
                  <p className="text-xs text-(--s-subtle)">{t(link.status === "ready" ? "expires" : "expiredOn", { date })}</p>
                )}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {actions.includes("copy") && (
                      <SellerButton size="xs" variant="mini" disabled={pending} onClick={() => copyLink(link.digitalOrderId)}>
                        <Copy aria-hidden />
                        {t("copyLink")}
                      </SellerButton>
                    )}
                    {actions.includes("new_link") && (
                      <SellerButton
                        size="xs"
                        variant="mini"
                        disabled={pending}
                        onClick={() => setConfirm({ kind: "new_link", digitalOrderId: link.digitalOrderId, email: false })}
                      >
                        <RefreshCw aria-hidden />
                        {t("newLink")}
                      </SellerButton>
                    )}
                    {actions.includes("email_new_link") && (
                      <SellerButton
                        size="xs"
                        variant="mini"
                        disabled={pending}
                        onClick={() => setConfirm({ kind: "new_link", digitalOrderId: link.digitalOrderId, email: true })}
                      >
                        <Mail aria-hidden />
                        {t("emailNewLink")}
                      </SellerButton>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasReady && view.stage !== "closed" && (
        <>
          {view.hasPhone ? (
            <SellerButton size="sm" variant="whatsapp" disabled={pending} onClick={sendWhatsApp}>
              {busy ?? <MessageCircle aria-hidden />}
              {t("sendWhatsApp")}
            </SellerButton>
          ) : (
            <p className="text-xs text-(--s-subtle)">{t("noPhone")}</p>
          )}
          <p className="text-xs text-(--s-subtle)">{t("oneTimeHint")}</p>
        </>
      )}

      <Modal
        open={confirm != null}
        onOpenChange={(open) => !open && !pending && setConfirm(null)}
        title={confirm?.kind === "payment" ? t("confirmPaymentTitle") : t("newLinkTitle")}
        description={
          confirm?.kind === "payment"
            ? t("confirmPaymentBody")
            : t(confirm?.email ? "emailNewLinkBody" : "newLinkBody", { days: view.linkTtlDays })
        }
        footer={
          <>
            <SellerButton variant="outline" disabled={pending} onClick={() => setConfirm(null)}>
              {tCommon("cancel")}
            </SellerButton>
            <SellerButton variant="solid" disabled={pending} onClick={runConfirm}>
              {busy}
              {confirm?.kind === "payment"
                ? t("paymentReceived")
                : confirm?.email
                  ? t("emailNewLinkConfirm")
                  : t("newLinkConfirm")}
            </SellerButton>
          </>
        }
      />
    </div>
  );
}
