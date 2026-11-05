"use client";

import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Eye, Flame, MessageSquareQuote, Plus, Star, Trash2 } from "lucide-react";
import { LOW_STOCK_THRESHOLD_DEFAULT, LOW_STOCK_THRESHOLD_MAX, LOW_STOCK_THRESHOLD_MIN } from "@workspace/store-sections/low-stock";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { IconButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FieldError, FieldHint, FieldLabel, SMALL_BUTTON_CLASS, SubHeading, TEXTAREA_CLASS } from "@/app/(main)/products/add/form-kit";
import { CollapsibleSection } from "../add/sections/collapsible-section";
import { useFieldError } from "../add/sections/fields";
import type { AddProductFormData } from "../add/add-product.schema";
import { REVIEW_COMMENT_MAX, REVIEWER_NAME_MAX, SELLER_REVIEWS_MAX } from "./social-proof.dto";

/**
 * Reviews the seller really received elsewhere (typed in, never generated),
 * the product page's live views counter, and the low-stock alert (F-34),
 * both off until the seller ticks them.
 */
export function SocialProofSection({ id = "sec-social-proof" }: { id?: string }) {
  const t = useTranslations("productForm.sections.socialProof");
  const form = useFormContext<AddProductFormData>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "sellerReviews", keyName: "key" });
  const showLiveViews = useWatch({ control: form.control, name: "showLiveViews" });
  const showLowStockBadge = useWatch({ control: form.control, name: "showLowStockBadge" });
  const trackStock = useWatch({ control: form.control, name: "trackStock" });
  const { errors } = useFormState({ control: form.control, name: ["sellerReviews", "lowStockThreshold"] });
  const parts = [
    fields.length ? t("summaryReviews", { count: fields.length }) : null,
    showLiveViews ? t("summaryLiveViews") : null,
    showLowStockBadge && trackStock !== false ? t("summaryLowStock") : null,
  ].filter(Boolean);

  return (
    <CollapsibleSection
      id={id}
      icon={MessageSquareQuote}
      title={t("title")}
      description={t("description")}
      summary={parts.length ? parts.join(" · ") : t("summaryNone")}
      summaryTone={parts.length ? "ok" : "muted"}
      filled={parts.length > 0}
      invalid={Boolean(errors.sellerReviews || errors.lowStockThreshold)}
    >
      <Controller
        control={form.control}
        name="showLiveViews"
        render={({ field }) => (
          <label htmlFor="show-live-views" className="flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-4 py-3.5">
            <Checkbox id="show-live-views" checked={!!field.value} onCheckedChange={(checked) => field.onChange(checked === true)} className="mt-0.5" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Eye className="size-4 text-muted-foreground" aria-hidden />
                {t("liveViews")}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t("liveViewsDescription")}</span>
            </span>
          </label>
        )}
      />

      <LowStockAlert />

      <SubHeading>{t("reviewsHeading")}</SubHeading>
      <FieldHint>{t("reviewsHint")}</FieldHint>

      {fields.map((review, index) => (
        <ReviewRow key={review.key} index={index} onRemove={() => remove(index)} />
      ))}

      {fields.length < SELLER_REVIEWS_MAX && (
        <Button
          type="button"
          variant="neutral"
          className={cn(SMALL_BUTTON_CLASS, "w-fit")}
          onClick={() => append({ reviewerName: "", rating: 5, comment: "" })}
        >
          <Plus />
          {t("addReview")}
        </Button>
      )}
    </CollapsibleSection>
  );
}

function ReviewRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const t = useTranslations("productForm.sections.socialProof");
  const form = useFormContext<AddProductFormData>();
  const nameError = useFieldError(`sellerReviews.${index}.reviewerName`);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-2 rounded-2xl border border-(--s-line) bg-(--s-surface-2) p-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <Controller
          control={form.control}
          name={`sellerReviews.${index}.rating`}
          render={({ field }) => (
            <div role="radiogroup" aria-label={t("rating")} dir="ltr" className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={field.value === n}
                  aria-label={t("stars", { count: n })}
                  onClick={() => field.onChange(n)}
                  className="cursor-pointer rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Star className={cn("size-[18px] max-[600px]:size-6", n <= (field.value ?? 0) ? "fill-amber-400 text-amber-400" : "text-(--s-field-strong)")} aria-hidden />
                </button>
              ))}
            </div>
          )}
        />
        <Input
          id={`review-name-${index}`}
          {...form.register(`sellerReviews.${index}.reviewerName`)}
          maxLength={REVIEWER_NAME_MAX}
          placeholder={t("reviewerNamePlaceholder")}
          aria-label={t("reviewerName")}
          aria-invalid={Boolean(nameError)}
          className={cn(FIELD_CLASS, "h-9 min-w-0 flex-1 basis-40 sm:max-w-[220px] max-md:text-base")}
        />
      </div>
      <IconButton type="button" onClick={onRemove} aria-label={t("removeReview")} title={t("removeReview")} className="hover:text-destructive">
        <Trash2 aria-hidden />
      </IconButton>
      <div className="col-span-2 empty:hidden">
        <FieldError>{nameError}</FieldError>
      </div>
      <Textarea
        id={`review-comment-${index}`}
        {...form.register(`sellerReviews.${index}.comment`)}
        rows={2}
        maxLength={REVIEW_COMMENT_MAX}
        placeholder={t("commentPlaceholder")}
        aria-label={t("comment")}
        className={cn(TEXTAREA_CLASS, "col-span-2 min-h-[60px] max-md:text-base")}
      />
    </div>
  );
}

/** "Show a low-stock alert" (0122): off by default; the threshold appears once it is ticked. */
function LowStockAlert() {
  const t = useTranslations("productForm.sections.socialProof");
  const form = useFormContext<AddProductFormData>();
  const show = useWatch({ control: form.control, name: "showLowStockBadge" });
  const thresholdError = useFieldError("lowStockThreshold");
  const trackStock = useWatch({ control: form.control, name: "trackStock" });

  // Unlimited stock (F-51) has no count to warn about.
  if (trackStock === false) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-4 py-3.5">
      <Controller
        control={form.control}
        name="showLowStockBadge"
        render={({ field }) => (
          <label htmlFor="show-low-stock" className="flex cursor-pointer items-start gap-3">
            <Checkbox id="show-low-stock" checked={!!field.value} onCheckedChange={(checked) => field.onChange(checked === true)} className="mt-0.5" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Flame className="size-4 text-muted-foreground" aria-hidden />
                {t("lowStock")}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t("lowStockDescription")}</span>
            </span>
          </label>
        )}
      />
      {show && (
        <Controller
          control={form.control}
          name="lowStockThreshold"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5 ps-7">
              <FieldLabel htmlFor="low-stock-threshold">{t("lowStockThreshold")}</FieldLabel>
              <Input
                id="low-stock-threshold"
                type="number"
                inputMode="numeric"
                min={LOW_STOCK_THRESHOLD_MIN}
                max={LOW_STOCK_THRESHOLD_MAX}
                step={1}
                value={field.value ?? ""}
                placeholder={String(LOW_STOCK_THRESHOLD_DEFAULT)}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                onBlur={field.onBlur}
                aria-invalid={Boolean(thresholdError)}
                className={cn(FIELD_CLASS, "w-28 max-md:text-base")}
              />
              <FieldHint>{t("lowStockThresholdHint", { count: field.value ?? LOW_STOCK_THRESHOLD_DEFAULT })}</FieldHint>
              <FieldError>{thresholdError ? t("lowStockThresholdInvalid", { min: LOW_STOCK_THRESHOLD_MIN, max: LOW_STOCK_THRESHOLD_MAX }) : null}</FieldError>
            </div>
          )}
        />
      )}
    </div>
  );
}
