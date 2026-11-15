"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ProductThumb } from "./product-thumb";
import { RadioDot } from "./radio-dot";

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
        <Button asChild size="sm" variant="secondary">
          <Link href="/products/add">{t("addProduct")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="h-10.5 ps-9"
        />
      </div>

      <div
        role="radiogroup"
        aria-label={t("search")}
        className="grid max-h-90 grid-cols-1 gap-2.5 overflow-y-auto p-0.5 sm:grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] max-sm:max-h-none"
      >
        {visible.length === 0 ? (
          <p className="col-span-full py-7 text-center text-sm text-muted-foreground">{t("noResults")}</p>
        ) : (
          visible.map((p) => {
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
                  "flex items-center gap-3 rounded-xl border-[1.5px] bg-card p-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
                  selected ? "border-primary bg-primary-soft" : "border-border hover:border-input",
                  !pickable && "cursor-not-allowed opacity-50"
                )}
              >
                <ProductThumb image={p.image} size={52} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px] font-semibold">{p.title}</b>
                  <small className="block text-xs text-muted-foreground">
                    {!p.isActive
                      ? t("notActive")
                      : p.hasOpenRequest
                        ? t("hasOpenRequest")
                        : p.price !== null
                          ? `${p.price.toLocaleString()} ${tPackage("currency")}`
                          : null}
                  </small>
                </span>
                <RadioDot checked={selected} className="ms-1" />
              </button>
            );
          })
        )}
      </div>

      {products.some((p) => !p.isActive) && (
        <p className="text-xs text-muted-foreground">{t("inactiveHint")}</p>
      )}
    </div>
  );
}

function isPickable(p: AdProductOption) {
  return p.isActive && !p.hasOpenRequest;
}
