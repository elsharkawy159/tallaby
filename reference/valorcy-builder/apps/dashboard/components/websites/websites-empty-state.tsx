'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Globe, Plus } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

export function WebsitesEmptyState() {
  const t = useTranslations('emptyStates.websites')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Globe className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t('title')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('description')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4 me-1.5" />
          {t('cta')}
        </Button>
      </div>

      <CreateProjectDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  )
}
