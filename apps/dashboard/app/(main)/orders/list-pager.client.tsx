"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { formatNumber } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { pageList } from "@/app/(main)/stores/[storeId]/products/_components/products-view.lib";

const PAGE_BUTTON =
  "grid h-10 min-w-10 cursor-pointer place-items-center rounded-xl border border-(--s-field) bg-(--s-surface) px-2.5 font-montserrat text-[13px] font-bold tabular-nums text-(--s-body) transition-colors duration-150 hover:border-(--s-outline-hover) disabled:cursor-not-allowed disabled:opacity-40";

/** Range, page size and page numbers under a server-paged list (same look as /products). */
export function ListPager({
  page,
  pages,
  size,
  sizes,
  total,
  onPage,
  onSize,
}: {
  page: number;
  pages: number;
  size: number;
  sizes: readonly number[];
  total: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const t = useTranslations("products.list");
  const locale = useLocale();
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-(--s-muted)">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tabular-nums">
          {t("range", {
            from: formatNumber(from, locale),
            to: formatNumber(to, locale),
            total: formatNumber(total, locale),
          })}
        </span>
        <div className="flex items-center gap-2">
          <span>{t("perPage")}</span>
          <Select value={String(size)} onValueChange={(value) => onSize(Number(value))}>
            <SelectTrigger className="h-10 w-20 rounded-xl border-(--s-field) bg-(--s-surface) shadow-none" aria-label={t("perPage")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {formatNumber(option, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {pages > 1 && (
        <nav className="flex flex-wrap gap-1">
          <button type="button" className={PAGE_BUTTON} disabled={page === 1} onClick={() => onPage(page - 1)} aria-label={t("previousPage")}>
            <ChevronRight className="size-4 ltr:rotate-180" />
          </button>
          {pageList(page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="grid h-10 min-w-6 place-items-center">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={cn(PAGE_BUTTON, p === page && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg)")}
                onClick={() => onPage(p)}
                aria-label={t("pageN", { page: p })}
                aria-current={p === page ? "page" : undefined}
              >
                {formatNumber(p, locale)}
              </button>
            ),
          )}
          <button type="button" className={PAGE_BUTTON} disabled={page === pages} onClick={() => onPage(page + 1)} aria-label={t("nextPage")}>
            <ChevronLeft className="size-4 ltr:rotate-180" />
          </button>
        </nav>
      )}
    </div>
  );
}
