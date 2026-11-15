import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, CircleCheck, MessageCircleQuestion, PackageOpen, PackageX, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { IconTile, Note, SellerCard, SellerCardHeader, type Tone } from "@/components/seller-ui";
import { cn } from "@workspace/ui/lib/utils";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { formatNumber } from "@/lib/i18n/format";
import { selectedStoreProductsHref } from "@/lib/products/product-routes.server";
import { getHomeSnapshot, getPendingOrdersCount, LOW_STOCK_THRESHOLD } from "./home.queries";
import type { HomeChannel } from "./home.shared";

type Item = {
  key: "pendingOrders" | "lowStock" | "unansweredQuestions" | "newReviews";
  icon: LucideIcon;
  tone: Tone;
  href: string;
};

const ITEMS: Item[] = [
  { key: "pendingOrders", icon: PackageOpen, tone: "accent", href: "/orders" },
  // The selected store's Products page, filled in below (F-87c).
  { key: "lowStock", icon: PackageX, tone: "danger", href: "" },
  { key: "unansweredQuestions", icon: MessageCircleQuestion, tone: "info", href: "#questions" },
  { key: "newReviews", icon: Star, tone: "success", href: "/reviews" },
];

/** Open tasks the seller should act on, each linking to where it gets done. */
export async function AttentionData({ channel }: { channel: HomeChannel }) {
  // A seller who isn't activated doesn't see the orders line (ROADMAP.md F-68).
  const { ordersLocked: locked } = await currentOrderLock();
  const [snapshot, pendingOrders, t, locale, productsHref] = await Promise.all([
    getHomeSnapshot(),
    locked ? 0 : getPendingOrdersCount(channel),
    getTranslations("home.attention"),
    getLocale(),
    selectedStoreProductsHref(),
  ]);
  const counts = snapshot ? { ...snapshot.attention, pendingOrders } : null;
  const allClear = !counts || Object.values(counts).every((n) => n === 0);
  // The orders behind the count: the same store as the home page's filter.
  const ordersHref = channel === "all" ? "/orders" : `/orders?channel=${channel}`;

  return (
    <SellerCard aria-labelledby="attention-title">
      <SellerCardHeader id="attention-title" title={t("title")} description={t("description")} />
      <ul className="flex flex-col gap-1 px-3 pb-4 pt-3.5">
        {ITEMS.filter((item) => !locked || item.key !== "pendingOrders").map((item) => {
          const count = counts?.[item.key] ?? 0;
          // Nothing to answer means no questions card to jump to.
          const href = item.key === "pendingOrders" ? ordersHref : item.key === "unansweredQuestions" && !count ? "/reviews" : item.key === "lowStock" ? productsHref : item.href;
          return (
            <li key={item.key}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-2xl p-2.5 text-inherit no-underline transition-colors duration-150 hover:bg-(--s-tint)"
              >
                <IconTile icon={item.icon} tone={item.tone} />
                <span className="min-w-0 flex-1">
                  <b className="block text-[13.5px] font-bold text-(--s-text)">{t(`${item.key}.title`)}</b>
                  <small className="text-xs text-(--s-subtle)">
                    {t(`${item.key}.description`, { threshold: LOW_STOCK_THRESHOLD })}
                  </small>
                </span>
                <span
                  className={cn(
                    "min-w-[26px] text-center font-montserrat text-[15px] font-bold tabular-nums",
                    count ? "text-(--s-ink)" : "text-(--s-faint)",
                  )}
                >
                  {formatNumber(count, locale)}
                </span>
                <ChevronLeft className="size-4 shrink-0 text-(--s-field-strong) ltr:rotate-180" aria-hidden />
              </Link>
            </li>
          );
        })}
        {allClear && (
          <li className="mx-2.5 mt-1.5">
            <Note tone="success" icon={CircleCheck} className="font-semibold">
              {t("allClear")}
            </Note>
          </li>
        )}
      </ul>
    </SellerCard>
  );
}
