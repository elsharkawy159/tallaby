"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import type { SectionInstance } from "@/components/sections/registry.types"
import { SectionUiPreview } from "@/components/website-builder/section-ui-preview"
import { useBuilderStore } from "@/lib/builder/store"

export interface SectionDetailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: SectionInstance
  label: string
  description?: string
  onUse?: () => void
}

export function SectionDetailPreviewDialog ({
  open,
  onOpenChange,
  section,
  label,
  description,
  onUse,
}: SectionDetailPreviewDialogProps) {
  const designSystem = useBuilderStore((s) => s.designSystem)
  const projectLogoUrl = useBuilderStore((s) => s.projectLogoUrl)
  const projectName = useBuilderStore((s) => s.projectName)
  const defaultLocale = useBuilderStore((s) => s.defaultLocale)
  const supportedLocales = useBuilderStore((s) => s.supportedLocales)

  function handleUse () {
    onUse?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-210 flex max-h-[90vh]! w-[min(96vw,1280px)]! max-w-6xl! flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-start">
          <DialogTitle>{label}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SectionUiPreview
            section={section}
            designSystem={designSystem}
            projectLogoUrl={projectLogoUrl}
            projectName={projectName}
            defaultLocale={defaultLocale}
            supportedLocales={supportedLocales}
            fallbackLabel={label}
          />
        </div>

        {onUse ? (
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" onClick={handleUse}>
              Use section
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
