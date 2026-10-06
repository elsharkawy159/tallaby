"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ImageOff, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type AdProductOption = {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  isActive: boolean;
  hasOpenRequest: boolean;
};

type Props = {
  products: AdProductOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Show the search box only once the grid is long enough to need it. */
const SEARCH_THRESHOLD = 6;

export function ProductPicker({ products, selectedId, onSelect }: Props) {
  const t = useTranslations("advertise.product");
  const tPackage = useTranslations("advertise.package");
  const [query, setQuery] = useState("");

  // Pickable products first, so the seller doesn't scroll past greyed-out ones.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || p.title.toLowerCase().includes(q))
      .sort((a, b) => Number(isPickable(b)) - Number(isPickable(a)));
  }, [products, query]);

  if (!products.some((p) => p.isActive)) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <Button asChild size="sm">
          <Link href="/products/add">{t("addProduct")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.length > SEARCH_THRESHOLD && (
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="ps-9"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div
          role="radiogroup"
          aria-label={t("search")}
          className="grid max-h-[26rem] grid-cols-2 gap-3 overflow-y-auto p-0.5 sm:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((p) => {
            const pickable = isPickable(p);
            const selected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!pickable}
                onClick={() => onSelect(p.id)}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
                  !pickable && "cursor-not-allowed opacity-50 hover:border-border"
                )}
              >
                <div className="relative aspect-square w-full bg-muted">
                  {p.image ? (
                    // Product images come from many hosts (imports), so skip next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-6" aria-hidden />
                    </span>
                  )}
                  {selected && (
                    <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-2.5">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                  {!p.isActive ? (
                    <p className="text-xs text-muted-foreground">{t("notActive")}</p>
                  ) : p.hasOpenRequest ? (
                    <p className="text-xs text-muted-foreground">{t("hasOpenRequest")}</p>
                  ) : p.price !== null ? (
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {p.price.toLocaleString()} {tPackage("currency")}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {products.some((p) => !p.isActive) && (
        <p className="text-xs text-muted-foreground">{t("inactiveHint")}</p>
      )}
    </div>
  );
}

function isPickable(p: AdProductOption) {
  return p.isActive && !p.hasOpenRequest;
}
