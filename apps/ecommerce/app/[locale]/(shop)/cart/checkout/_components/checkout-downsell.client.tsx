"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { formatPriceMarked } from "@workspace/lib";
import type { CheckoutDownsell as Offer } from "@workspace/lib/downsell/server";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { Link } from "@/i18n/navigation";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { applyDownsellCoupon, getCheckoutDownsell, swapToDownsellProduct } from "@/actions/downsell";
import { EXIT_ARM_MS, isPhoneExitScroll, readStorage, writeStorage } from "@/components/storefront/store-offer.lib";
import { PriceText } from "@/components/storefront/price-text";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { useCart } from "@/providers/cart-provider";
import type { CheckoutSummary } from "@/lib/coupon-utils";

/** One showing per browser session (tab), for every store. */
const SHOWN_KEY = "tallaby:downsell:shown";
/** Away this long (another tab or app) counts as leaving on a phone. */
const AWAY_MS = 3000;

type AppliedCoupon = { code: string; name: string; discountType: string; discountValue?: string | number };

/**
 * Downsell on the store website's checkout (ROADMAP.md F-116). Loads the one
 * offer for this cart from the server (the store comes from the host), then
 * waits for the shopper to try to leave: on a computer the mouse leaving
 * through the top of the window; on a phone a fast scroll back up, or coming
 * back after switching to another app or tab. It opens once per session and
 * never while the order is being placed. The offer text is store data, shown
 * as text only.
 */
export function CheckoutDownsell({
  shippingAddressId,
  busy,
  onCouponApplied,
}: {
  shippingAddressId?: string;
  busy: boolean;
  onCouponApplied: (data: { coupon: AppliedCoupon; summary: CheckoutSummary }) => void;
}) {
  const t = useTranslations("checkout.downsell");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const currency = useCurrencyLabel();
  const { refreshCart } = useCart();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (readStorage(() => window.sessionStorage, SHOWN_KEY)) return;
    let live = true;
    getCheckoutDownsell()
      .then((found) => live && setOffer(found))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!offer) return;
    let done = false;
    const armedAt = Date.now() + EXIT_ARM_MS;
    const show = () => {
      if (done || busyRef.current || Date.now() < armedAt) return;
      if (readStorage(() => window.sessionStorage, SHOWN_KEY)) return;
      done = true;
      writeStorage(() => window.sessionStorage, SHOWN_KEY, "1");
      setOpen(true);
    };

    const onMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget || event.clientY > 0) return;
      show();
    };

    const phone = window.matchMedia?.("(pointer: coarse)").matches === true;
    let maxY = window.scrollY;
    let last = { y: window.scrollY, at: performance.now() };
    const onScroll = () => {
      const y = window.scrollY;
      const at = performance.now();
      maxY = Math.max(maxY, y);
      if (phone && isPhoneExitScroll(maxY, last.y, y, at - last.at)) show();
      if (y >= last.y || at - last.at > 400) last = { y, at };
    };

    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt !== null && Date.now() - hiddenAt >= AWAY_MS) show();
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [offer]);

  if (!offer) return null;
  const money = (minor: number) => formatPriceMarked(minor / 100, locale, currency);

  const takeProduct = () =>
    startTransition(async () => {
      const result = await swapToDownsellProduct(offer.lineId);
      if (!result.success) {
        toast.error(t("failed"));
        return;
      }
      toast.success(t("swapped"));
      await refreshCart();
      // The checkout keeps its lines in state: reload it with the new cart.
      window.location.reload();
    });

  const takeCoupon = () =>
    startTransition(async () => {
      const result = await applyDownsellCoupon({ lineId: offer.lineId, shippingAddressId: shippingAddressId || undefined });
      if (result.success && "data" in result && result.data?.summary?.appliedCoupon) {
        toast.success(tCheckout("couponApplied"));
        onCouponApplied({ coupon: result.data.summary.appliedCoupon, summary: result.data.summary });
        setOpen(false);
        return;
      }
      toast.error(t("failed"));
    });

  const item = offer.offer;
  const discount =
    item.kind === "coupon"
      ? item.discountType === "percentage"
        ? t("percentOff", { value: item.discountValue })
        : item.discountType === "free_shipping"
          ? t("freeShipping")
          : t("amountOff", { value: formatPriceMarked(item.discountValue, locale, currency) })
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm gap-0 rounded-2xl p-6 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gift className="size-6" aria-hidden />
        </span>
        <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
        {item.kind === "product" ? (
          <>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              {t("productBody", { product: offer.mainTitle })}
            </DialogDescription>
            <div className="mt-4 flex items-center gap-3 rounded-xl border p-3 text-start">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <ImageWithFallback src={item.image ?? ""} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold"><bdi>{item.title}</bdi></p>
                <p className="text-sm">
                  <PriceText locale={locale}>{money(item.unitMinor)}</PriceText>{" "}
                  <s className="text-xs text-muted-foreground"><PriceText locale={locale}>{money(item.mainUnitMinor)}</PriceText></s>
                </p>
              </div>
            </div>
            {item.hasVariants ? (
              <Button asChild className="mt-4 h-11 w-full rounded-xl text-base font-semibold">
                <Link href={`/products/${item.slug ?? item.productId}`}>{t("viewProduct")}</Link>
              </Button>
            ) : (
              <Button type="button" disabled={pending} onClick={takeProduct} className="mt-4 h-11 w-full rounded-xl text-base font-semibold">
                {t("swap")}
              </Button>
            )}
          </>
        ) : (
          <>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">{t("couponBody")}</DialogDescription>
            <p className="mt-3 text-xl font-bold text-primary"><PriceText locale={locale}>{discount ?? ""}</PriceText></p>
            <Button type="button" disabled={pending} onClick={takeCoupon} className="mt-4 h-11 w-full rounded-xl text-base font-semibold">
              {t("applyCoupon")}
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mt-2 h-10 w-full">
          {t("noThanks")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
