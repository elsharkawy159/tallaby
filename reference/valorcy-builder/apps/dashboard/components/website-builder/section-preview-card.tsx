"use client"

import { forwardRef, useMemo, useState, type KeyboardEvent } from "react"
import { Loader2, ZoomIn } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type {
  SectionDefinition,
  SectionInstance,
} from "@/components/sections/registry.types"
import { SectionDetailPreviewDialog } from "@/components/website-builder/section-detail-preview-dialog"
import { SectionUiPreview } from "@/components/website-builder/section-ui-preview"
import { createPreviewSectionInstanceFromDef } from "@/lib/builder/create-preview-section-instance"
import { useBuilderStore } from "@/lib/builder/store"

export interface SectionPreviewCardProps {
  /** Section definition — rendered with its registry-default props. */
  def?: SectionDefinition
  /** Explicit instance to preview (e.g. a saved block). Takes precedence over `def`. */
  instance?: SectionInstance
  /** Label shown under the preview. Defaults to `def.displayName`. */
  label?: string
  /** Render the live section preview. When false, shows a lightweight initial. */
  showPreview?: boolean
  isLoading?: boolean
  isDragging?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Reusable pre-built section card with a live in-context preview.
 * Used by the layouts palette (draggable) and the add-section dialog (clickable).
 */
export const SectionPreviewCard = forwardRef<HTMLDivElement, SectionPreviewCardProps>(
  function SectionPreviewCard(
    {
      def,
      instance,
      label,
      showPreview = true,
      isLoading,
      isDragging,
      disabled,
      onClick,
      className,
    },
    ref,
  ) {
    const designSystem = useBuilderStore((s) => s.designSystem)
    const projectLogoUrl = useBuilderStore((s) => s.projectLogoUrl)
    const projectName = useBuilderStore((s) => s.projectName)
    const defaultLocale = useBuilderStore((s) => s.defaultLocale)
    const supportedLocales = useBuilderStore((s) => s.supportedLocales)
    const kitId = useBuilderStore((s) => s.kitId)

    const previewSection = useMemo(
      () => instance ?? (def ? createPreviewSectionInstanceFromDef(def, defaultLocale, kitId) : null),
      [instance, def, defaultLocale, kitId],
    )

    const [detailOpen, setDetailOpen] = useState(false)

    const displayLabel = label ?? def?.displayName ?? ""
    const interactive = Boolean(onClick) && !disabled
    const canPreviewDetail = showPreview && previewSection && !disabled && !isLoading

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (!interactive) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClick?.()
      }
    }

    return (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={disabled || undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-border bg-card p-2 text-start shadow-sm transition-colors",
          "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          interactive && "cursor-pointer",
          (disabled || isLoading) && "pointer-events-none opacity-60",
          isDragging && "opacity-60",
          className,
        )}
      >
        <div className="group relative w-full overflow-hidden rounded-md bg-muted">
          {showPreview && previewSection ? (
            <SectionUiPreview
              section={previewSection}
              designSystem={designSystem}
              projectLogoUrl={projectLogoUrl}
              projectName={projectName}
              defaultLocale={defaultLocale}
              supportedLocales={supportedLocales}
              fallbackLabel={displayLabel}
              className="rounded-md"
            />
          ) : (
            <div className="flex w-full items-center justify-center bg-muted/50 py-8">
              <span className="text-lg font-semibold uppercase text-muted-foreground/30 select-none">
                {displayLabel.charAt(0)}
              </span>
            </div>
          )}
          {canPreviewDetail ? (
            <button
              type="button"
              aria-label="Preview section"
              title="Preview section"
              className="absolute top-2 end-2 z-10 flex size-7 items-center justify-center rounded-md border border-border/50 bg-background/80 text-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setDetailOpen(true)
              }}
            >
              <ZoomIn className="size-3.5" />
            </button>
          ) : null}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <p className="text-center text-xs font-medium leading-tight">{displayLabel}</p>

        {previewSection ? (
          // The dialog is portaled to <body>, but React synthetic events still
          // bubble through the React tree — so a click on "Use section" would
          // also reach the card's own onClick and insert the section twice.
          // Same guard as `isInsideBuilderOverlay` in the canvas.
          <div onClick={(e) => e.stopPropagation()}>
            <SectionDetailPreviewDialog
              open={detailOpen}
              onOpenChange={setDetailOpen}
              section={previewSection}
              label={displayLabel}
              description={def?.description}
              onUse={interactive ? onClick : undefined}
            />
          </div>
        ) : null}
      </div>
    )
  },
)
