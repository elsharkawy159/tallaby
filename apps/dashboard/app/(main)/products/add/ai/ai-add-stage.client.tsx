"use client"

import { useEffect, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeft, ArrowUp, Check, FileText, ImagePlus, Sparkles, Wand2, X } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { useAccountMoney } from "@/components/account-money.client"
import { AiCreditsNote } from "@/components/ai/ai-credits-note.client"
import { MoneyText } from "@/components/money"
import { SellerButton } from "@/components/seller-ui"
import { cn } from "@/lib/utils"
import { formatMoneyMarked, formatNumber } from "@/lib/i18n/format"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { BackIcon, backClassName, FlowIntro, FlowOrb, FlowStage, GenCard, GenFoot, PILL_BUTTON_CLASS, type GenStep } from "../add-flow.client"
import type { AddProductFormData, CategoryOption, SupportedLocale } from "../add-product.schema"
import { AUTOFILL_LIMITS, type ProductAutofillOutput } from "./ai-autofill.dto"
import { checkComposer } from "./ai-composer.lib"
import { useAiAutofill, type AutofillProgress, type AutofillReview } from "./use-ai-autofill"

/** How long each finished step takes to appear once its result is really in. */
const REVEAL_MS = 320
/** The pause on the finished card before the form opens. */
const AUTO_REVIEW_MS = 2200

type Run = {
  text: string
  previews: string[]
  pdfName: string | null
  answer: { output: ProductAutofillOutput; categoryId: string | null } | null
  photos: string[] | null
  review: AutofillReview | null
}

/**
 * "Add with AI" on a new product (Seller Add Product v4): the seller writes one
 * message, watches it become a product, then reviews it in the form. One call does
 * all the writing, so the steps tick off once the form is filled, each showing what
 * really landed in the form (only empty fields are written unless the seller asks to
 * replace); the wait before it isn't dressed up as progress.
 */
export function AiAddStage ({
  active,
  categories,
  sellerPricing,
  onAppliedChange,
  onBack,
  onFilled,
  onReview,
}: {
  /** False while the form or the choice is showing: this stays mounted so a running fill survives. */
  active: boolean
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  onAppliedChange: (delta: 1 | -1) => void
  onBack: () => void
  /** The form holds the result now; the banner offers review and undo. */
  onFilled: (review: AutofillReview) => void
  onReview: () => void
}) {
  const t = useTranslations("productForm.aiStage")
  const tAi = useTranslations("productForm.ai")
  const locale = useLocale()
  const { unit } = useAccountMoney()
  const form = useFormContext<AddProductFormData>()
  const [run, setRun] = useState<Run | null>(null)
  const [revealed, setRevealed] = useState(0)
  const textRef = useRef<HTMLTextAreaElement | null>(null)

  const onProgress = (progress: AutofillProgress) => {
    if (progress.phase === "answered") setRun((r) => r && { ...r, answer: { output: progress.output, categoryId: progress.categoryId } })
    else if (progress.phase === "photos") setRun((r) => r && { ...r, photos: progress.previews })
    else if (progress.phase === "applied") {
      setRun((r) => r && { ...r, review: progress.review })
      if (progress.review.filled > 0 || progress.review.photosAdded > 0) onFilled(progress.review)
    } else setRun(null) // The hook showed the error; the message and files are still in the composer.
  }

  const ai = useAiAutofill({ form, categories, sellerPricing, mode: "add", onAppliedChange, onProgress })
  const money = (value: number) => formatMoneyMarked(value, locale, unit)
  const check = checkComposer(ai.prompt, ai.images.length, ai.pdf !== null)
  const canSend = check.missing === null && !ai.running && !ai.outOfCalls

  const send = () => {
    if (!canSend) return
    setRun({
      text: ai.prompt.trim(),
      previews: ai.images.map((item) => item.preview),
      pdfName: ai.pdf?.name ?? null,
      answer: null,
      photos: null,
      review: null,
    })
    setRevealed(0)
    void ai.submit()
  }

  const clearRun = (finished: Run) => {
    finished.previews.forEach((url) => URL.revokeObjectURL(url))
    setRun(null)
    setRevealed(0)
  }

  const steps = run ? buildSteps(run) : []
  const finished = run !== null && run.review !== null && revealed >= steps.length
  const landedAnything = Boolean(run?.review && (run.review.filled > 0 || run.review.photosAdded > 0))

  function buildSteps (current: Run): GenStep[] {
    const { answer, photos, review } = current
    const own: SupportedLocale = locale === "en" ? "en" : "ar"
    const other: SupportedLocale = own === "en" ? "ar" : "en"
    const copy = answer?.output.localized[own]
    // What the form holds now: a seller's own value stays unless they asked to replace it.
    const landed = (path: string) => review?.paths.includes(path) ?? false
    const values = form.getValues()
    const inForm = values.localized?.[own]
    const list = landed("price.list") && typeof values.price?.list === "number" ? values.price.list : null
    const sale = landed("price.list") && typeof values.price?.final === "number" ? values.price.final : null
    const onSale = list !== null && sale !== null && sale < list
    const category = landed("categoryId") && answer?.categoryId ? categories.find((item) => item.id === answer.categoryId) : null
    // Only a matched Tallaby category counts: the form still asks for one otherwise.
    const categoryName = category ? (own === "ar" ? category.nameAr || category.name : category.name) : null
    const paragraphs = landed(`localized.${own}.description`) && copy ? copy.description.split(/\n\s*\n/).filter((part) => part.trim()).length : 0
    const highlights = landed(`localized.${own}.bulletPoints`) && copy ? copy.bulletPoints.length : 0
    const reviewsBefore = review?.undo.find(({ path }) => path === "sellerReviews")?.value as unknown[] | undefined
    const reviewsAdded = landed("sellerReviews") ? (values.sellerReviews ?? []).slice(reviewsBefore?.length ?? 0) : []
    const arrow = own === "ar" ? "←" : "→"
    const keptOr = (aiGave: unknown, skip: string) => (aiGave ? t("steps.kept") : skip)
    const strong = (text: string | undefined) => <span className="font-medium text-(--s-ink)" dir="auto">{text}</span>

    const defs: Array<{ key: string; label: string; output: React.ReactNode; skip?: string }> = [
      {
        key: "analyze",
        label: t(current.previews.length ? "steps.analyzePhotos" : "steps.analyzeFile"),
        output: t("steps.analyzeDone"),
      },
      {
        key: "title",
        label: t("steps.title"),
        output: landed(`localized.${own}.title`) ? strong(inForm?.title) : null,
        skip: keptOr(copy?.title, t("steps.titleSkip")),
      },
      {
        key: "description",
        label: t("steps.description"),
        output: paragraphs ? t("steps.descriptionDone", { paragraphs, highlights }) : highlights ? t("steps.highlightsDone", { highlights }) : null,
        skip: keptOr(copy?.description || copy?.bulletPoints.length, t("steps.descriptionSkip")),
      },
      {
        key: "category",
        label: t("steps.category"),
        output: categoryName ? <span dir="auto">{categoryName}</span> : null,
        skip: keptOr(answer?.categoryId, t("steps.categorySkip")),
      },
      {
        key: "price",
        label: t("steps.price"),
        output: onSale ? (
          <MoneyText locale={locale}>
            {`${money(list)} ${arrow} ${money(sale)} · ${t("percentOff", { percent: Math.round((1 - sale / list) * 100) })}`}
          </MoneyText>
        ) : list !== null ? (
          <MoneyText locale={locale}>{money(list)}</MoneyText>
        ) : null,
        skip: keptOr(answer?.output.price.list, t("steps.priceSkip")),
      },
      {
        key: "seo",
        label: t("steps.seo"),
        output: landed(`localized.${own}.metaTitle`) ? strong(inForm?.metaTitle) : null,
        skip: keptOr(copy?.metaTitle, t("steps.seoSkip")),
      },
      {
        key: "translate",
        label: t(own === "ar" ? "steps.translateEn" : "steps.translateAr"),
        output: landed(`localized.${other}.title`) ? <span dir="auto">{values.localized?.[other]?.title}</span> : null,
        skip: keptOr(answer?.output.localized[other].title, t("steps.translateSkip")),
      },
      {
        key: "photos",
        label: t("steps.photos"),
        output: photos?.length ? (
          <>
            {t("steps.photosDone", { count: photos.length })}
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img key={url} src={url} alt="" className="size-10 rounded-lg border border-(--s-line) bg-white object-cover" />
              ))}
            </span>
          </>
        ) : null,
        skip: t("steps.photosSkip"),
      },
      {
        key: "reviews",
        label: t("steps.reviews"),
        output: reviewsAdded.length
          ? t("steps.reviewsDone", {
              count: reviewsAdded.length,
              average: formatNumber(reviewsAdded.reduce((sum, item) => sum + (item.rating ?? 0), 0) / reviewsAdded.length, locale, { maximumFractionDigits: 1 }),
            })
          : null,
        skip: keptOr(answer?.output.reviews.length, t("steps.reviewsSkip")),
      },
    ]

    return defs.map((def, index) => {
      if (index < revealed) {
        return def.output
          ? { key: def.key, label: def.label, state: "done", output: def.output }
          : { key: def.key, label: def.label, state: "skip", output: def.skip }
      }
      return { key: def.key, label: def.label, state: index === revealed ? "run" : "wait" }
    })
  }

  // The first step ends with the answer; the rest report the form, so they wait for the fill.
  const nextReady = (() => {
    if (!run || revealed >= steps.length) return false
    return revealed === 0 ? Boolean(run.answer) : run.review !== null
  })()
  useEffect(() => {
    if (!nextReady) return
    const timer = setTimeout(() => setRevealed((value) => value + 1), REVEAL_MS)
    return () => clearTimeout(timer)
  }, [nextReady, revealed])

  // Leaving a finished run (or coming back to it) starts a fresh message.
  if (!active && finished && run) clearRun(run)

  const reviewRef = useRef(onReview)
  useEffect(() => {
    reviewRef.current = onReview
  })
  useEffect(() => {
    if (!finished || !active || !landedAnything) return
    const timer = setTimeout(() => reviewRef.current(), AUTO_REVIEW_MS)
    return () => clearTimeout(timer)
  }, [finished, active, landedAnything])

  const hint = check.missing ? t(`hint.${check.missing}`) : ""
  const { ref: promptRef, ...promptField } = ai.promptField
  const percent = run?.review ? Math.round((revealed / Math.max(1, steps.length)) * 100) : null

  const REQUIREMENTS = [
    {
      key: "desc",
      ok: check.desc,
      title: t("req.desc"),
      body: ai.pdf ? t("req.fromPdf") : t("req.descBody"),
    },
    {
      key: "img",
      ok: check.img,
      title: t("req.img"),
      body: ai.images.length
        ? t("req.imgCount", { count: ai.images.length })
        : ai.pdf
          ? t("req.fromPdf")
          : t("req.imgBody", { max: AUTOFILL_LIMITS.maxImages }),
    },
    {
      key: "price",
      ok: check.price,
      title: t("req.price"),
      body:
        check.prices.price !== null ? (
          <MoneyText locale={locale}>
            {check.prices.sale !== null
              ? `${money(check.prices.price)} · ${t("req.afterDiscount", { amount: money(check.prices.sale) })}`
              : check.prices.percentOff
                ? `${money(check.prices.price)} · ${t("percentOff", { percent: check.prices.percentOff })}`
                : `${money(check.prices.price)} · ${t("req.noDiscount")}`}
          </MoneyText>
        ) : ai.pdf ? (
          t("req.fromPdf")
        ) : (
          t("req.priceBody")
        ),
    },
    {
      key: "rev",
      ok: check.rev,
      title: t("req.rev"),
      tag: t("req.revTag"),
      body: t("req.revBody"),
    },
  ]

  return (
    <FlowStage
      back={
        <button type="button" className={backClassName} onClick={onBack}>
          <BackIcon />
          {t("back")}
        </button>
      }
      icon={Sparkles}
      label={t("mode")}
      running={run !== null}
    >
      {/* Stays mounted through a run: a failed send puts the seller back here with everything intact. */}
      <div className={cn("flex flex-col gap-[22px]", run && "hidden")}>
        <FlowIntro orb={<FlowOrb icon={Sparkles} amber />} title={t("title")} titleId="ai-stage-title" body={t("body")}>
          <ul className="mt-1 grid w-full grid-cols-2 gap-2 text-start max-[640px]:grid-cols-1">
            {REQUIREMENTS.map((item) => (
              <li
                key={item.key}
                className={cn(
                  "flex items-start gap-2.5 rounded-[14px] border border-(--s-line) bg-(--s-surface) px-3.5 py-3 transition-colors duration-200 max-[640px]:px-3 max-[640px]:py-2.5",
                  item.ok && "border-success/35 bg-success-soft/45",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-(--s-field-strong) text-transparent transition-colors duration-200 [&_svg]:size-3 [&_svg]:stroke-[3]",
                    item.ok && "border-success bg-success text-white",
                  )}
                >
                  <Check aria-hidden />
                </span>
                <div className="min-w-0">
                  <b className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.6] font-semibold text-(--s-ink)">
                    {item.title}
                    {item.tag && <em className="text-[11px] font-normal text-(--s-faint) not-italic">{item.tag}</em>}
                  </b>
                  <small className="block text-xs leading-[1.6] text-(--s-muted)">{item.body}</small>
                </div>
              </li>
            ))}
          </ul>
        </FlowIntro>

        <div
          {...ai.dropzone.getRootProps()}
          className={cn(
            "rounded-[24px] border border-(--s-field-strong) bg-(--s-surface) p-2 shadow-[0_12px_32px_rgba(20,81,99,.08)] transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_3px_var(--s-focus-soft),0_12px_32px_rgba(20,81,99,.08)]",
            ai.dropzone.isDragActive && "border-dashed border-(--s-primary) bg-primary-soft",
          )}
        >
          <input {...ai.dropzone.getInputProps()} aria-label={tAi("attach")} />

          {(ai.images.length > 0 || ai.pdf) && (
            <ul className="flex flex-wrap gap-2 px-1.5 pt-1.5 pb-0.5" aria-label={tAi("attachments")}>
              {ai.images.map((item) => (
                <li key={item.id} className="relative size-16 overflow-hidden rounded-xl border border-(--s-line) bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={item.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => ai.removeImage(item.id)}
                    aria-label={tAi("remove")}
                    className="absolute end-1 top-1 grid size-5 cursor-pointer place-items-center rounded-full bg-black/60 text-white after:absolute after:-inset-2.5 [&_svg]:size-3"
                  >
                    <X aria-hidden />
                  </button>
                </li>
              ))}
              {ai.pdf && (
                <li className="flex h-16 max-w-[220px] items-center gap-2 rounded-xl border border-(--s-line) bg-(--s-surface-2) px-3 text-xs">
                  <FileText className="size-4 shrink-0 text-primary-ink" aria-hidden />
                  <span className="truncate" dir="auto">{ai.pdf.name}</span>
                  <button type="button" onClick={ai.clearPdf} aria-label={tAi("remove")} className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-(--s-hover) [&_svg]:size-3.5">
                    <X aria-hidden />
                  </button>
                </li>
              )}
            </ul>
          )}

          <textarea
            {...promptField}
            ref={(element) => {
              promptRef(element)
              textRef.current = element
            }}
            aria-labelledby="ai-stage-title"
            maxLength={AUTOFILL_LIMITS.maxTextLength}
            rows={3}
            dir="auto"
            placeholder={t("placeholder")}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files)
              if (files.length) {
                event.preventDefault()
                ai.addFiles(files)
              }
            }}
            onKeyDown={(event) => {
              // On a phone keyboard Enter is a new line; the send button is right there.
              if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
              if (window.matchMedia("(pointer: coarse)").matches) return
              event.preventDefault()
              send()
            }}
            className="field-sizing-content block max-h-[260px] min-h-[84px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-[1.8] text-(--s-ink) outline-none placeholder:text-(--s-faint) max-[640px]:text-base"
          />

          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <button
              type="button"
              className={PILL_BUTTON_CLASS}
              onClick={ai.dropzone.open}
              title={tAi("limits", { images: AUTOFILL_LIMITS.maxImages, pdfMb: AUTOFILL_LIMITS.maxPdfBytes / 1024 / 1024 })}
            >
              <ImagePlus aria-hidden />
              {t("attach")}
            </button>
            <button
              type="button"
              className={PILL_BUTTON_CLASS}
              onClick={() => {
                ai.promptForm.setValue("prompt", t("sampleText"), { shouldDirty: true })
                textRef.current?.focus()
              }}
            >
              <Wand2 aria-hidden />
              {t("sample")}
            </button>
            <span className="ms-auto min-w-0 truncate text-xs text-(--s-faint) max-[640px]:hidden">{hint}</span>
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              aria-label={t("send")}
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-(--s-amber-hover) disabled:cursor-not-allowed disabled:bg-(--s-line) disabled:text-(--s-faint) max-[640px]:ms-auto [&_svg]:size-[18px] [&_svg]:stroke-[2.25]"
            >
              <ArrowUp aria-hidden />
            </button>
          </div>
        </div>

        {hint && <p className="-mt-3 text-center text-xs text-(--s-muted) min-[641px]:hidden">{hint}</p>}

        {ai.formHasContent && (
          <label className="-mt-2 flex cursor-pointer items-center justify-center gap-1.5 text-xs text-(--s-muted)">
            <Checkbox checked={ai.replace} onCheckedChange={(value) => ai.setReplace(value === true)} />
            {tAi("replaceAll")}
          </label>
        )}

        <div className="-mt-2 flex flex-col items-center gap-1 text-center text-xs text-(--s-faint)">
          <p>
            {t("fineCredit")}
            <span className="max-[640px]:hidden"> · {t("fineKeys")}</span>
          </p>
          {ai.prompt.length >= AUTOFILL_LIMITS.maxTextLength && (
            <p className="text-destructive">{ai.prompt.length} / {AUTOFILL_LIMITS.maxTextLength}</p>
          )}
          {ai.outOfCalls && <p className="text-destructive">{tAi("errors.dailyLimit")}</p>}
          {ai.remaining !== null && ai.remaining > 0 && ai.remaining <= 5 && <p>{tAi("remaining", { count: ai.remaining })}</p>}
          <AiCreditsNote refreshKey={ai.remaining} />
        </div>
      </div>

      {run && (
        <div className="flex flex-col gap-4">
          <div className="max-w-[85%] self-end rounded-[20px] rounded-ee-md bg-primary-soft px-4 py-3 text-sm leading-[1.8] whitespace-pre-wrap text-(--s-ink) motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2" dir="auto">
            {(run.previews.length > 0 || run.pdfName) && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {run.previews.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  <img key={url} src={url} alt="" className="size-14 rounded-[10px] border border-(--s-line) bg-white object-cover" />
                ))}
                {run.pdfName && (
                  <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg bg-(--s-surface) px-2 text-xs">
                    <FileText className="size-3.5 shrink-0 text-primary-ink" aria-hidden />
                    <span className="truncate">{run.pdfName}</span>
                  </span>
                )}
              </div>
            )}
            {run.text}
          </div>

          <GenCard
            icon={Sparkles}
            amber
            title={finished ? t(landedAnything ? "doneTitle" : "nothingTitle") : t("runTitle")}
            subtitle={finished ? t(landedAnything ? "doneBody" : "nothingBody") : run.review ? steps[revealed]?.label : t("waiting")}
            percent={finished ? 100 : percent}
            finished={finished && landedAnything}
            steps={steps}
          >
            {finished && landedAnything && (
              <GenFoot title={t(run.review?.keptSome ? "draftPartialTitle" : "draftTitle")} body={t(run.review?.keptSome ? "draftPartialBody" : "draftBody")}>
                <SellerButton type="button" onClick={onReview} className="max-[600px]:w-full">
                  {t("review")}
                  <ArrowLeft className="ltr:rotate-180" aria-hidden />
                </SellerButton>
              </GenFoot>
            )}
            {finished && !landedAnything && (
              <div className="flex flex-wrap gap-2 border-t border-(--s-line) px-[18px] py-3.5">
                <SellerButton type="button" variant="outline" onClick={onReview}>
                  {t("openForm")}
                </SellerButton>
                <SellerButton type="button" variant="outline" onClick={() => clearRun(run)}>
                  {t("newMessage")}
                </SellerButton>
              </div>
            )}
          </GenCard>
        </div>
      )}
    </FlowStage>
  )
}
