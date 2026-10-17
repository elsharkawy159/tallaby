'use client'

import { useState } from 'react'
import { FileText, GripVertical, Home, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useSortablePage } from '@/components/website-builder/dnd/use-panel-sortables'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import { cn } from '@workspace/ui/lib/utils'
import { useBuilderStore } from '@/lib/builder/store'
import { normalizePageContent } from '@/lib/builder/normalize-page-content'
import { AddPageDialog } from '@/components/website/add-page-dialog'
import { PageSeoDialog } from './page-seo-dialog'

type Page = ReturnType<typeof useBuilderStore.getState>['pages'][number]

function getPageName(page: Page): string {
  if (typeof page.name === 'object') {
    return page.name.en ?? Object.values(page.name)[0] ?? page.slug
  }
  return page.slug
}

/**
 * One draggable page row.
 *
 * Reordering persists through the builder's shared drop pipeline, which calls
 * `reorderPages` locally and `reorderWebsitePages` on the server — both of
 * which already existed but had no UI wired to them.
 */
function SortablePageRow({
  page,
  index,
  isActive,
  onSelect,
  onSeo,
  onEdit,
  onDelete,
}: {
  page: Page
  index: number
  isActive: boolean
  onSelect: () => void
  onSeo: (page: Page, e: React.MouseEvent) => void
  onEdit: (page: Page, e: React.MouseEvent) => void
  onDelete: (pageId: string, e: React.MouseEvent) => void
}) {
  const { ref, handleRef, isDragging } = useSortablePage({ pageId: page.id, index })
  const name = getPageName(page)

  return (
    <div
      ref={ref}
      className={cn(
        'group flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-sm transition-colors cursor-pointer',
        isActive
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        isDragging && 'opacity-60 shadow-lg'
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        ref={handleRef}
        aria-label={`Reorder ${name}`}
        aria-roledescription="draggable page"
        className="shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </button>
      {page.isHome ? (
        <Home className="size-3.5 shrink-0" />
      ) : (
        <FileText className="size-3.5 shrink-0" />
      )}
      <span className="flex-1 truncate capitalize">{name}</span>
      {page.status === 'published' && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" title="Published" />
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => onSeo(page, e)}
          className="rounded p-0.5 hover:bg-background/60 text-muted-foreground hover:text-foreground"
          title="SEO settings"
        >
          <Search className="size-3" />
        </button>
        <button
          onClick={(e) => onEdit(page, e)}
          className="rounded p-0.5 hover:bg-background/60 text-muted-foreground hover:text-foreground"
          title="Rename / edit slug"
        >
          <Pencil className="size-3" />
        </button>
        {!page.isHome && (
          <button
            onClick={(e) => onDelete(page.id, e)}
            className="rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete page"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}

export function PagesPanel() {
  const pages = useBuilderStore((s) => s.pages)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const switchPage = useBuilderStore((s) => s.switchPage)
  const updatePageName = useBuilderStore((s) => s.updatePageName)
  const updatePageSlug = useBuilderStore((s) => s.updatePageSlug)
  const removePage = useBuilderStore((s) => s.removePage)
  const projectId = useBuilderStore((s) => s.projectId)
  const websiteId = useBuilderStore((s) => s.websiteId)
  const builderLocale = useBuilderStore((s) => s.builderLocale)

  const [addPageOpen, setAddPageOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null)
  const [seoPage, setSeoPage] = useState<Page | null>(null)

  function openEdit(page: Page, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPage(page)
    setEditName(getPageName(page))
    setEditSlug(page.slug)
  }

  function openSeo(page: Page, e: React.MouseEvent) {
    e.stopPropagation()
    setSeoPage(page)
  }

  function handleEditSave() {
    if (!editingPage) return
    const trimmedName = editName.trim()
    const trimmedSlug = editSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (trimmedName) {
      const existing = typeof editingPage.name === 'object' ? editingPage.name : {}
      updatePageName(editingPage.id, { ...existing, en: trimmedName })
    }
    if (trimmedSlug && trimmedSlug !== editingPage.slug) {
      updatePageSlug(editingPage.id, trimmedSlug)
    }
    setEditingPage(null)
  }

  function openDelete(pageId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeletingPageId(pageId)
  }

  function handleDeleteConfirm() {
    if (deletingPageId) removePage(deletingPageId)
    setDeletingPageId(null)
  }

  /** Push the freshly created page into the builder store so it shows up without a reload. */
  function handlePageCreated(page: {
    id: string; websiteId: string; projectId: string
    name: Record<string, string>; slug: string; isHome: boolean
    locale: string; orderIndex: number; status: string; version: number
    draftContent: unknown; publishedContent: unknown | null
    useSharedHeader: boolean; useSharedFooter: boolean
  }) {
    useBuilderStore.getState().addPage({
      id: page.id,
      websiteId: page.websiteId,
      projectId: page.projectId,
      name: page.name,
      slug: page.slug,
      isHome: page.isHome,
      locale: page.locale,
      orderIndex: page.orderIndex,
      status: page.status,
      version: page.version,
      useSharedHeader: page.useSharedHeader,
      useSharedFooter: page.useSharedFooter,
      draftContent: normalizePageContent(page.draftContent),
      publishedContent: page.publishedContent
        ? normalizePageContent(page.publishedContent)
        : null,
    })
    useBuilderStore.temporal.getState().clear()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={!projectId || !websiteId}
          onClick={() => setAddPageOpen(true)}
        >
          <Plus className="size-3.5" />
          New page
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-2 pb-4">
          {pages.map((page, index) => (
            <SortablePageRow
              key={page.id}
              page={page}
              index={index}
              isActive={page.id === activePageId}
              onSelect={() => switchPage(page.id)}
              onSeo={openSeo}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
          {pages.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No pages yet.</p>
          )}
        </div>
      </ScrollArea>

      {/* New page */}
      {projectId && websiteId && (
        <AddPageDialog
          open={addPageOpen}
          onOpenChange={setAddPageOpen}
          projectId={projectId}
          websiteId={websiteId}
          locale={builderLocale}
          onCreated={handlePageCreated}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingPage} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="page-name">Name</Label>
              <Input
                id="page-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-slug">Slug</Label>
              <Input
                id="page-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                placeholder="e.g. about-us"
              />
              <p className="text-[11px] text-muted-foreground">Used in the URL. Lowercase letters, numbers, hyphens only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingPage(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEO editor */}
      {seoPage && projectId && (
        <PageSeoDialog
          open={!!seoPage}
          onOpenChange={(o) => !o && setSeoPage(null)}
          projectId={projectId}
          pageId={seoPage.id}
          pageName={getPageName(seoPage)}
          pageSlug={seoPage.slug}
          isHome={seoPage.isHome}
          subdomain={null}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingPageId} onOpenChange={(o) => !o && setDeletingPageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the page and all its content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
