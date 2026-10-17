"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImageOff, LayoutGrid, ListChecks, LoaderCircle, Save, Search } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { BUTTON_CLASS, FIELD_CLASS, LabelNote, SMALL_BUTTON_CLASS, SectionCard } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { saveStoreCatalog } from "./catalog.server";
import type { CatalogMode, CatalogProduct } from "./catalog.dto";

const SHARED_ERRORS = new Set(["invalidInput", "readOnly", "notFound", "generic"]);

export function StoreCatalogForm({
  storeId,
  initialMode,
  initialSelected,
  products,
  maxProducts,
  readOnly,
}: {
  storeId: string;
  initialMode: CatalogMode;
  initialSelected: string[];
  products: CatalogProduct[];
  maxProducts: number;
  readOnly: boolean;
}) {
  const t = useTranslations("storeSettings");
  const locale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<CatalogMode>(initialMode);
  // Insertion order = the order the store lists its picks in.
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saved, setSaved] = useState({ mode: initialMode, selected: initialSelected });
  const [query, setQuery] = useState("");
  const disabled = readOnly || isPending;

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.ar.toLowerCase().includes(q) || p.title.en.toLowerCase().includes(q));
  }, [products, query]);

  const dirty = mode !== saved.mode || selected.length !== saved.selected.length || selected.some((id, i) => saved.selected[i] !== id);

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => (on ? (current.includes(id) ? current : [...current, id]) : current.filter((x) => x !== id)));

  const selectShown = () =>
    setSelected((current) => {
      const next = [...current];
      for (const p of shown) if (!next.includes(p.id)) next.push(p.id);
      return next.slice(0, maxProducts);
    });

  const clearShown = () => {
    const ids = new Set(shown.map((p) => p.id));
    setSelected((current) => current.filter((id) => !ids.has(id)));
  };

  const onSave = () =>
    startTransition(async () => {
      if (mode === "selected" && selected.length === 0) {
        toast.error(t("catalog.emptySelection"));
        return;
      }
      if (selected.length > maxProducts) {
        toast.error(t("catalog.tooMany", { max: maxProducts }));
        return;
      }
      const result = await saveStoreCatalog(storeId, { mode, productIds: selected });
      if (result.success) {
        toast.success(t("catalog.saved"));
        setSaved({ mode, selected });
        router.refresh();
      } else {
        toast.error(SHARED_ERRORS.has(result.error) ? t(`errors.${result.error}`) : t(`catalog.${result.error}`));
      }
    });

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <SectionCard id="catalog-mode" icon={LayoutGrid} title={t("catalog.title")} description={t("catalog.description")}>
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as CatalogMode)}
          disabled={disabled}
          className="grid gap-3 sm:grid-cols-2"
        >
          {(["all", "selected"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                mode === value ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              <RadioGroupItem value={value} className="mt-0.5" />
              <span className="space-y-1">
                <span className="block text-sm font-semibold">{t(value === "all" ? "catalog.modeAll" : "catalog.modeSelected")}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  {t(value === "all" ? "catalog.modeAllHint" : "catalog.modeSelectedHint")}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </SectionCard>

      {mode === "selected" && (
        <SectionCard
          id="catalog-products"
          icon={ListChecks}
          title={t("catalog.pickTitle")}
          description={t("catalog.pickDescription")}
          tag={<LabelNote>{t("catalog.selectedCount", { count: selected.length })}</LabelNote>}
        >
          {products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("catalog.noProducts")}</p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("catalog.search")}
                    aria-label={t("catalog.search")}
                    className={cn(FIELD_CLASS, "ps-9")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className={SMALL_BUTTON_CLASS} onClick={selectShown} disabled={disabled}>
                    {t("catalog.selectShown")}
                  </Button>
                  <Button type="button" variant="ghost" className={SMALL_BUTTON_CLASS} onClick={clearShown} disabled={disabled}>
                    {t("catalog.clearShown")}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground sm:hidden">{t("catalog.selectedCount", { count: selected.length })}</p>

              {shown.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("catalog.noMatches")}</p>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {shown.map((product) => {
                    const checked = selectedSet.has(product.id);
                    const title = product.title[locale] || product.title.ar || product.title.en;
                    return (
                      <li key={product.id}>
                        <label className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5", disabled && "cursor-not-allowed")}>
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(v) => toggle(product.id, v === true)}
                            aria-label={title}
                          />
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote storage thumbnails
                            <img src={product.image} alt="" className="size-10 shrink-0 rounded-md border object-cover" loading="lazy" />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                              <ImageOff className="size-4 text-muted-foreground" aria-hidden />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{title}</span>
                            {product.price != null && (
                              <span className="block text-xs text-muted-foreground tabular-nums">
                                {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP" }).format(product.price)}
                              </span>
                            )}
                          </span>
                          {product.status !== "active" && (
                            <Badge variant="secondary" className="shrink-0">
                              {t(`catalog.status.${product.status}`)}
                            </Badge>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              {products.length >= maxProducts && <p className="text-xs text-muted-foreground">{t("catalog.shownLimit", { max: maxProducts })}</p>}
            </>
          )}
        </SectionCard>
      )}

      <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-3 backdrop-blur">
        <Button type="button" className={BUTTON_CLASS} onClick={onSave} disabled={disabled || !dirty}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
