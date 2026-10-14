import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ChevronLeft, MessageCircleQuestion, PackageCheck, PackageX, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/i18n/format";
import { getHomeSnapshot, LOW_STOCK_THRESHOLD } from "./home.queries";
import { HomeCard, HomeCardHeader, IconTile, type Tone } from "./home-ui";

type Item = {
  key: "pendingOrders" | "lowStock" | "unansweredQuestions" | "newReviews";
  icon: LucideIcon;
  tone: Tone;
  href: string;
};

const ITEMS: Item[] = [
  { key: "pendingOrders", icon: PackageCheck, tone: "accent", href: "/orders" },
  { key: "lowStock", icon: PackageX, tone: "danger", href: "/products" },
  { key: "unansweredQuestions", icon: MessageCircleQuestion, tone: "primary", href: "#questions" },
  { key: "newReviews", icon: Star, tone: "success", href: "/reviews" },
];

/** Open tasks the seller should act on, each linking to where it gets done. */
export async function AttentionData() {
  const [snapshot, t, locale] = await Promise.all([
    getHomeSnapshot(),
    getTranslations("home.attention"),
    getLocale(),
  ]);
  const counts = snapshot?.attention;
  const allClear = !counts || Object.values(counts).every((n) => n === 0);

  return (
    <HomeCard aria-labelledby="attention-title">
      <HomeCardHeader id="attention-title" title={t("title")} description={t("description")} />
      <ul className="flex flex-col gap-0.5 px-3 pb-3 pt-2.5">
        {ITEMS.map((item) => {
          const count = counts?.[item.key] ?? 0;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <IconTile icon={item.icon} tone={item.tone} />
                <span className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold leading-normal">{t(`${item.key}.title`)}</b>
                  <small className="text-xs text-muted-foreground">
                    {t(`${item.key}.description`, { threshold: LOW_STOCK_THRESHOLD })}
                  </small>
                </span>
                <span
                  className={cn(
                    "min-w-6 text-center font-montserrat text-lg tabular-nums",
                    count ? "font-extrabold" : "font-semibold text-faint"
                  )}
                >
                  {formatNumber(count, locale)}
                </span>
                <ChevronLeft className="size-4 text-faint ltr:rotate-180" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
      {allClear && (
        <div className="mx-5 mb-[18px] flex items-center gap-2.5 rounded-xl bg-success-soft px-3.5 py-3 text-[13px] font-medium text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          {t("allClear")}
        </div>
      )}
    </HomeCard>
  );
}
