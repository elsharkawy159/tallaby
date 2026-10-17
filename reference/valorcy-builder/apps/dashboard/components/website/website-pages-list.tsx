"use client"

import { useState, useTransition } from 'react'
import { Plus, Settings2, ChevronUp, ChevronDown, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/components/table'
import { Link } from '@/i18n/navigation'
import { reorderWebsitePages } from '@/actions/website-page-actions'
import { ManagePageSheet } from './manage-page-sheet'

type WebsitePageRow = {
  id: string
  name: unknown
  slug: string
  locale: string
  isHome: boolean
  status: 'draft' | 'published'
  updatedAt: string
  orderIndex: number
  requiresAuth?: boolean
  authRedirectPath?: string | null
}

function pageName(name: unknown, locale: string) {
  if (!name) return '—'
  if (typeof name === 'string') return name
  if (typeof name === 'object' && name) {
    const value = name as Record<string, unknown>
    return (value[locale] as string) ?? (value.en as string) ?? (value.ar as string) ?? '—'
  }
  return '—'
}

export function WebsitePagesList({
  pages,
  websiteId,
  projectId,
  onCreateClick,
}: {
  pages: WebsitePageRow[]
  websiteId: string
  projectId: string
  onCreateClick?: () => void
}) {
  const sortedPages = pages.slice().sort((a, b) => a.orderIndex - b.orderIndex)
  const serverSignature = sortedPages.map((p) => p.id).join('|')

  const [rows, setRows] = useState<WebsitePageRow[]>(sortedPages)
  const [syncedSignature, setSyncedSignature] = useState(serverSignature)
  const [managePage, setManagePage] = useState<WebsitePageRow | null>(null)
  const [isPending, startTransition] = useTransition()

  // Re-sync local order when the server data changes (adjust state during render).
  if (serverSignature !== syncedSignature) {
    setRows(sortedPages)
    setSyncedSignature(serverSignature)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= rows.length) return

    const next = rows.slice()
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved!)
    setRows(next)

    startTransition(async () => {
      try {
        await reorderWebsitePages(projectId, websiteId, next.map((p) => p.id))
      } catch (err) {
        setRows(rows)
        toast.error(err instanceof Error ? err.message : 'Failed to reorder pages')
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onCreateClick}>
            <Plus className="size-4 me-1.5" />
            Create page
          </Button>
        </div>

        <div className="rounded-lg border border-border/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, index) => (
                <TableRow key={p.id}>
                  <TableCell className="pe-0">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || isPending}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === rows.length - 1 || isPending}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{pageName(p.name, p.locale)}</span>
                      {p.isHome && (
                        <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px]">
                          Home
                        </Badge>
                      )}
                      {p.requiresAuth && (
                        <Badge
                          variant="outline"
                          className="h-5 gap-1 px-2 py-0 text-[10px]"
                          title="Only signed-in visitors can open this page"
                        >
                          <Lock className="size-2.5" />
                          Members
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.locale}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManagePage(p)}
                      >
                        <Settings2 className="size-3.5 me-1.5" />
                        Manage
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/website-builder/edit/${websiteId}?page=${encodeURIComponent(p.slug)}`}
                        >
                          Open builder
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No pages yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ManagePageSheet
        open={Boolean(managePage)}
        onOpenChange={(o) => { if (!o) setManagePage(null) }}
        page={managePage}
        projectId={projectId}
        websiteId={websiteId}
      />
    </>
  )
}
