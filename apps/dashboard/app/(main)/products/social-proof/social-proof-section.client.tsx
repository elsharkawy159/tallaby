"use client";

import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Eye, MessageSquareQuote, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FieldError, FieldHint, FieldLabel, SMALL_BUTTON_CLASS, SubHeading, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { CollapsibleSection } from "../add/sections/collapsible-section";
import { useFieldError } from "../add/sections/fields";
import type { AddProductFormData } from "../add/add-product.schema";
import { REVIEW_COMMENT_MAX, REVIEWER_NAME_MAX, SELLER_REVIEWS_MAX } from "./social-proof.dto";

/**
 * Reviews the seller really received elsewhere (typed in, never generated)
 * and the product page's live views counter, off until the seller ticks it.
 */
export function SocialProofSection({ id = "sec-social-proof" }: { id?: string }) {
  const t = useTranslations("productForm.sections.socialProof");
  const form = useFormContext<AddProductFormData>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "sellerReviews", keyName: "key" });
  const showLiveViews = useWatch({ control: form.control, name: "showLiveViews" });
  const { errors } = useFormState({ control: form.control, name: "sellerReviews" });
  const parts = [fields.length ? t("summaryReviews", { count: fields.length }) : null, showLiveViews ? t("summaryLiveViews") : null].filter(Boolean);

  return (
    <CollapsibleSection
      id={id}
      icon={MessageSquareQuote}
      title={t("title")}
      description={t("description")}
      summary={parts.length ? parts.join(" · ") : t("summaryNone")}
      summaryTone={parts.length ? "ok" : "muted"}
      invalid={Boolean(errors.sellerReviews)}
    >
      <Controller
        control={form.control}
        name="showLiveViews"
        render={({ field }) => (
          <label htmlFor="show-live-views" className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted px-4 py-3.5">
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
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`review-name-${index}`} required>
          {t("reviewerName")}
        </FieldLabel>
        <Input
          id={`review-name-${index}`}
          {...form.register(`sellerReviews.${index}.reviewerName`)}
          maxLength={REVIEWER_NAME_MAX}
          placeholder={t("reviewerNamePlaceholder")}
          aria-invalid={Boolean(nameError)}
          className={cn(FIELD_CLASS, "max-md:text-base")}
        />
        <FieldError>{nameError}</FieldError>
      </div>

      <Controller
        control={form.control}
        name={`sellerReviews.${index}.rating`}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("rating")}</FieldLabel>
            <div role="radiogroup" aria-label={t("rating")} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={field.value === n}
                  aria-label={t("stars", { count: n })}
                  onClick={() => field.onChange(n)}
                  className="rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Star className={cn("size-6", n <= (field.value ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
      />

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`review-comment-${index}`} note={t("optional")}>
          {t("comment")}
        </FieldLabel>
        <Textarea
          id={`review-comment-${index}`}
          {...form.register(`sellerReviews.${index}.comment`)}
          rows={2}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder={t("commentPlaceholder")}
          className={cn(TEXTAREA_CLASS, "min-h-[72px] max-md:text-base")}
        />
      </div>

      <Button type="button" variant="ghost" className={cn(SMALL_BUTTON_CLASS, "w-fit text-destructive hover:text-destructive")} onClick={onRemove}>
        <Trash2 />
        {t("removeReview")}
      </Button>
    </div>
  );
}
