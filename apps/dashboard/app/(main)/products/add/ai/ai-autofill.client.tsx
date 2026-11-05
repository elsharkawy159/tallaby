"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { ArrowUp, CircleHelp, FileText, ImagePlus, LoaderCircle, Paperclip, Sparkles, Undo2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { SMALL_BUTTON_CLASS } from "@/app/(main)/products/add/form-kit"
import type { AddProductFormData, CategoryOption } from "../add-product.schema"
import { AUTOFILL_LIMITS } from "./ai-autofill.dto"
import { useAiAutofill } from "./use-ai-autofill"

/**
 * The edit page's AI box: a change request ("make the description longer") for the
 * product as it is. A new product uses the full-screen AiAddStage instead; both run
 * on useAiAutofill. The seller reviews and saves; nothing is saved here.
 */

/** The help text: a tooltip on the `?` with a pointer, a dialog on touch screens. */
function AiHelp ({ title, text }: { title: string; text: string }) {
  const isMobile = useIsMobile()
  const t = useTranslations("productForm.ai")
  const trigger = (
    <button
      type="button"
      aria-label={t("help")}
      className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      <CircleHelp className="size-4" aria-hidden />
    </button>
  )

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" aria-hidden />
              {title}
            </DialogTitle>
            <DialogDescription className="text-start leading-relaxed">{text}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-pretty leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export function AiAutofillCard ({
  categories,
  sellerPricing,
  mode = "add",
  onAppliedChange,
}: {
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  /** "edit": the product exists, and the text is a change request. */
  mode?: "add" | "edit"
  /** +1 when a fill changed the form, -1 when it was undone; the form marks the saved product as AI-assisted (0112). */
  onAppliedChange?: (delta: 1 | -1) => void
}) {
  const t = useTranslations("productForm.ai")
  const form = useFormContext<AddProductFormData>()
  const {
    isEdit,
    promptField,
    prompt,
    images,
    pdf,
    clearPdf,
    replace,
    setReplace,
    running,
    review,
    dismissReview,
    undoFill,
    remaining,
    outOfCalls,
    hasInput,
    formHasContent,
    removeImage,
    dropzone: { getRootProps, getInputProps, isDragActive, open },
    submit,
  } = useAiAutofill({ form, categories, sellerPricing, mode, onAppliedChange })
  const title = isEdit ? t("editTitle") : t("title")

  return (
    <section
      id="sec-ai"
      aria-labelledby="sec-ai-title"
      className="rounded-[24px] border border-(--s-primary)/25 bg-(--s-glass) p-[18px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px] max-[600px]:p-3"
    >
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <h2 id="sec-ai-title" tabIndex={-1} className="text-[15px] font-bold text-(--s-ink) outline-none">
          {title}
        </h2>
        <AiHelp title={title} text={isEdit ? t("editDescription") : t("description")} />
        {!isEdit && formHasContent && (
          <label className="ms-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={replace} onCheckedChange={(value) => setReplace(value === true)} disabled={running} />
            {t("replaceAll")}
          </label>
        )}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,box-shadow] focus-within:border-(--s-primary) focus-within:ring-[3px] focus-within:ring-primary/15",
          isDragActive && "border-primary ring-[3px] ring-primary/15"
        )}
      >
        <input {...getInputProps()} aria-label={t("attach")} />

        {(images.length > 0 || pdf) && (
          <ul className="flex flex-wrap gap-1.5 px-2.5 pt-2.5" aria-label={t("attachments")}>
            {images.map((item) => (
              <li key={item.id} className="relative size-11 overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(item.id)}
                  disabled={running}
                  aria-label={t("remove")}
                  className="absolute end-0.5 top-0.5 rounded-full bg-background/90 p-0.5 shadow-sm"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
            {pdf && (
              <li className="flex h-11 max-w-[200px] items-center gap-1.5 rounded-lg border bg-muted px-2.5 text-xs">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate" dir="auto">{pdf.name}</span>
                <button type="button" onClick={clearPdf} disabled={running} aria-label={t("remove")}>
                  <X className="size-3" />
                </button>
              </li>
            )}
          </ul>
        )}

        <div className="flex items-end gap-1 p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-full text-(--s-subtle)"
            onClick={open}
            disabled={running}
            aria-label={t("attach")}
            title={t("limits", { images: AUTOFILL_LIMITS.maxImages, pdfMb: AUTOFILL_LIMITS.maxPdfBytes / 1024 / 1024 })}
          >
            <Paperclip />
          </Button>
          <textarea
            {...promptField}
            aria-labelledby="sec-ai-title"
            maxLength={AUTOFILL_LIMITS.maxTextLength}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void submit()
              }
            }}
            placeholder={isEdit ? t("editPlaceholder") : t("placeholder")}
            disabled={running}
            rows={1}
            dir="auto"
            className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <Button
            type="button"
            className="h-10 shrink-0 gap-1.5 rounded-full px-3.5 text-[13px] font-bold"
            onClick={() => void submit()}
            disabled={!hasInput || running || outOfCalls}
            aria-busy={running}
          >
            {running ? <LoaderCircle className="animate-spin" /> : isEdit ? <Sparkles /> : <ArrowUp />}
            <span className={cn(!running && "sr-only sm:not-sr-only")}>
              {running ? t("running") : isEdit ? t("apply") : t("fill")}
            </span>
          </Button>
        </div>

        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/85 text-sm font-medium text-primary">
            <ImagePlus className="me-2 size-5" aria-hidden />
            {t("dropHere")}
          </div>
        )}
      </div>

      {prompt.length > 0 && (
        <p
          className={cn(
            "mt-1 px-0.5 text-end text-xs tabular-nums text-muted-foreground",
            prompt.length >= AUTOFILL_LIMITS.maxTextLength && "text-destructive"
          )}
          aria-live="polite"
        >
          {prompt.length} / {AUTOFILL_LIMITS.maxTextLength}
        </p>
      )}

      {running && (
        <p className="mt-2 px-0.5 text-xs text-muted-foreground" role="status" aria-live="polite">
          <span className="animate-pulse">{t(isEdit ? "thinkingEdit" : "thinking")}</span>
        </p>
      )}
      {outOfCalls && !running && <p className="mt-2 px-0.5 text-xs text-destructive">{t("errors.dailyLimit")}</p>}
      {remaining !== null && remaining > 0 && remaining <= 5 && !running && (
        <p className="mt-2 px-0.5 text-xs text-muted-foreground">{t("remaining", { count: remaining })}</p>
      )}

      {review && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{t("reviewTitle", { count: review.filled })}</span>
            <span className="text-muted-foreground">{t("reviewHint")}</span>
            <div className="ms-auto flex gap-1">
              {review.undo.length > 0 && (
                <Button type="button" variant="neutral" className={cn(SMALL_BUTTON_CLASS, "h-7 px-2 text-xs")} onClick={undoFill}>
                  <Undo2 />
                  {t("undo")}
                </Button>
              )}
              <Button type="button" variant="ghost" className={cn(SMALL_BUTTON_CLASS, "h-7 px-2 text-xs")} onClick={dismissReview}>
                {t("dismiss")}
              </Button>
            </div>
          </div>
          {review.missing.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {review.missing.map((field) => (
                <li key={field} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5">
                  {t(`missing.${field}`)}
                </li>
              ))}
            </ul>
          )}
          {review.warnings.map((warning) => (
            <p key={warning} className="text-amber-700 dark:text-amber-400" dir="auto">
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
