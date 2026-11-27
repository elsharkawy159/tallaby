"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BUNDLE_MAX_ITEMS, BUNDLE_MAX_ITEM_QUANTITY, bundleAvailability } from "@workspace/lib/products/bundles";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { formatNumber } from "@/lib/i18n/format";
import { toAsciiDigits } from "@/components/form/form-ui";
import { useProductStoreId } from "@/app/[locale]/(main)/stores/[storeId]/products/_components/product-store.client";
import { bundleZeroReason } from "./bundle.lib";
import {
  saveBundle,
  searchBundleItems,
  type BundleItemOption,
  type BundleState,
  type BundleVariantOption,
} from "./bundle.server";

type Draft = {
  key: number;
  productId: string;
  title: string;
  sku: string | null;
  variants: BundleVariantOption[];
  variantId: string | null;
  quantity: string;
  trackStock: boolean;
  /** The product's own stock (used when it has no variants). */
  productStock: number;
  trashed: boolean;
  /** Became a pre-order or digital after it was added: the bundle can't be sold (F-07f). */
  preorder: boolean;
  digital: boolean;
};

function toDrafts(state: BundleState): Draft[] {
  return state.items.map((item, index) => ({
    key: index,
    productId: item.productId,
    title: item.title,
    sku: item.sku,
    variants: item.variants,
    variantId: item.variantId,
    quantity: String(item.quantity),
    trackStock: item.trackStock,
    productStock: item.variantId ? 0 : (item.stock ?? 0),
    trashed: item.trashed,
    preorder: item.preorder,
    digital: item.digital,
  }));
}

const draftStock = (draft: Draft): number | null =>
  draft.variantId ? (draft.variants.find((variant) => variant.id === draft.variantId)?.stock ?? null) : draft.productStock;

/** "This product is a bundle" (ROADMAP.md F-07f): its items, their stock and how many bundles can be sold. */
export function BundleSection({ productId, initial }: { productId: string; initial: BundleState }) {
  const t = useTranslations("productBundle");
  const locale = useLocale();
  const storeId = useProductStoreId();
  const [saved, setSaved] = useState(initial);
  const [enabled, setEnabled] = useState(initial.isBundle);
  const [items, setItems] = useState<Draft[]>(() => toDrafts(initial));
  const [nextKey, setNextKey] = useState(initial.items.length);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<BundleItemOption[]>([]);
  const [pending, startTransition] = useTransition();

  const text = query.trim();
  const full = items.length >= BUNDLE_MAX_ITEMS;

  useEffect(() => {
    if (text.length < 2 || full) return;
    let stale = false;
    const timer = setTimeout(() => {
      searchBundleItems({ storeId, productId, query: text }).then((rows) => {
        if (!stale) setOptions(rows);
      });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [text, full, productId, storeId]);

  // A product without variants can be in the bundle once; one with variants once per variant.
  const shown = text.length >= 2 && !full ? options.filter((option) => option.variants.length > 0 || !items.some((item) => item.productId === option.id)) : [];

  const available = useMemo(
    () =>
      bundleAvailability(
        items.map((item) => ({
          quantity: Number(item.quantity) || 0,
          trackStock: item.trackStock,
          stock: draftStock(item),
          trashed: item.trashed,
          hasVariants: item.variants.length > 0,
          variantId: item.variantId,
          preorder: item.preorder,
          digital: item.digital,
        })),
      ),
    [items],
  );
  const zero = bundleZeroReason(
    available,
    items.map((item) => ({
      hasVariants: item.variants.length > 0,
      variantId: item.variantId,
      trashed: item.trashed,
      preorder: item.preorder,
      digital: item.digital,
    })),
  );

  const patch = (key: number, change: Partial<Draft>) => setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));

  const move = (index: number, by: -1 | 1) =>
    setItems((rows) => {
      const next = [...rows];
      const target = index + by;
      if (target < 0 || target >= next.length) return rows;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const add = (option: BundleItemOption) => {
    setItems((rows) => [
      ...rows,
      {
        key: nextKey,
        productId: option.id,
        title: option.title,
        sku: option.sku,
        variants: option.variants,
        // One variant: chosen for the seller. Several: the seller picks.
        variantId: option.variants.length === 1 ? option.variants[0]!.id : null,
        quantity: "1",
        trackStock: option.trackStock,
        productStock: option.stock,
        trashed: false,
        // The search lists no pre-order or digital product.
        preorder: false,
        digital: false,
      },
    ]);
    setNextKey((key) => key + 1);
    setQuery("");
    setOptions([]);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveBundle({
        storeId,
        productId,
        isBundle: enabled,
        items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: Number(item.quantity) })),
      });
      if (result.success) {
        setSaved(result.state);
        setEnabled(result.state.isBundle);
        setItems(toDrafts(result.state));
        setNextKey(result.state.items.length);
        toast.success(t("saved"));
      } else {
        toast.error(t(`errors.${result.error}`, { max: BUNDLE_MAX_ITEMS, maxQuantity: BUNDLE_MAX_ITEM_QUANTITY }));
      }
    });

  const blocked = !saved.isBundle ? saved.blocked : null;
  const stockLabel = (item: Draft) => {
    if (!item.trackStock) return t("unlimitedStock");
    if (item.variants.length > 0 && !item.variantId) return t("chooseVariantFirst");
    return t("inStock", { count: formatNumber(draftStock(item) ?? 0, locale) });
  };

  return (
    <section className="rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[22px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px] max-[600px]:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16.5px] font-bold text-(--s-ink)">{t("title")}</h2>
          <p className="mt-0.5 text-pretty text-[13px] leading-relaxed text-(--s-muted)">{t("description")}</p>
        </div>
        <Switch
          aria-label={t("toggle")}
          checked={enabled}
          disabled={pending || (blocked !== null && !enabled)}
          onCheckedChange={setEnabled}
        />
      </div>

      {blocked && !enabled ? <p className="mt-2 text-[13px] text-(--s-muted)">{t(`blocked.${blocked}`)}</p> : null}

      {enabled ? (
        <>
          <p className="mt-3 rounded-[14px] bg-(--s-fill) p-3 text-pretty text-[13px] leading-relaxed text-(--s-body)">{t("note")}</p>

          {items.length > 0 && (
            <ul className="mt-3 divide-y">
              {items.map((item, index) => (
                <li key={item.key} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium">{item.title || item.sku || t("untitled")}</p>
                    <p className={item.trashed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                      {item.trashed ? t("trashedItem") : stockLabel(item)}
                    </p>
                  </div>
                  {item.variants.length > 0 && (
                    <select
                      aria-label={t("variant")}
                      className="h-10 min-w-0 max-w-[180px] rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-2 text-sm text-(--s-text)"
                      value={item.variantId ?? ""}
                      onChange={(event) => patch(item.key, { variantId: event.target.value || null })}
                    >
                      <option value="">{t("chooseVariant")}</option>
                      {item.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title || variant.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  )}
                  <Input
                    aria-label={t("quantity")}
                    className="w-[72px]"
                    inputMode="numeric"
                    dir="ltr"
                    value={item.quantity}
                    onChange={(event) => patch(item.key, { quantity: toAsciiDigits(event.target.value).replace(/\D/g, "").slice(0, 2) })}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label={t("moveUp")} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveDown")}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                    onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="relative mt-3">
            <Input
              placeholder={full ? t("full", { max: BUNDLE_MAX_ITEMS }) : t("search")}
              aria-label={t("search")}
              disabled={full}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {shown.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                {shown.map((option) => (
                  <li key={option.id}>
                    <button type="button" className="w-full truncate rounded-lg p-2 text-start text-sm hover:bg-muted" onClick={() => add(option)}>
                      {option.title || option.sku || t("untitled")}
                      {option.sku ? <span className="ms-2 text-xs text-muted-foreground" dir="ltr">{option.sku}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("rules", { max: BUNDLE_MAX_ITEMS, maxQuantity: BUNDLE_MAX_ITEM_QUANTITY })}</p>

          <p className="mt-3 text-sm font-semibold text-(--s-ink)">
            {available === null ? t("availableUnlimited") : t("available", { count: available, formatted: formatNumber(available, locale) })}
          </p>
          {zero ? <p className="text-xs text-muted-foreground">{t(`zero.${zero}`)}</p> : null}
        </>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" disabled={pending || (enabled === saved.isBundle && !enabled)} onClick={save}>
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
