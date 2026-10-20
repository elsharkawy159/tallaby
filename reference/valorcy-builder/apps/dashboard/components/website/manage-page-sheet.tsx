'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Home, Copy, Trash2, Lock } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@workspace/ui/components/sheet'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Label } from '@workspace/ui/components/label'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { Separator } from '@workspace/ui/components/separator'
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
import {
  updateWebsitePageMeta,
  publishWebsitePage,
  unpublishWebsitePage,
  setHomePage,
  duplicateWebsitePage,
  deleteWebsitePage,
  setWebsitePageProtection,
} from '@/actions/website-page-actions'

type PageRow = {
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: PageRow | null
  projectId: string
  websiteId: string
}

function getPageName(name: unknown, locale: string): string {
  if (!name) return ''
  if (typeof name === 'string') return name
  if (typeof name === 'object' && name) {
    const v = name as Record<string, unknown>
    return (v[locale] as string) ?? (v.en as string) ?? ''
  }
  return ''
}

function getSeo(page: PageRow | null): { title: string; description: string } {
  return { title: '', description: '' }
}

export function ManagePageSheet({ open, onOpenChange, page, projectId, websiteId }: Props) {
  const router = useRouter()
  const locale = page?.locale ?? 'en'
  const [pageName, setPageName] = useState(getPageName(page?.name, locale))
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [isPublished, setIsPublished] = useState(page?.status === 'published')
  const [requiresAuth, setRequiresAuth] = useState(Boolean(page?.requiresAuth))
  const [protectionPending, startProtectionTransition] = useTransition()
  const [metaPending, startMetaTransition] = useTransition()
  const [publishPending, startPublishTransition] = useTransition()
  const [actionPending, startActionTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sync state when page prop changes (new sheet open)
  const key = page?.id

  function handleSetHome() {
    if (!page) return
    startActionTransition(async () => {
      try {
        await setHomePage(projectId, websiteId, page.id)
        toast.success('Home page updated')
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to set home page')
      }
    })
  }

  function handleDuplicate() {
    if (!page) return
    startActionTransition(async () => {
      try {
        await duplicateWebsitePage(projectId, page.id, websiteId)
        toast.success('Page duplicated')
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to duplicate page')
      }
    })
  }

  function handleDelete() {
    if (!page) return
    startActionTransition(async () => {
      try {
        await deleteWebsitePage(projectId, page.id)
        toast.success('Page deleted')
        setConfirmDelete(false)
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete page')
      }
    })
  }

  function handleSaveMeta() {
    if (!page) return
    startMetaTransition(async () => {
      try {
        const nameUpdate = locale === 'en'
          ? { en: pageName }
          : { ar: pageName }
        await updateWebsitePageMeta(projectId, page.id, {
          name: nameUpdate,
          slug: slug || page.slug,
          seo: {
            ...(seoTitle ? { title: seoTitle } : {}),
            ...(seoDescription ? { description: seoDescription } : {}),
          },
        })
        toast.success('Page updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update page')
      }
    })
  }

  function handleTogglePublish(checked: boolean) {
    if (!page) return
    setIsPublished(checked)
    startPublishTransition(async () => {
      try {
        if (checked) {
          await publishWebsitePage(projectId, page.id)
          toast.success('Page published')
        } else {
          await unpublishWebsitePage(projectId, page.id)
          toast.success('Page unpublished')
        }
      } catch (err) {
        setIsPublished(!checked)
        toast.error(err instanceof Error ? err.message : 'Failed to update status')
      }
    })
  }

  function handleToggleProtection(checked: boolean) {
    if (!page) return
    setRequiresAuth(checked)
    startProtectionTransition(async () => {
      try {
        await setWebsitePageProtection(projectId, page.id, {
          requiresAuth: checked,
          authRedirectPath: page.authRedirectPath ?? '',
        })
        toast.success(checked ? 'Page is now members-only' : 'Page is now public')
      } catch (err) {
        setRequiresAuth(!checked)
        toast.error(err instanceof Error ? err.message : 'Failed to update access')
      }
    })
  }

  if (!page) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Manage page</SheetTitle>
          <SheetDescription>
            Update page settings, SEO metadata, and visibility.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Publish toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">
                {isPublished ? 'Published' : 'Draft'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublished ? 'Visible to visitors' : 'Not yet public'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {publishPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              <Switch
                checked={isPublished}
                onCheckedChange={handleTogglePublish}
                disabled={publishPending}
              />
            </div>
          </div>

          {/* Access control */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="pe-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="size-3.5" />
                Members only
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Send visitors who are not signed in to the login page, then back
                here. Requires authentication to be enabled in settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {protectionPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              <Switch
                checked={requiresAuth}
                onCheckedChange={handleToggleProtection}
                disabled={protectionPending}
              />
            </div>
          </div>

          <Separator />

          {/* Page identity */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="page-name">Page name</Label>
              <Input
                id="page-name"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="About Us"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-slug">Slug</Label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="ps-3 text-sm text-muted-foreground shrink-0">/</span>
                <Input
                  id="page-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="about-us"
                  disabled={page.isHome}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {page.isHome && (
                <p className="text-xs text-muted-foreground">Home page slug cannot be changed.</p>
              )}
            </div>
          </div>

          <Separator />

          {/* SEO */}
          <div className="space-y-4">
            <p className="text-sm font-medium">SEO</p>

            <div className="space-y-1.5">
              <Label htmlFor="seo-title">Title</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Page title for search engines"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo-desc">Description</Label>
              <Textarea
                id="seo-desc"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Brief description for search results"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMeta} disabled={metaPending}>
              {metaPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>

          <Separator />

          {/* Page actions */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Actions</p>
            <div className="grid gap-2">
              {!page.isHome && (
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleSetHome}
                  disabled={actionPending}
                >
                  <Home className="size-4 me-2" />
                  Set as home page
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start"
                onClick={handleDuplicate}
                disabled={actionPending}
              >
                <Copy className="size-4 me-2" />
                Duplicate page
              </Button>
              <Button
                variant="outline"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={actionPending || page.isHome}
              >
                <Trash2 className="size-4 me-2" />
                Delete page
              </Button>
              {page.isHome && (
                <p className="text-xs text-muted-foreground">
                  The home page cannot be deleted. Set another page as home first.
                </p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the page and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={actionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionPending ? 'Deleting…' : 'Delete page'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
