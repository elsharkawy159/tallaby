"use client"

import { useTranslations } from "next-intl"
import { ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { Link } from "@/i18n/navigation"
import { RecordForm } from "./record-form"
import type { CmsCollection, CmsItemWithRelations } from "@/types/cms/cms.types"

interface RecordSheetProps {
  item: CmsItemWithRelations | null
  collection: CmsCollection
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function RecordSheet({ item, collection, projectId, open, onOpenChange, onSaved }: RecordSheetProps) {
  const t = useTranslations('cms.recordSheet')
  if (!item) return null

  const primaryKey = collection.primaryFieldKey ?? "title"
  const title = String(item.data[primaryKey] ?? item.slug)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="truncate">{title}</SheetTitle>
              <SheetDescription>/{item.slug}</SheetDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}/cms/${collection.slug}/${item.id}` as any}>
                <ExternalLink className="size-3.5" /> {t('openFullEditor')}
              </Link>
            </Button>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6">
          <RecordForm
            collection={collection}
            item={item}
            projectId={projectId}
            compact
            onSaved={() => onSaved?.()}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
