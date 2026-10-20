"use client"

import { useTranslations } from "next-intl"
import { Search, Plus, Trash2, CheckCircle2, Archive, EyeOff } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Link } from "@/i18n/navigation"
import { CsvImportDialog } from "@/components/cms/csv-import-dialog"
import { ColumnPicker, type ColumnVisibility } from "@/components/cms/record-table/column-picker"
import type { CmsCollection } from "@/types/cms/cms.types"

interface RecordTableToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  projectId: string
  collection: CmsCollection
  selectedCount: number
  onBulkAction: (action: "publish" | "unpublish" | "archive" | "delete") => void
  columnVisibility: ColumnVisibility
  onColumnVisibilityChange: (v: ColumnVisibility) => void
}

export function RecordTableToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  projectId,
  collection,
  selectedCount,
  onBulkAction,
  columnVisibility,
  onColumnVisibilityChange,
}: RecordTableToolbarProps) {
  const t = useTranslations('cms.recordToolbar')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="ps-8"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('statusPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allStatuses')}</SelectItem>
          <SelectItem value="draft">{t('statusDraft')}</SelectItem>
          <SelectItem value="published">{t('statusPublished')}</SelectItem>
          <SelectItem value="scheduled">{t('statusScheduled')}</SelectItem>
          <SelectItem value="archived">{t('statusArchived')}</SelectItem>
        </SelectContent>
      </Select>

      {selectedCount > 0 && (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
          <span className="px-1 text-xs text-muted-foreground">{t('selectedCount', { count: selectedCount })}</span>
          <Button variant="ghost" size="sm" onClick={() => onBulkAction("publish")}>
            <CheckCircle2 className="size-3.5" /> {t('publish')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onBulkAction("unpublish")}>
            <EyeOff className="size-3.5" /> {t('unpublish')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onBulkAction("archive")}>
            <Archive className="size-3.5" /> {t('archive')}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onBulkAction("delete")}>
            <Trash2 className="size-3.5" /> {t('delete')}
          </Button>
        </div>
      )}

      <div className="ms-auto flex items-center gap-2">
        <ColumnPicker
          collection={collection}
          value={columnVisibility}
          onChange={onColumnVisibilityChange}
        />
        <CsvImportDialog collection={collection} projectId={projectId} />
        <Button asChild size="sm">
          <Link href={`/projects/${projectId}/cms/${collection.slug}/new` as any}>
            <Plus className="size-4" /> {t('newRecord')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
