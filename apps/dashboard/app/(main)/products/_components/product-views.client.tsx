"use client";

import { Suspense, createContext, use, useContext, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/i18n/format";
import {
  PRODUCT_VIEWS_DAYS,
  viewsToOrdersPercent,
  type ProductViewStats,
} from "@/lib/analytics/product-views.lib";

/**
 * Per-product views and views → orders (ROADMAP.md F-15b). The server hands
 * down an unresolved promise, so the products list renders at once and each
 * cell streams in when GA4 answers; "—" when GA4 is unavailable.
 */

const ProductViewsContext = createContext<Promise<ProductViewStats> | null>(null);

export function ProductViewsProvider({
  stats,
  children,
}: {
  stats: Promise<ProductViewStats>;
  children: ReactNode;
}) {
  return <ProductViewsContext.Provider value={stats}>{children}</ProductViewsContext.Provider>;
}

const Dash = () => <span className="text-faint">—</span>;

function percentText(percent: number, locale: string) {
  return formatNumber(percent, locale, { maximumFractionDigits: percent < 10 ? 1 : 0 });
}

function ViewsCellInner({ stats, productId }: { stats: Promise<ProductViewStats>; productId: string }) {
  const resolved = use(stats);
  const t = useTranslations("products.productViews");
  const locale = useLocale();
  if (!resolved) return <Dash />;
  const stat = resolved.byProduct[productId] ?? { views: 0, orders: 0 };
  const percent = viewsToOrdersPercent(stat.views, stat.orders);
  return (
    <div className="text-sm leading-tight">
      <div className="flex items-center gap-1 text-foreground">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span>{formatNumber(stat.views, locale)}</span>
      </div>
      {percent !== null ? (
        <div className="text-[11px] text-muted-foreground">
          {t("conversion", { percent: percentText(percent, locale) })}
        </div>
      ) : null}
    </div>
  );
}

/** Table cell: views over the period and, when there were views, the % that became orders. */
export function ProductViewsCell({ productId }: { productId: string }) {
  const stats = useContext(ProductViewsContext);
  if (!stats) return <Dash />;
  return (
    <Suspense fallback={<span className="inline-block h-3 w-10 animate-pulse rounded bg-muted" />}>
      <ViewsCellInner stats={stats} productId={productId} />
    </Suspense>
  );
}

/** Column header label, e.g. "Views (30 days)". */
export function useProductViewsColumnLabel() {
  const t = useTranslations("products.productViews");
  return t("column", { days: PRODUCT_VIEWS_DAYS });
}

function ViewsBadgeInner({ stats, productId }: { stats: Promise<ProductViewStats>; productId: string }) {
  const resolved = use(stats);
  const t = useTranslations("products.productViews");
  const locale = useLocale();
  if (!resolved) return null;
  const stat = resolved.byProduct[productId] ?? { views: 0, orders: 0 };
  const percent = viewsToOrdersPercent(stat.views, stat.orders);
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
      title={`${t("title", { days: resolved.days })} · ${t("hint")}`}
    >
      <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-foreground">{t("views", { count: stat.views })}</span>
      <span aria-hidden>·</span>
      <span>{t("orders", { count: stat.orders })}</span>
      {percent !== null ? (
        <>
          <span aria-hidden>·</span>
          <span>{t("conversion", { percent: percentText(percent, locale) })}</span>
        </>
      ) : null}
      <span className="hidden sm:inline">({t("period", { days: resolved.days })})</span>
    </div>
  );
}

/** Product page header stat: views, orders and views → orders over the period; hidden when GA4 is unavailable. */
export function ProductViewsBadge({ stats, productId }: { stats: Promise<ProductViewStats>; productId: string }) {
  return (
    <Suspense fallback={null}>
      <ViewsBadgeInner stats={stats} productId={productId} />
    </Suspense>
  );
}
