'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { WebsitesGrid } from './websites-grid'
import type { WebsiteStatus } from '@/lib/builder/website-status'

type DomainStatus = 'pending' | 'verified' | 'failed'

type WebsiteItem = {
  project: { id: string; name: string; slug: string; updatedAt: string; createdAt: string }
  website: {
    id: string
    subdomain: string | null
    customDomain: string | null
    domainStatus: DomainStatus
    status: WebsiteStatus
    updatedAt: string
    createdAt: string
  } | null
}

type Props = {
  items: WebsiteItem[]
  rootDomain: string
}

export function WebsitesPageClient({ items, rootDomain }: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      {/* Create button — shown in header area */}
      <div className="-mt-8 flex justify-end mb-2">
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="size-4 me-1.5" />
          New website
        </Button>
      </div>

      <WebsitesGrid
        items={items}
        rootDomain={rootDomain}
        onCreateClick={() => setCreateOpen(true)}
      />

      <CreateProjectDialog isOpen={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
