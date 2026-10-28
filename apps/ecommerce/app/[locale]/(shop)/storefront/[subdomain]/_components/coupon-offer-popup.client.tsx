"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Gift } from "lucide-react";
import { formatPricePlain } from "@workspace/lib";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { useStoreOffer } from "@/components/storefront/store-offer.client";
import {
  ENTER_DELAY_MS,
  EXIT_ARM_MS,
  isPhoneExitScroll,
  randomAtKey,
  randomDelay,
  readStorage,
  shownAtKey,
  writeStorage,
} from "@/components/storefront/store-offer.lib";
import { readShownAt } from "@workspace/lib/orders/coupon-popup";
import s from "../storefront.module.css";

/**
 * The seller's coupon pop-up (0114): "There's a special offer for you!",
 * the discount, the code with a copy button, and "Continue shopping". It
 * opens once per visitor, at the moment the seller picked; from then the
 * product pages count down the visitor's time to use it.
 */
export function CouponOfferPopup({ fontClassName }: { fontClassName: string }) {
  const t = useTranslations("storeOffer");
  const locale = useLocale();
  const currency = useCurrencyLabel();
  const state = useStoreOffer();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const offer = state?.offer;
  const seen = state?.shownAt != null;
  const reveal = state?.reveal;

  useEffect(() => {
    if (!offer || seen || !reveal) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      // Checked again here: another tab (or an earlier visit read late) may already have shown it.
      if (readShownAt(readStorage(() => window.localStorage, shownAtKey(offer.couponId)), Date.now()) != null) return;
      reveal();
      setOpen(true);
    };

    if (offer.trigger === "enter") {
      const timer = window.setTimeout(show, ENTER_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    if (offer.trigger === "random") {
      // One moment per browsing session, so moving between pages doesn't restart the wait.
      const key = randomAtKey(offer.couponId);
      let at = Number(readStorage(() => window.sessionStorage, key));
      if (!Number.isFinite(at) || at <= 0) {
        at = Date.now() + randomDelay(Math.random());
        writeStorage(() => window.sessionStorage, key, String(at));
      }
      const timer = window.setTimeout(show, Math.max(0, at - Date.now()));
      return () => window.clearTimeout(timer);
    }

    // "exit": the mouse leaving through the top of the window, or on phones a fast scroll back up.
    const armedAt = Date.now() + EXIT_ARM_MS;
    const onMouseOut = (event: MouseEvent) => {
      if (Date.now() < armedAt || event.relatedTarget || event.clientY > 0) return;
      show();
    };
    let maxY = window.scrollY;
    let last = { y: window.scrollY, at: performance.now() };
    const onScroll = () => {
      const y = window.scrollY;
      const at = performance.now();
      maxY = Math.max(maxY, y);
      if (Date.now() >= armedAt && isPhoneExitScroll(maxY, last.y, y, at - last.at)) show();
      // Measure each upward run from its start, not from the last scroll event.
      if (y >= last.y || at - last.at > 400) last = { y, at };
    };
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, [offer, seen, reveal]);

  if (!offer) return null;

  const discount =
    offer.discountType === "percentage"
      ? t("percentOff", { value: offer.discountValue })
      : t("amountOff", { value: formatPricePlain(offer.discountValue, locale, currency) });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: the code stays selectable on screen.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        data-sf-motion="off"
        className={cn(s.tokens, fontClassName, "max-w-sm gap-0 rounded-2xl bg-(--sf-paper) p-6 text-center text-(--sf-ink)")}
      >
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-(--sf-brand)/10 text-(--sf-brand)">
          <Gift className="size-7" aria-hidden />
        </span>
        <DialogTitle className="text-xl font-bold">{t("title")}</DialogTitle>
        <DialogDescription className="mt-2 text-base text-(--sf-ink)">{discount}</DialogDescription>

        <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-(--sf-brand) bg-(--sf-shelf) py-2 ps-4 pe-2">
          <span dir="ltr" className="min-w-0 truncate font-mono text-lg font-bold tracking-wider select-all">
            {offer.code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-(--sf-brand) transition-colors hover:bg-(--sf-brand)/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sf-brand)"
            aria-label={copied ? t("copied") : t("copy")}
          >
            {copied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
          </button>
        </div>
        <p aria-live="polite" className="mt-1 h-5 text-xs text-(--sf-muted)">
          {copied ? t("copied") : ""}
        </p>

        <Button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 h-11 w-full rounded-xl bg-(--sf-brand) text-base font-semibold text-(--sf-brand-ink) hover:bg-(--sf-brand)/90"
        >
          {t("continueShopping")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
