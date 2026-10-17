"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { formatDateTime } from "@workspace/i18n"
import { notify } from "@/services/toast"
import { History, Loader2, RotateCcw } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { listItemRevisionsAction, restoreItemRevisionAction } from "@/actions/cms/item-revision-actions"
import type { CmsItemRevision } from "@/types/cms/cms.types"

export function RevisionHistory({ itemId, projectId }: { itemId: string; projectId: string }) {
  const t = useTranslations('cms.revisionHistory')
  const locale = useLocale()
  const REASON_LABEL: Record<CmsItemRevision["reason"], string> = {
    manual: t('manual'),
    autosave: t('autosave'),
    ai_rewrite: t('aiRewrite'),
    restore: t('restored'),
  }
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [revisions, setRevisions] = useState<CmsItemRevision[]>([])
  const [isPending, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      const rows = await listItemRevisionsAction(itemId, projectId)
      setRevisions(rows)
    })
  }

  const restore = (revisionId: string) => {
    startTransition(async () => {
      await restoreItemRevisionAction(revisionId, itemId, projectId)
      notify.success(t('toastRestored'))
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); load() }}>
        <History className="size-4" /> {t('history')}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('title')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-6">
            {isPending && !revisions.length && (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isPending && !revisions.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )}
            {revisions.map((revision) => (
              <div key={revision.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{REASON_LABEL[revision.reason] ?? revision.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(revision.createdAt, locale)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => restore(revision.id)} disabled={isPending}>
                  <RotateCcw className="size-3.5" /> {t('restore')}
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
