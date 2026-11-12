"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, LoaderCircle, Search, X } from "lucide-react";

import type { StoreSizeChart } from "@workspace/lib/size-charts/server";
import { searchCouponProducts, type CouponProductOption } from "@/actions/coupons";
import { CheckRow, Field, InputGroup, Modal, SellerButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveSizeChartTargets } from "./size-chart.server";
import type { SizeChartCategoryOption } from "./size-chart.dto";
import { pickText } from "./size-chart-form.lib";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * "Apply to" for one chart (F-92): whole store categories and single
 * products of this store. The product search is the coupon picker's
 * (`searchCouponProducts`: only this store's products). A product's own
 * chart beats its category's; one already on another chart moves here.
 */
export function SizeChartTargets(props: {
  storeId: string;
  chart: StoreSizeChart | null;
  categories: SizeChartCategoryOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Keyed by chart: each opening starts from what that chart is applied to now.
  return props.chart ? <TargetsDialog key={props.chart.id} {...props} chart={props.chart} /> : null;
}

function TargetsDialog({
  storeId,
  chart,
  categories,
  onClose,
  onSaved,
}: {
  storeId: string;
  chart: StoreSizeChart;
  categories: SizeChartCategoryOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("sizeChartApp.targets");
  const tErr = useTranslations("sizeChartApp.errors");
  const locale = useLocale();
  const [categoryIds, setCategoryIds] = useState<string[]>(chart.categoryIds);
  const [chosen, setChosen] = useState<{ id: string; title: string }[]>(chart.products);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<CouponProductOption[] | null>(null);
  const [saving, startSave] = useTransition();

  const search = query.trim();
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      searchCouponProducts({ storeId, query: search })
        .then((rows) => live && setFound(rows))
        .catch(() => live && setFound([]));
    }, search ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [search, storeId]);

  const isChosen = (id: string) => chosen.some((product) => product.id === id);
  const toggleProduct = (product: { id: string; title: string }) =>
    setChosen((list) => (list.some((p) => p.id === product.id) ? list.filter((p) => p.id !== product.id) : [...list, { id: product.id, title: product.title }]));

  const save = () => {
    startSave(async () => {
      const result = await saveSizeChartTargets(storeId, chart.id, { productIds: chosen.map((p) => p.id), categoryIds });
      if (!result.success) {
        toast.error(tErr(result.error));
        return;
      }
      toast.success(result.data.moved ? t("savedMoved", { count: result.data.moved }) : t("saved"));
      onSaved();
    });
  };

  return (
    <Modal
      open
      onOpenChange={(next) => !next && onClose()}
      title={t("title", { chart: pickText(chart.name, locale) })}
      description={t("description")}
      width={600}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose}>
            {t("cancel")}
          </SellerButton>
          <SellerButton variant="solid" onClick={save} disabled={saving}>
            {saving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
        </>
      }
    >
      <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto pe-1">
        <Field label={t("categories")} note={categories.length ? t("categoriesNote") : t("noCategories")}>
          {categories.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,180px),1fr))] gap-2">
              {categories.map((category) => (
                <CheckRow
                  key={category.id}
                  label={<bdi>{category.name}</bdi>}
                  checked={categoryIds.includes(category.id)}
                  onChange={(e) => setCategoryIds((ids) => (e.target.checked ? [...ids, category.id] : ids.filter((id) => id !== category.id)))}
                />
              ))}
            </div>
          )}
        </Field>

        <Field label={t("products")} note={t("productsNote")}>
          {chosen.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chosen.map((product) => (
                <span key={product.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-(--s-tint) py-1 ps-3 pe-1 text-xs font-semibold text-(--s-ink)">
                  <bdi className="truncate">{product.title || "—"}</bdi>
                  <button type="button" aria-label={t("remove")} onClick={() => toggleProduct(product)} className="grid size-6 cursor-pointer place-items-center rounded-full hover:bg-black/5">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
          <InputGroup
            start={<Search aria-hidden />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          <ul className="flex flex-col divide-y divide-(--s-line-soft) rounded-2xl border border-(--s-line)">
            {found === null ? (
              <li className="grid place-items-center p-4">
                <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />
              </li>
            ) : found.length === 0 ? (
              <li className="p-4 text-center text-xs text-(--s-subtle)">{t("noProducts")}</li>
            ) : (
              found.map((product) => {
                const on = isChosen(product.id);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleProduct(product)}
                      className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-start text-[13px] hover:bg-(--s-fill)"
                    >
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] border-(--s-field)", on && "border-(--s-primary) bg-(--s-primary) text-white")}>
                        {on && <Check className="size-3.5" aria-hidden />}
                      </span>
                      <bdi className="min-w-0 flex-1 truncate text-(--s-ink)">{product.title || "—"}</bdi>
                      {!product.isActive && <small className="text-xs text-(--s-faint)">{t("draft")}</small>}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Field>
      </div>
    </Modal>
  );
}
