"use client"

import { useRef, useState } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
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
import { createClient } from "@/supabase/client"
import { cn, generateImageName, getPublicUrl } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { SMALL_BUTTON_CLASS } from "@/components/form/form-ui"
import type { AddProductFormData, CategoryOption, SupportedLocale } from "../add-product.schema"
import { buildFormValuesFromImport } from "../build-form-values-from-import.lib"
import { OPEN_SECTION_EVENT } from "../add-product.lib"
import {
  AUTOFILL_IMAGE_TYPES,
  AUTOFILL_LIMITS,
  AUTOFILL_PDF_TYPE,
  type AutofillErrorCode,
  type MissingField,
  type ProductAutofillOutput,
  type ProductAutofillResponse,
} from "./ai-autofill.dto"
import {
  contentBlocksToHtml,
  describeCurrentListing,
  pickAutofillCategory,
  planAutofillChanges,
  sectionForPath,
  toParsedImport,
  type AutofillChange,
} from "./ai-autofill.lib"

/**
 * "Add your product with AI" (PLAN.md AI-1): photos, a PDF and/or a short
 * description fill the product form. On the edit page the same box takes a
 * change request ("make the description longer") for the product as it is.
 * The seller reviews and saves; nothing is saved here. Product photos also
 * become the product's images; screenshots (of reviews, chats) do not.
 */

/** Matches the form's image limit (basic-section MAX_PRODUCT_IMAGES). */
const MAX_PRODUCT_IMAGES = 8
/** Longest side of the copy sent to the model. */
const AI_IMAGE_MAX_SIDE = 1536
/** Product images the existing uploader accepts as they are. */
const UPLOADABLE_TYPES = ["image/jpeg", "image/png"]
const LOCALES: SupportedLocale[] = ["ar", "en"]

type Picked = { id: string; file: File; preview: string }

type Review = {
  filled: number
  missing: MissingField[]
  warnings: string[]
  undo: AutofillChange[]
}

type PromptValues = { prompt: string }

function loadImage (file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("image"))
    }
    image.src = url
  })
}

/** A JPEG copy whose longest side is at most `maxSide` (white behind transparency). */
async function toJpeg (file: File, maxSide: number, quality = 0.85): Promise<Blob> {
  const image = await loadImage(file)
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas")
  context.fillStyle = "#fff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/jpeg", quality)
  )
}

const renamed = (name: string, ext: string) => `${name.replace(/\.[^.]+$/, "") || "photo"}.${ext}`

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
  const isEdit = mode === "edit"
  // The prompt has its own small form: registered (uncontrolled), so typing
  // never re-renders the product form and no keystroke is lost.
  const promptForm = useForm<PromptValues>({ defaultValues: { prompt: "" } })
  const prompt = useWatch({ control: promptForm.control, name: "prompt" }) ?? ""
  const [images, setImages] = useState<Picked[]>([])
  const [pdf, setPdf] = useState<File | null>(null)
  const [replace, setReplace] = useState(false)
  const [running, setRunning] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const idSeq = useRef(0)

  const hasInput = prompt.trim().length > 0 || images.length > 0 || pdf !== null
  const [arTitle, enTitle] = useWatch({ control: form.control, name: ["localized.ar.title", "localized.en.title"] })
  const formHasContent = Boolean(arTitle?.trim() || enTitle?.trim())

  const addFiles = (files: File[]) => {
    const nextImages = [...images]
    let nextPdf = pdf
    for (const file of files) {
      if (file.type === AUTOFILL_PDF_TYPE) {
        if (file.size > AUTOFILL_LIMITS.maxPdfBytes) toast.error(t("errors.pdfTooLarge"))
        else nextPdf = file
      } else if ((AUTOFILL_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        if (nextImages.length >= AUTOFILL_LIMITS.maxImages) {
          toast.error(t("errors.tooManyImages", { max: AUTOFILL_LIMITS.maxImages }))
          break
        }
        nextImages.push({ id: `ai-${idSeq.current++}`, file, preview: URL.createObjectURL(file) })
      } else {
        toast.error(t("errors.badFile"))
      }
    }
    setImages(nextImages)
    setPdf(nextPdf)
  }

  const removeImage = (id: string) =>
    setImages((current) => {
      const gone = current.find((item) => item.id === id)
      if (gone) URL.revokeObjectURL(gone.preview)
      return current.filter((item) => item.id !== id)
    })

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: addFiles,
    noClick: true,
    noKeyboard: true,
    disabled: running,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      [AUTOFILL_PDF_TYPE]: [".pdf"],
    },
  })

  /** Product photos join the product's images (up to the form limit); webp is stored as JPEG. */
  const uploadProductImages = async (picked: Picked[]) => {
    const current = form.getValues("images") ?? []
    const room = Math.max(0, MAX_PRODUCT_IMAGES - current.length)
    if (room === 0 || picked.length === 0) return
    const supabase = createClient()
    const paths = await Promise.all(
      picked.slice(0, room).map(async ({ file }) => {
        try {
          const upload = UPLOADABLE_TYPES.includes(file.type)
            ? file
            : new File([await toJpeg(file, 2400, 0.9)], renamed(file.name, "jpg"), { type: "image/jpeg" })
          const { data, error } = await supabase.storage
            .from("products")
            .upload(generateImageName(upload), upload, { cacheControl: "31536000", upsert: false })
          return error ? null : data.path
        } catch {
          return null
        }
      })
    )
    const added = paths.filter((path): path is string => Boolean(path))
    if (added.length) {
      form.setValue("images", [...(form.getValues("images") ?? []), ...added].slice(0, MAX_PRODUCT_IMAGES), {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    if (added.length < Math.min(room, picked.length)) toast.warning(t("errors.photoUploadFailed"))
  }

  /** Sends the prompt and files; `sent` lists the images in the order the model numbers them. */
  const requestAutofill = async (text: string, sent: Picked[]): Promise<ProductAutofillResponse> => {
    const body = new FormData()
    body.set("text", text)
    for (const item of images) {
      const jpeg = await toJpeg(item.file, AI_IMAGE_MAX_SIDE).catch(() => null)
      if (!jpeg) continue
      body.append("images", jpeg, renamed(item.file.name, "jpg"))
      sent.push(item)
    }
    if (pdf) body.set("pdf", pdf, pdf.name)
    if (isEdit) body.set("current", describeCurrentListing(form.getValues(), AUTOFILL_LIMITS.maxCurrentLength))
    const response = await fetch("/api/ai/product-autofill", { method: "POST", body })
    try {
      return (await response.json()) as ProductAutofillResponse
    } catch {
      // A non-JSON body comes from the platform (size limit or the 60 s cut-off), not the route.
      const error = response.status === 413 ? "tooLarge" : response.status === 504 ? "timeout" : "failed"
      return { ok: false, error }
    }
  }

  /** The model's picks; when it marked none and found no reviews, every image counts as a product photo. */
  const productPhotos = (output: ProductAutofillOutput, sent: Picked[]) =>
    output.productPhotos.length || output.reviews.length
      ? output.productPhotos.map((index) => sent[index]).filter((item): item is Picked => Boolean(item))
      : sent

  const run = async ({ prompt: text }: PromptValues) => {
    if (!hasInput || running) return
    setRunning(true)
    setReview(null)
    try {
      const sent: Picked[] = []
      const response = await requestAutofill(text.trim(), sent)
      if (!response.ok) {
        if (response.error === "dailyLimit") setRemaining(0)
        toast.error(t(`errors.${response.error satisfies AutofillErrorCode}`, { max: AUTOFILL_LIMITS.maxPdfPages }))
        return
      }

      const { output, remainingToday } = response.result
      setRemaining(remainingToday)
      await uploadProductImages(productPhotos(output, sent))

      // existingImages stops the import builder from fetching remote images.
      const built = await buildFormValuesFromImport(
        toParsedImport(output),
        { sellerPricing, categories },
        { existingImages: ["-"] }
      )
      const current = form.getValues()
      const photoUrls = (current.images ?? []).map((path) => getPublicUrl(path, "products"))
      const contentHtml = Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          contentBlocksToHtml(
            output.localized[locale].contentBlocks,
            photoUrls,
            output.localized[locale].title || current.localized?.[locale]?.title || ""
          ),
        ])
      ) as Record<SupportedLocale, string>
      // Matched here from the AI's titles and hint; the prompt carries no category list (docs/ai.md).
      const categoryId = pickAutofillCategory(categories, output) ?? (built.categoryMatched ? built.values.categoryId : null)
      const missing: MissingField[] = categoryId || current.categoryId ? output.missing : [...output.missing, "category"]
      const changes = planAutofillChanges(
        current,
        built.values,
        output,
        isEdit ? "edit" : replace ? "replace" : "empty",
        {
          categoryId,
          brandId: built.brandMatched ? built.values.brandId : undefined,
          storeCategoryName: output.storeCategoryName,
          contentHtml,
        }
      )

      // The variants editor builds rows from the types; undo must restore the
      // rows first, else it rebuilds types from the generated rows.
      const undoPaths = changes.map(({ path }) => path)
      if (undoPaths.includes("variantTypes")) undoPaths.unshift("variants")
      const undo = undoPaths.map((path) => ({
        path,
        value: structuredClone(form.getValues(path as never)),
      }))
      for (const { path, value } of changes) {
        form.setValue(path as never, value as never, { shouldDirty: true, shouldValidate: true })
      }
      // Open every folded section the AI wrote into, so the seller sees it.
      for (const section of new Set(changes.map(({ path }) => sectionForPath(path)))) {
        document.dispatchEvent(new CustomEvent(OPEN_SECTION_EVENT, { detail: section }))
      }

      setReview({ filled: changes.length, missing: isEdit ? [] : missing, warnings: output.warnings, undo })
      if (changes.length) onAppliedChange?.(1)
      promptForm.reset({ prompt: "" })
      images.forEach((item) => URL.revokeObjectURL(item.preview))
      setImages([])
      setPdf(null)
      if (changes.length) toast.success(t("filledToast", { count: changes.length }))
      else toast.message(t(isEdit ? "nothingChanged" : "nothingFilled"))
    } catch (error) {
      console.error("AI autofill failed", error)
      toast.error(t("errors.failed"))
    } finally {
      setRunning(false)
    }
  }

  const submit = promptForm.handleSubmit(run)

  const undoFill = () => {
    if (!review) return
    for (const { path, value } of review.undo) {
      form.setValue(path as never, value as never, { shouldDirty: true, shouldValidate: true })
    }
    if (review.undo.length) onAppliedChange?.(-1)
    setReview(null)
    toast.message(t("undone"))
  }

  const outOfCalls = remaining === 0
  const title = isEdit ? t("editTitle") : t("title")
  const promptField = promptForm.register("prompt", {
    setValueAs: (value: string) => value.slice(0, AUTOFILL_LIMITS.maxTextLength),
  })

  return (
    <section
      id="sec-ai"
      aria-labelledby="sec-ai-title"
      className="scroll-mt-[136px] rounded-2xl border border-primary/25 bg-card p-3 md:scroll-mt-[88px] sm:p-3.5"
    >
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <h2 id="sec-ai-title" className="text-sm font-bold">
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
          "relative rounded-xl border bg-background transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15",
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
                <button type="button" onClick={() => setPdf(null)} disabled={running} aria-label={t("remove")}>
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
            className="size-9 shrink-0 rounded-lg text-muted-foreground"
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
            className="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-[13px] font-semibold"
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
              <Button type="button" variant="ghost" className={cn(SMALL_BUTTON_CLASS, "h-7 px-2 text-xs")} onClick={() => setReview(null)}>
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
