"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { formatNumber } from "@/lib/i18n/format";
import { pageList } from "../products/_components/products-view.lib";

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
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
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
            <SelectTrigger className="h-9 w-20 rounded-[9px] bg-card" aria-label={t("perPage")}>
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
        <nav className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-[9px]"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
            aria-label={t("previousPage")}
          >
            <ChevronRight className="size-4 ltr:rotate-180" />
          </Button>
          {pageList(page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="grid h-9 min-w-6 place-items-center">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="size-9 rounded-[9px] text-[13px] tabular-nums"
                onClick={() => onPage(p)}
                aria-label={t("pageN", { page: p })}
                aria-current={p === page ? "page" : undefined}
              >
                {formatNumber(p, locale)}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-[9px]"
            disabled={page === pages}
            onClick={() => onPage(page + 1)}
            aria-label={t("nextPage")}
          >
            <ChevronLeft className="size-4 ltr:rotate-180" />
          </Button>
        </nav>
      )}
    </div>
  );
}
