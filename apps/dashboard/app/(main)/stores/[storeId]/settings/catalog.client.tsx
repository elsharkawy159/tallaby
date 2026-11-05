"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ImageOff, LayoutGrid, ListChecks, Search } from "lucide-react";

import { EmptyState, InputGroup, OptionCard, OptionCards, Rows, SectionCard, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreCatalog } from "./catalog.server";
import type { CatalogMode, CatalogProduct } from "./catalog.dto";
import { RemoteImage } from "@/components/media/remote-image";

const SHARED_ERRORS = new Set(["invalidInput", "readOnly", "notFound", "generic"]);

export type StoreCatalogProps = {
  initialMode: CatalogMode;
  initialSelected: string[];
  products: CatalogProduct[];
  maxProducts: number;
};

/** Catalog state for the store settings form; saved by the form's single Save button. */
export function useStoreCatalog(storeId: string, { initialMode, initialSelected, maxProducts }: StoreCatalogProps) {
  const t = useTranslations("storeSettings");
  const [mode, setMode] = useState<CatalogMode>(initialMode);
  // Insertion order = the order the store lists its picks in.
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saved, setSaved] = useState({ mode: initialMode, selected: initialSelected });

  const dirty = mode !== saved.mode || selected.length !== saved.selected.length || selected.some((id, i) => saved.selected[i] !== id);

  /** Client-side checks; returns an error message or null. */
  const validate = () => {
    if (mode === "selected" && selected.length === 0) return t("catalog.emptySelection");
    if (selected.length > maxProducts) return t("catalog.tooMany", { max: maxProducts });
    return null;
  };

  /** Saves when dirty; returns an error message or null. */
  const save = async () => {
    if (!dirty) return null;
    const snapshot = { mode, selected };
    const result = await saveStoreCatalog(storeId, { mode: snapshot.mode, productIds: snapshot.selected });
    if (!result.success) return SHARED_ERRORS.has(result.error) ? t(`errors.${result.error}`) : t(`catalog.${result.error}`);
    setSaved(snapshot);
    return null;
  };

  /** Back to the last saved choice (the save bar's Discard). */
  const reset = () => {
    setMode(saved.mode);
    setSelected(saved.selected);
  };

  return { mode, setMode, selected, setSelected, dirty, validate, save, reset };
}

export type StoreCatalogState = ReturnType<typeof useStoreCatalog>;

export function StoreCatalogSections({
  money,
  catalog,
  products,
  maxProducts,
  disabled,
}: {
  money: { currency: string };
  catalog: StoreCatalogState;
  products: CatalogProduct[];
  maxProducts: number;
  disabled: boolean;
}) {
  const t = useTranslations("storeSettings");
  const locale = useLocale() === "en" ? "en" : "ar";
  const { mode, setMode, selected, setSelected } = catalog;
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.ar.toLowerCase().includes(q) || p.title.en.toLowerCase().includes(q));
  }, [products, query]);

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

  return (
    <>
      <SectionCard id="catalog-mode" icon={LayoutGrid} title={t("catalog.title")} description={t("catalog.description")}>
        <OptionCards>
          {(["all", "selected"] as const).map((value) => (
            <OptionCard
              key={value}
              name="catalog-mode"
              checked={mode === value}
              disabled={disabled}
              onChange={() => setMode(value)}
              title={t(value === "all" ? "catalog.modeAll" : "catalog.modeSelected")}
              description={t(value === "all" ? "catalog.modeAllHint" : "catalog.modeSelectedHint")}
            />
          ))}
        </OptionCards>
      </SectionCard>

      {mode === "selected" && (
        <SectionCard
          id="catalog-products"
          icon={ListChecks}
          title={
            <>
              {t("catalog.pickTitle")}
              <Tag tone="info">{t("catalog.selectedCount", { count: selected.length })}</Tag>
            </>
          }
          description={t("catalog.pickDescription")}
        >
          {products.length === 0 ? (
            <EmptyState icon={ListChecks} title={t("catalog.noProducts")} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <InputGroup
                  type="search"
                  className="min-w-[220px] flex-1"
                  start={<Search className="size-4" aria-hidden />}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("catalog.search")}
                  aria-label={t("catalog.search")}
                />
                <div className="flex gap-2 max-[600px]:w-full max-[600px]:[&>*]:flex-1">
                  <SellerButton variant="mini" size="sm" onClick={selectShown} disabled={disabled}>
                    {t("catalog.selectShown")}
                  </SellerButton>
                  <SellerButton variant="mini" size="sm" onClick={clearShown} disabled={disabled}>
                    {t("catalog.clearShown")}
                  </SellerButton>
                </div>
              </div>

              {shown.length === 0 ? (
                <EmptyState icon={Search} title={t("catalog.noMatches")} />
              ) : (
                <Rows>
                  {shown.map((product) => {
                    const checked = selectedSet.has(product.id);
                    const title = product.title[locale] || product.title.ar || product.title.en;
                    return (
                      <label
                        key={product.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)",
                          disabled && "cursor-not-allowed",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-5 shrink-0 accent-(--s-primary)"
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) => toggle(product.id, event.target.checked)}
                          aria-label={title}
                        />
                        {product.image ? (
                          <RemoteImage src={product.image} alt="" width={40} height={40} className="size-10 shrink-0 rounded-xl border border-(--s-line) object-cover" />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--s-fill) text-(--s-subtle)">
                            <ImageOff className="size-4" aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-sm font-bold text-(--s-text)">{title}</b>
                          {product.price != null && (
                            <small className="block font-montserrat text-xs text-(--s-subtle) tabular-nums">
                              {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: money.currency }).format(product.price)}
                            </small>
                          )}
                        </span>
                        {product.status !== "active" && <Tag>{t(`catalog.status.${product.status}`)}</Tag>}
                      </label>
                    );
                  })}
                </Rows>
              )}
              {products.length >= maxProducts && <p className="text-xs text-(--s-faint)">{t("catalog.shownLimit", { max: maxProducts })}</p>}
            </>
          )}
        </SectionCard>
      )}
    </>
  );
}
