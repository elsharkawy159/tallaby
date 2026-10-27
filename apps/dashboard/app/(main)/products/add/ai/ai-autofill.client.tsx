"use client"

import { useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { FileText, ImagePlus, LoaderCircle, Paperclip, Sparkles, Undo2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { createClient } from "@/supabase/client"
import { cn, generateImageName } from "@/lib/utils"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { SectionCard, BUTTON_CLASS, SMALL_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/form/form-ui"
import type { AddProductFormData, CategoryOption } from "../add-product.schema"
import { buildFormValuesFromImport } from "../build-form-values-from-import.lib"
import {
  AUTOFILL_IMAGE_TYPES,
  AUTOFILL_LIMITS,
  AUTOFILL_PDF_TYPE,
  type AutofillErrorCode,
  type MissingField,
  type ProductAutofillResponse,
} from "./ai-autofill.dto"
import { planAutofillChanges, toParsedImport, type AutofillChange } from "./ai-autofill.lib"

/**
 * "Add your product with AI" (PLAN.md AI-1): photos, a PDF and/or a short
 * description fill the product form. The seller reviews and saves; nothing is
 * saved here. Photos also become the product's images.
 */

/** Matches the form's image limit (basic-section MAX_PRODUCT_IMAGES). */
const MAX_PRODUCT_IMAGES = 8
/** Longest side of the copy sent to the model. */
const AI_IMAGE_MAX_SIDE = 1536
/** Product images the existing uploader accepts as they are. */
const UPLOADABLE_TYPES = ["image/jpeg", "image/png"]

type Picked = { id: string; file: File; preview: string }

type Review = {
  filled: number
  missing: MissingField[]
  warnings: string[]
  undo: AutofillChange[]
}

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

export function AiAutofillCard ({
  categories,
  sellerPricing,
}: {
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
}) {
  const t = useTranslations("productForm.ai")
  const form = useFormContext<AddProductFormData>()
  const [text, setText] = useState("")
  const [images, setImages] = useState<Picked[]>([])
  const [pdf, setPdf] = useState<File | null>(null)
  const [replace, setReplace] = useState(false)
  const [running, setRunning] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const idSeq = useRef(0)

  const hasInput = text.trim().length > 0 || images.length > 0 || pdf !== null
  const formHasContent = (() => {
    const values = form.getValues()
    return Boolean(values.localized?.ar?.title?.trim() || values.localized?.en?.title?.trim())
  })()

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

  /** The photos join the product's images (up to the form limit); webp is stored as JPEG. */
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

  const requestAutofill = async (): Promise<ProductAutofillResponse> => {
    const body = new FormData()
    body.set("text", text.trim())
    for (const item of images) {
      const jpeg = await toJpeg(item.file, AI_IMAGE_MAX_SIDE).catch(() => null)
      if (jpeg) body.append("images", jpeg, renamed(item.file.name, "jpg"))
    }
    if (pdf) body.set("pdf", pdf, pdf.name)
    const response = await fetch("/api/ai/product-autofill", { method: "POST", body })
    try {
      return (await response.json()) as ProductAutofillResponse
    } catch {
      return { ok: false, error: response.status === 413 ? "tooLarge" : "failed" }
    }
  }

  const run = async () => {
    if (!hasInput || running) return
    setRunning(true)
    setReview(null)
    try {
      const [response] = await Promise.all([requestAutofill(), uploadProductImages(images)])
      if (!response.ok) {
        if (response.error === "dailyLimit") setRemaining(0)
        toast.error(t(`errors.${response.error satisfies AutofillErrorCode}`))
        return
      }

      const { output, remainingToday } = response.result
      setRemaining(remainingToday)
      // existingImages stops the import builder from fetching remote images.
      const built = await buildFormValuesFromImport(
        toParsedImport(output),
        { sellerPricing, categories },
        { existingImages: ["-"] }
      )
      const current = form.getValues()
      const changes = planAutofillChanges(current, built.values, output, replace ? "replace" : "empty", {
        categoryId: output.categoryId ?? (built.categoryMatched ? built.values.categoryId : null),
        brandId: built.brandMatched ? built.values.brandId : undefined,
        storeCategoryName: output.storeCategoryName,
      })

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

      setReview({ filled: changes.length, missing: output.missing, warnings: output.warnings, undo })
      setText("")
      images.forEach((item) => URL.revokeObjectURL(item.preview))
      setImages([])
      setPdf(null)
      if (changes.length) toast.success(t("filledToast", { count: changes.length }))
      else toast.message(t("nothingFilled"))
    } catch (error) {
      console.error("AI autofill failed", error)
      toast.error(t("errors.failed"))
    } finally {
      setRunning(false)
    }
  }

  const undoFill = () => {
    if (!review) return
    for (const { path, value } of review.undo) {
      form.setValue(path as never, value as never, { shouldDirty: true, shouldValidate: true })
    }
    setReview(null)
    toast.message(t("undone"))
  }

  const outOfCalls = remaining === 0

  return (
    <SectionCard
      id="sec-ai"
      icon={Sparkles}
      title={t("title")}
      description={t("description")}
      className="border-primary/30 bg-gradient-to-b from-primary/[0.04] to-transparent"
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col gap-3 rounded-xl transition-colors",
          isDragActive && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
        )}
      >
        <input {...getInputProps()} aria-label={t("attach")} />
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, AUTOFILL_LIMITS.maxTextLength))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              void run()
            }
          }}
          placeholder={t("placeholder")}
          disabled={running}
          rows={3}
          className={cn(TEXTAREA_CLASS, "min-h-[88px] resize-y")}
        />

        {(images.length > 0 || pdf) && (
          <ul className="flex flex-wrap gap-2" aria-label={t("attachments")}>
            {images.map((item) => (
              <li key={item.id} className="group relative size-16 overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(item.id)}
                  disabled={running}
                  aria-label={t("remove")}
                  className="absolute end-1 top-1 rounded-full bg-background/90 p-0.5 shadow-sm"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
            {pdf && (
              <li className="flex h-16 max-w-[220px] items-center gap-2 rounded-lg border bg-muted px-3 text-xs">
                <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="truncate" dir="auto">{pdf.name}</span>
                <button type="button" onClick={() => setPdf(null)} disabled={running} aria-label={t("remove")}>
                  <X className="size-3.5" />
                </button>
              </li>
            )}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} onClick={open} disabled={running}>
            <Paperclip />
            {t("attach")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("limits", { images: AUTOFILL_LIMITS.maxImages, pdfMb: AUTOFILL_LIMITS.maxPdfBytes / 1024 / 1024 })}
          </span>
          <div className="ms-auto flex flex-wrap items-center gap-3">
            {formHasContent && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={replace} onCheckedChange={(value) => setReplace(value === true)} disabled={running} />
                {t("replaceAll")}
              </label>
            )}
            <Button
              type="button"
              variant="accent"
              className={cn(BUTTON_CLASS, "rounded-xl font-semibold")}
              onClick={() => void run()}
              disabled={!hasInput || running || outOfCalls}
              aria-busy={running}
            >
              {running ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              {running ? t("running") : t("fill")}
            </Button>
          </div>
        </div>

        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 text-sm font-medium text-primary">
            <ImagePlus className="me-2 size-5" aria-hidden />
            {t("dropHere")}
          </div>
        )}
      </div>

      {running && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          <span className="animate-pulse">{t("thinking")}</span>
        </p>
      )}

      {outOfCalls && !running && <p className="text-xs text-destructive">{t("errors.dailyLimit")}</p>}
      {remaining !== null && remaining > 0 && remaining <= 5 && (
        <p className="text-xs text-muted-foreground">{t("remaining", { count: remaining })}</p>
      )}

      {review && (
        <div className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-sm" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span className="font-medium">{t("reviewTitle", { count: review.filled })}</span>
            <div className="ms-auto flex gap-1.5">
              {review.undo.length > 0 && (
                <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} onClick={undoFill}>
                  <Undo2 />
                  {t("undo")}
                </Button>
              )}
              <Button type="button" variant="ghost" className={SMALL_BUTTON_CLASS} onClick={() => setReview(null)}>
                {t("dismiss")}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("reviewHint")}</p>
          {review.missing.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {review.missing.map((field) => (
                <li key={field} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs">
                  {t(`missing.${field}`)}
                </li>
              ))}
            </ul>
          )}
          {review.warnings.map((warning) => (
            <p key={warning} className="text-xs text-amber-700 dark:text-amber-400" dir="auto">
              {warning}
            </p>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
