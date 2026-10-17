'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Search } from 'lucide-react'
import { notify } from '@/services/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import { AiRewriteButton } from '@/components/ai/ai-rewrite-button'
import {
  getWebsitePageSeo,
  updateWebsitePageMeta,
} from '@/actions/website-page-actions'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'valorcy.com'

const TITLE_MIN = 50
const TITLE_MAX = 60
const DESC_MIN = 150
const DESC_MAX = 160

type PageSeoForm = {
  title: string
  description: string
  ogImage: string
  canonical: string
  noindex: boolean
}

function counterTone(len: number, min: number, max: number): string {
  if (len === 0) return 'text-muted-foreground'
  if (len > max) return 'text-destructive'
  if (len >= min) return 'text-green-600 dark:text-green-400'
  return 'text-amber-600 dark:text-amber-400'
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  pageId: string
  pageName: string
  pageSlug: string
  isHome: boolean
  subdomain: string | null
}

export function PageSeoDialog({
  open,
  onOpenChange,
  projectId,
  pageId,
  pageName,
  pageSlug,
  isHome,
  subdomain,
}: Props) {
  const t = useTranslations('dialogs.pageSeo')
  const [form, setForm] = useState<PageSeoForm>({
    title: '',
    description: '',
    ogImage: '',
    canonical: '',
    noindex: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, startSave] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getWebsitePageSeo(projectId, pageId)
      .then((seo) => {
        setForm({
          title: (seo.title as string) ?? '',
          description: (seo.description as string) ?? '',
          ogImage: (seo.ogImage as string) ?? '',
          canonical: (seo.canonical as string) ?? '',
          noindex: Boolean(seo.noindex),
        })
      })
      .catch(() => notify.error(t('toastLoadFailed')))
      .finally(() => setLoading(false))
  }, [open, projectId, pageId])

  function handleSave() {
    startSave(async () => {
      try {
        await updateWebsitePageMeta(projectId, pageId, {
          seo: {
            title: form.title.trim() || undefined,
            description: form.description.trim() || undefined,
            ogImage: form.ogImage.trim() || undefined,
            canonical: form.canonical.trim() || undefined,
            noindex: form.noindex,
          },
        })
        notify.success(t('toastSaved'))
        onOpenChange(false)
      } catch (err) {
        notify.error(err instanceof Error ? err.message : t('toastSaveFailed'))
      }
    })
  }

  const previewUrl = `${subdomain ?? 'your-site'}.${ROOT_DOMAIN}${isHome || !pageSlug || pageSlug === 'home' ? '' : `/${pageSlug}`}`
  const previewTitle = form.title.trim() || pageName
  const previewDesc = form.description.trim() || t('defaultDescriptionPreview')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title', { pageName })}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {/* Google SERP preview */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Search className="size-3" /> {t('searchPreview')}
              </p>
              <p className="truncate text-xs text-green-700 dark:text-green-500">{previewUrl}</p>
              <p className="truncate text-base font-medium text-blue-700 dark:text-blue-400">
                {previewTitle}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{previewDesc}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-title">{t('titleLabel')}</Label>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[11px]', counterTone(form.title.length, TITLE_MIN, TITLE_MAX))}>
                    {form.title.length} / {TITLE_MAX}
                  </span>
                  <AiRewriteButton
                    value={form.title}
                    onRewritten={(text) => setForm((f) => ({ ...f, title: text }))}
                    projectId={projectId}
                    fieldKey="title"
                    fieldLabel={t('aiTitleFieldLabel')}
                    entityType="page_seo"
                  />
                </div>
              </div>
              <Input
                id="seo-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={pageName}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-description">{t('metaDescriptionLabel')}</Label>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[11px]', counterTone(form.description.length, DESC_MIN, DESC_MAX))}>
                    {form.description.length} / {DESC_MAX}
                  </span>
                  <AiRewriteButton
                    value={form.description}
                    onRewritten={(text) => setForm((f) => ({ ...f, description: text }))}
                    projectId={projectId}
                    fieldKey="description"
                    fieldLabel={t('aiDescriptionFieldLabel')}
                    entityType="page_seo"
                  />
                </div>
              </div>
              <Textarea
                id="seo-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo-og">{t('ogImageLabel')}</Label>
              <Input
                id="seo-og"
                value={form.ogImage}
                onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
                placeholder={t('ogImagePlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo-canonical">{t('canonicalLabel')}</Label>
              <Input
                id="seo-canonical"
                value={form.canonical}
                onChange={(e) => setForm((f) => ({ ...f, canonical: e.target.value }))}
                placeholder={t('canonicalPlaceholder')}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="seo-noindex" className="text-sm">{t('hideFromSearchLabel')}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {t.rich('hideFromSearchDescription', { code: (chunks) => <code>{chunks}</code> })}
                </p>
              </div>
              <Switch
                id="seo-noindex"
                checked={form.noindex}
                onCheckedChange={(v) => setForm((f) => ({ ...f, noindex: v }))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
