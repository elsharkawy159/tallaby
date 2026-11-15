"use client"

import { useRef, useState } from "react"
import { useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { getPublicUrl } from "@/lib/utils"
import { uploadProductImage } from "@/components/inputs/use-seller-upload"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import type { AddProductFormData, CategoryOption, SupportedLocale } from "../add-product.schema"
import { buildFormValuesFromImport } from "../build-form-values-from-import.lib"
import { OPEN_SECTION_EVENT } from "../add-product.lib"
import { useProductStoreId } from "../../_components/product-store.client"
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
  type AutofillMode,
} from "./ai-autofill.lib"

/**
 * The AI fill behind both screens: the add page's chat stage and the edit page's
 * card (PLAN.md AI-1). Photos, a PDF and/or text fill the product form; the seller
 * reviews and saves, nothing is saved here. Product photos also become the
 * product's images; screenshots (of reviews, chats) do not.
 */

/** Matches the form's image limit (basic-section MAX_PRODUCT_IMAGES). */
const MAX_PRODUCT_IMAGES = 8
/** Longest side of the copy sent to the model. */
const AI_IMAGE_MAX_SIDE = 1536
/** Product images the existing uploader accepts as they are. */
const UPLOADABLE_TYPES = ["image/jpeg", "image/png"]
const LOCALES: SupportedLocale[] = ["ar", "en"]

export type PickedImage = { id: string; file: File; preview: string }

export type AutofillReview = {
  filled: number
  /** The form paths this fill really wrote. */
  paths: string[]
  photosAdded: number
  /** The AI gave something the form kept its own value for (only empty fields are written). */
  keptSome: boolean
  missing: MissingField[]
  warnings: string[]
  undo: AutofillChange[]
}

/** What the stage shows as the run moves on; each step only reports what really happened. */
export type AutofillProgress =
  | { phase: "answered"; output: ProductAutofillOutput; categoryId: string | null }
  | { phase: "photos"; previews: string[] }
  | { phase: "applied"; review: AutofillReview }
  | { phase: "failed" }

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

/** Puts back what a fill changed. */
export function undoAutofill (form: UseFormReturn<AddProductFormData>, review: AutofillReview) {
  for (const { path, value } of review.undo) {
    form.setValue(path as never, value as never, { shouldDirty: true, shouldValidate: true })
  }
}

export function useAiAutofill ({
  form,
  categories,
  sellerPricing,
  mode = "add",
  onAppliedChange,
  onProgress,
}: {
  form: UseFormReturn<AddProductFormData>
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  /** "edit": the product exists, and the text is a change request. */
  mode?: "add" | "edit"
  /** +1 when a fill changed the form, -1 when it was undone; the form marks the saved product as AI-assisted (0112). */
  onAppliedChange?: (delta: 1 | -1) => void
  /** The stage's progress. With it, the screen reports the result (no toast) and frees the previews itself. */
  onProgress?: (progress: AutofillProgress) => void
}) {
  const t = useTranslations("productForm.ai")
  const isEdit = mode === "edit"
  const productStoreId = useProductStoreId()
  // The prompt has its own small form: registered (uncontrolled), so typing
  // never re-renders the product form and no keystroke is lost.
  const promptForm = useForm<PromptValues>({ defaultValues: { prompt: "" } })
  const prompt = useWatch({ control: promptForm.control, name: "prompt" }) ?? ""
  const [images, setImages] = useState<PickedImage[]>([])
  const [pdf, setPdf] = useState<File | null>(null)
  const [replace, setReplace] = useState(false)
  const [running, setRunning] = useState(false)
  const [review, setReview] = useState<AutofillReview | null>(null)
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

  const dropzone = useDropzone({
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

  /** Product photos join the product's images (up to the form limit); webp is stored as JPEG. Returns the ones added. */
  const uploadProductImages = async (picked: PickedImage[]): Promise<PickedImage[]> => {
    const current = form.getValues("images") ?? []
    const room = Math.max(0, MAX_PRODUCT_IMAGES - current.length)
    if (room === 0 || picked.length === 0) return []
    const taken = picked.slice(0, room)
    const paths = await Promise.all(
      taken.map(async ({ file }) => {
        try {
          const upload = UPLOADABLE_TYPES.includes(file.type)
            ? file
            : new File([await toJpeg(file, 2400, 0.9)], renamed(file.name, "jpg"), { type: "image/jpeg" })
          // Signed upload into the seller's own folder (the bucket refuses direct writes, 0153).
          return await uploadProductImage(upload)
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
    return taken.filter((_, index) => Boolean(paths[index]))
  }

  /** Sends the prompt and files; `sent` lists the images in the order the model numbers them. */
  const requestAutofill = async (text: string, sent: PickedImage[]): Promise<ProductAutofillResponse> => {
    const body = new FormData()
    // The page's store: its own category names guide the model (F-87d); the route checks it against the session.
    body.set("storeId", productStoreId)
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
  const productPhotos = (output: ProductAutofillOutput, sent: PickedImage[]) =>
    output.productPhotos.length || output.reviews.length
      ? output.productPhotos.map((index) => sent[index]).filter((item): item is PickedImage => Boolean(item))
      : sent

  const run = async ({ prompt: text }: PromptValues) => {
    if (!hasInput || running) return
    setRunning(true)
    setReview(null)
    try {
      const sent: PickedImage[] = []
      const response = await requestAutofill(text.trim(), sent)
      if (!response.ok) {
        if (response.error === "dailyLimit") setRemaining(0)
        toast.error(t(`errors.${response.error satisfies AutofillErrorCode}`, { max: AUTOFILL_LIMITS.maxPdfPages }))
        onProgress?.({ phase: "failed" })
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
      // Matched here from the AI's titles and hint; the prompt carries no category list (docs/ai.md).
      const categoryId = pickAutofillCategory(categories, output) ?? (built.categoryMatched ? built.values.categoryId : null)
      onProgress?.({ phase: "answered", output, categoryId: categoryId ?? null })

      const uploaded = await uploadProductImages(productPhotos(output, sent))
      onProgress?.({ phase: "photos", previews: uploaded.map((item) => item.preview) })

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
      const missing: MissingField[] = categoryId || current.categoryId ? output.missing : [...output.missing, "category"]
      const planExtra = {
        categoryId,
        brandId: built.brandMatched ? built.values.brandId : undefined,
        storeCategoryName: output.storeCategoryName,
        contentHtml,
      }
      const fillMode = isEdit ? "edit" : replace ? "replace" : "empty"
      // A value equal to what's there (a default such as the condition) isn't a change.
      const realChanges = (planMode: AutofillMode) =>
        planAutofillChanges(current, built.values, output, planMode, planExtra).filter(
          ({ path, value }) => JSON.stringify(form.getValues(path as never)) !== JSON.stringify(value)
        )
      const changes = realChanges(fillMode)
      const keptSome = fillMode === "empty" && realChanges("replace").length > changes.length

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

      const nextReview: AutofillReview = {
        filled: changes.length,
        paths: changes.map(({ path }) => path),
        photosAdded: uploaded.length,
        keptSome,
        missing: isEdit ? [] : missing,
        warnings: output.warnings,
        undo,
      }
      setReview(nextReview)
      if (changes.length) onAppliedChange?.(1)
      promptForm.reset({ prompt: "" })
      if (!onProgress) images.forEach((item) => URL.revokeObjectURL(item.preview))
      setImages([])
      setPdf(null)
      if (onProgress) {
        onProgress({ phase: "applied", review: nextReview })
      } else if (changes.length) {
        toast.success(t("filledToast", { count: changes.length }))
      } else {
        toast.message(t(isEdit ? "nothingChanged" : "nothingFilled"))
      }
    } catch (error) {
      console.error("AI autofill failed", error)
      toast.error(t("errors.failed"))
      onProgress?.({ phase: "failed" })
    } finally {
      setRunning(false)
    }
  }

  const undoFill = () => {
    if (!review) return
    undoAutofill(form, review)
    if (review.undo.length) onAppliedChange?.(-1)
    setReview(null)
    toast.message(t("undone"))
  }

  return {
    isEdit,
    promptForm,
    promptField: promptForm.register("prompt", {
      setValueAs: (value: string) => value.slice(0, AUTOFILL_LIMITS.maxTextLength),
    }),
    prompt,
    images,
    pdf,
    clearPdf: () => setPdf(null),
    replace,
    setReplace,
    running,
    review,
    dismissReview: () => setReview(null),
    undoFill,
    remaining,
    outOfCalls: remaining === 0,
    hasInput,
    formHasContent,
    addFiles,
    removeImage,
    dropzone,
    submit: promptForm.handleSubmit(run),
  }
}
