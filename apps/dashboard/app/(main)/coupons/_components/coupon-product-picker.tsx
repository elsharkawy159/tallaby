"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImageOff, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { searchCouponProducts, type CouponProductOption } from "@/actions/coupons";
import { formatMoney } from "@/lib/i18n/format";
import { RemoteImage } from "@/components/media/remote-image";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
};

const SEARCH_THRESHOLD = 6;
const SEARCH_DEBOUNCE_MS = 300;

export function CouponProductPicker({ selectedIds, onChange, invalid }: Props) {
  const t = useTranslations("coupons.form");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // The picker loads products as the seller types, not the whole catalog with the page.
  const [visible, setVisible] = useState<CouponProductOption[] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const firstLoad = useRef(true);
  const selectedRef = useRef(selectedIds);
  useEffect(() => {
    selectedRef.current = selectedIds;
  }, [selectedIds]);
  const search = query.trim();

  useEffect(() => {
    let live = true;
    const timer = setTimeout(
      () => {
        searchCouponProducts({ query: search, selectedIds: selectedRef.current })
          .then((found) => {
            if (!live) return;
            setVisible(found);
            if (!search && found.length > SEARCH_THRESHOLD) setShowSearch(true);
          })
          .catch(() => live && setVisible((current) => current ?? []));
      },
      firstLoad.current ? 0 : SEARCH_DEBOUNCE_MS,
    );
    firstLoad.current = false;
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [search]);

  const toggle = (id: string) =>
    onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  if (visible === null) {
    return <div className="h-32 animate-pulse rounded-lg bg-muted" aria-busy />;
  }

  if (visible.length === 0 && !search && !showSearch) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t("noProducts")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
          {selectedIds.length > 0
            ? t("selectedCount", { count: selectedIds.length })
            : t("selectedProductsHint")}
        </p>
        {showSearch && (
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-9 ps-9"
            />
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <ul
          aria-label={t("selectedProducts")}
          className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border p-1.5 sm:grid-cols-2"
        >
          {visible.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {p.image ? (
                      // Imported product images can be on any host; RemoteImage serves those as is.
                      <RemoteImage src={p.image} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-4" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{p.title}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {!p.isActive
                        ? t("notActive")
                        : p.price != null
                          ? formatMoney(p.price, locale)
                          : null}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background"
                    )}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
