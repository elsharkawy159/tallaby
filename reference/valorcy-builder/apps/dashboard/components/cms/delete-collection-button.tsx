'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { notify } from '@/services/toast'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@workspace/ui/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog'
import { deleteCollectionAction } from '@/actions/cms/collection-actions'

export function DeleteCollectionButton({
  collectionId,
  collectionName,
  projectId,
  itemCount = 0,
}: {
  collectionId: string
  collectionName: string
  projectId: string
  itemCount?: number
}) {
  const t = useTranslations('cms.deleteCollection')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCollectionAction(collectionId, projectId)
        notify.success(t('toastDeleted'))
        setOpen(false)
        router.push(`/projects/${projectId}/cms`)
        router.refresh()
      } catch (err) {
        notify.error(err instanceof Error ? err.message : t('toastDeleteFailed'))
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" /> {t('deleteCollection')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmTitle', { name: collectionName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {itemCount === 0
              ? t('confirmDescriptionAny')
              : t('confirmDescriptionCount', { count: itemCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t('deleting') : t('deleteCollection')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
