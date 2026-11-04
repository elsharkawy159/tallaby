"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { addCrossSellToCart, getCrossSellOffers, type CrossSellCard } from "@/actions/cross-sell";
import { useCart } from "@/providers/cart-provider";

/**
 * "Frequently bought with" on a store's product page and in its cart (ROADMAP.md
 * F-32). Shows nothing when there are no offers. The discount shown is a preview:
 * checkout works it out again on the server.
 */
export function CrossSellOffers({
  mainProductIds,
  excludeProductIds = [],
  compact = false,
  placed = false,
}: {
  mainProductIds: string[];
  excludeProductIds?: string[];
  compact?: boolean;
  /** In the builder element, where the seller sets the space around it. */
  placed?: boolean;
}) {
  const key = [...mainProductIds].sort().join(",");
  const [offers, setOffers] = useState<CrossSellCard[]>([]);

  useEffect(() => {
    if (!key) {
      setOffers([]);
      return;
    }
    let stale = false;
    getCrossSellOffers(key.split(",")).then((rows) => {
      if (!stale) setOffers(rows);
    });
    return () => {
      stale = true;
    };
  }, [key]);

  const visible = offers.filter((offer) => !excludeProductIds.includes(offer.productId));
  const t = useTranslations("storefront.crossSell");
  if (visible.length === 0) return null;
  return (
    <section className={compact ? "border-t border-(--sf-line) py-3" : cn("rounded-2xl border border-(--sf-line) p-4", !placed && "mt-5")} aria-label={t("title")}>
      <h2 className="mb-2 text-sm font-semibold">{t("title")}</h2>
      <ul className="space-y-2.5">
        {visible.map((offer) => (
          <OfferRow key={offer.offerId} offer={offer} />
        ))}
      </ul>
    </section>
  );
}

function OfferRow({ offer }: { offer: CrossSellCard }) {
  const t = useTranslations("storefront.crossSell");
  const format = useFormatter();
  const { refreshCart } = useCart();
  const [variantId, setVariantId] = useState(offer.variants[0]?.id);
  const [pending, startTransition] = useTransition();
  const chosen = offer.variants.find((variant) => variant.id === variantId) ?? offer;
  const money = (piastres: number) => format.number(piastres / 100, { style: "currency", currency: "EGP" });
  const badge =
    offer.discountType === "percent"
      ? t("percentOff", { value: offer.discountValue })
      : t("amountOff", { value: money(Math.round(offer.discountValue * 100)) });

  const add = () =>
    startTransition(async () => {
      const result = await addCrossSellToCart(offer.offerId, variantId);
      if (result.success) {
        toast.success(t("added"));
        await refreshCart();
      } else {
        toast.error(t("failed"));
      }
    });

  return (
    <li className="flex items-center gap-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-(--sf-shelf)">
        <ImageWithFallback src={offer.image ?? ""} alt="" fill sizes="56px" className="object-contain p-1" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{offer.title}</p>
        <p className="text-xs">
          <span className="font-semibold">{money(chosen.discountedPiastres)}</span>{" "}
          <span className="text-(--sf-muted) line-through">{money(chosen.unitPiastres)}</span>{" "}
          <span className="text-(--sf-brand)">{badge}</span>
        </p>
        {offer.variants.length > 1 && (
          <select
            aria-label={t("chooseOption")}
            className="mt-1 h-8 max-w-full rounded-md border border-(--sf-line) bg-transparent px-1.5 text-xs"
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
          >
            {offer.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={add}>
        {t("add")}
      </Button>
    </li>
  );
}
