'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { PageHeader } from '@/components/navigation/page-header'

export function WebsitesHeader () {
  const tHeaders = useTranslations('pages.pageHeaders')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        title={tHeaders('websites.title')}
        description={tHeaders('websites.description')}
        actions={(
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4 me-1.5" />
            New website
          </Button>
        )}
      />

      <CreateProjectDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  )
}
