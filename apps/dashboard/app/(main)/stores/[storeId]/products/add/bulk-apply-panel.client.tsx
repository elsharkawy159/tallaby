"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import { Form } from "@workspace/ui/components/form";
import { Field, InputGroup, NativeSelect, Segmented, SellerButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { CategoryField } from "./category-field";
import { useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";
import type { BulkApplyOptions, BulkCategoryPick } from "./bulk-apply.lib";

type Tristate = "keep" | "on" | "off"

export interface BulkApplyChoice {
  options: BulkApplyOptions
  /** undefined: leave each row's choice. */
  draft?: boolean
}

type CategoryValues = Pick<AddProductFormData, "categoryId" | "sellerCategoryId" | "sellerCategoryName"> & {
  localized: { en: { title: string }; ar: { title: string } }
}

const EMPTY_CATEGORY: CategoryValues = {
  categoryId: "",
  sellerCategoryId: "",
  sellerCategoryName: "",
  localized: { en: { title: "" }, ar: { title: "" } },
};

/**
 * "Apply to all" above the fetched list: the store category (the same box as
 * the product form, so store categories show first and a typed name becomes a
 * new one), publish or draft, a price change and stock. Only what the seller
 * sets is applied; each row can still be changed afterwards.
 */
export function BulkApplyPanel ({
  categories,
  count,
  disabled,
  onApply,
}: {
  categories: CategoryOption[]
  /** Rows the options reach (fetched and not saved yet). */
  count: number
  disabled?: boolean
  onApply: (choice: BulkApplyChoice) => void
}) {
  const t = useTranslations("productForm.bulk.apply");
  const taxonomy = useSellerTaxonomy();
  // A form of its own, so the category box behaves exactly as in each row.
  const categoryForm = useForm<CategoryValues>({ defaultValues: EMPTY_CATEGORY });
  const [status, setStatus] = useState<"keep" | "publish" | "draft">("keep");
  const [priceMode, setPriceMode] = useState<"percent" | "amount">("percent");
  const [priceValue, setPriceValue] = useState("");
  const [tracking, setTracking] = useState<Tristate>("keep");
  const [quantity, setQuantity] = useState("");

  const readCategory = (): BulkCategoryPick | undefined => {
    const { categoryId, sellerCategoryId, sellerCategoryName } = categoryForm.getValues();
    if (sellerCategoryName?.trim()) return { kind: "new", name: sellerCategoryName.trim() };
    const option = sellerCategoryId ? taxonomy?.categories.find((o) => o.id === sellerCategoryId) : undefined;
    if (option) return { kind: "store", option };
    return categoryId ? { kind: "tallaby", id: categoryId } : undefined;
  };

  const price = priceValue.trim() === "" ? NaN : Number(priceValue);
  const units = quantity.trim() === "" ? NaN : Number(quantity);
  const priceInvalid = priceValue.trim() !== "" && (!Number.isFinite(price) || (priceMode === "percent" && price <= -100));
  const unitsInvalid = quantity.trim() !== "" && (!Number.isInteger(units) || units < 0);

  const [categoryId, sellerCategoryId, sellerCategoryName] = useWatch({
    control: categoryForm.control,
    name: ["categoryId", "sellerCategoryId", "sellerCategoryName"],
  });
  const hasCategory = Boolean(sellerCategoryName?.trim() || sellerCategoryId || categoryId);
  const anything =
    hasCategory || status !== "keep" || (Number.isFinite(price) && price !== 0) || tracking !== "keep" || Number.isInteger(units);

  const apply = () => {
    if (priceInvalid || unitsInvalid) return;
    const options: BulkApplyOptions = {};
    const category = readCategory();
    if (category) options.category = category;
    if (Number.isFinite(price) && price !== 0) options.priceChange = { mode: priceMode, value: price };
    if (tracking !== "keep") options.trackStock = tracking === "on";
    if (Number.isInteger(units) && units >= 0 && tracking !== "off") options.quantity = units;
    onApply({ options, draft: status === "keep" ? undefined : status === "draft" });
  };

  return (
    <section
      aria-labelledby="bulk-apply-title"
      className="rounded-[20px] border border-(--s-line) bg-(--s-surface) p-5 shadow-(--s-shadow-card) max-[600px]:p-4"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-5">
          <Layers aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="bulk-apply-title" className="text-[15px] font-bold text-(--s-ink)">
            {t("title")}
          </h2>
          <p className="text-xs leading-relaxed text-(--s-muted)">{t("body")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[760px]:grid-cols-1">
        <Form {...categoryForm}>
          <div className="min-w-0">
            <CategoryField categories={categories} />
          </div>
        </Form>

        <Field label={t("status")} note={t("statusHint")}>
          <Segmented
            label={t("status")}
            value={status}
            onChange={setStatus}
            className="max-[600px]:flex"
            options={[
              { value: "keep", label: t("keep") },
              { value: "publish", label: t("publish") },
              { value: "draft", label: t("draft") },
            ]}
          />
        </Field>

        <Field
          label={t("price")}
          htmlFor="bulk-apply-price"
          note={t(priceMode === "percent" ? "priceHintPercent" : "priceHintAmount")}
          error={priceInvalid ? t("priceInvalid") : undefined}
        >
          <div className="flex gap-2">
            <NativeSelect
              aria-label={t("priceMode")}
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as "percent" | "amount")}
              className="w-[42%] max-w-[170px] shrink-0"
            >
              <option value="percent">{t("percent")}</option>
              <option value="amount">{t("amount")}</option>
            </NativeSelect>
            <InputGroup
              id="bulk-apply-price"
              dir="ltr"
              inputMode="decimal"
              placeholder={priceMode === "percent" ? "+20" : "+50"}
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value.replace(",", "."))}
              aria-invalid={priceInvalid}
              end={priceMode === "percent" ? "%" : undefined}
              className={cn("min-w-0 flex-1", priceInvalid && "border-destructive")}
            />
          </div>
        </Field>

        <Field label={t("stock")} note={t("stockHint")} error={unitsInvalid ? t("quantityInvalid") : undefined}>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label={t("stock")}
              value={tracking}
              onChange={setTracking}
              options={[
                { value: "keep", label: t("keep") },
                { value: "on", label: t("track") },
                { value: "off", label: t("noTrack") },
              ]}
            />
            {tracking !== "off" && (
              <InputGroup
                aria-label={t("quantity")}
                dir="ltr"
                inputMode="numeric"
                placeholder={t("quantityPlaceholder")}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-invalid={unitsInvalid}
                className={cn("w-[140px] max-[600px]:w-full", unitsInvalid && "border-destructive")}
              />
            )}
          </div>
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-(--s-line-soft) pt-4">
        <SellerButton
          type="button"
          variant="solid"
          onClick={apply}
          disabled={disabled || count === 0 || !anything || priceInvalid || unitsInvalid}
          className="max-[600px]:w-full"
        >
          {t("submit", { count })}
        </SellerButton>
      </div>
    </section>
  );
}
