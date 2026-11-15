"use client"

import { useTranslations } from "next-intl"
import { Sparkles, Undo2, X } from "lucide-react"
import { IconButton, SellerButton } from "@/components/seller-ui"
import { FlowOrb } from "../add-flow.client"
import type { AutofillReview } from "./use-ai-autofill"

/** On top of the form after an AI fill: what to check next, and the way back. */
export function AiFillBanner ({
  review,
  onUndo,
  onDismiss,
}: {
  review: AutofillReview
  onUndo: () => void
  onDismiss: () => void
}) {
  const t = useTranslations("productForm.aiStage")
  const tAi = useTranslations("productForm.ai")

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-accent/35 bg-accent-soft px-4 py-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2" role="status">
      <div className="flex items-center gap-3">
        <FlowOrb icon={Sparkles} small className="bg-(--s-surface) text-accent-ink" />
        <div className="min-w-0 flex-1">
          <b className="block text-sm text-(--s-ink)">{t("bannerTitle")}</b>
          <small className="block text-xs leading-[1.6] text-(--s-muted)">{review.keptSome || !review.filled ? t("bannerPartial") : t("bannerBody")}</small>
        </div>
        <IconButton type="button" onClick={onDismiss} aria-label={tAi("dismiss")}>
          <X aria-hidden />
        </IconButton>
      </div>
      {(review.missing.length > 0 || review.undo.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {review.missing.map((field) => (
            <span key={field} className="rounded-full bg-(--s-surface) px-2.5 text-xs leading-6 font-medium text-accent-ink">
              {tAi(`missing.${field}`)}
            </span>
          ))}
          {review.undo.length > 0 && (
            <SellerButton type="button" variant="mini" size="xs" className="ms-auto" onClick={onUndo}>
              <Undo2 aria-hidden />
              {tAi("undo")}
            </SellerButton>
          )}
        </div>
      )}
      {review.warnings.map((warning) => (
        <p key={warning} className="text-xs text-accent-ink" dir="auto">
          {warning}
        </p>
      ))}
    </div>
  )
}
