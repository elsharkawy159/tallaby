'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { formatRelativeTime } from '@workspace/i18n'
import {
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Globe,
  Trash2,
  Copy,
  Settings2,
} from 'lucide-react'
import { notify } from '@/services/toast'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
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

import { setSelectedProjectId } from '@/actions/project-actions'
import { ConfigureDomainSheet } from './configure-domain-sheet'
import { isWebsiteLive, isWebsiteSuspended, type WebsiteStatus } from '@/lib/builder/website-status'

type DomainStatus = 'pending' | 'verified' | 'failed'

type Props = {
  project: { id: string; name: string; slug: string }
  website: {
    id: string
    subdomain: string | null
    customDomain: string | null
    domainStatus: DomainStatus
    status: WebsiteStatus
    updatedAt: string
  } | null
  rootDomain: string
}

const GRADIENT_COLORS = [
  'from-violet-500/20 to-indigo-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-orange-500/20 to-amber-500/20',
  'from-rose-500/20 to-pink-500/20',
  'from-purple-500/20 to-violet-500/20',
]

function gradientForSlug(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length]!
}

function DomainStatusDot({ status }: { status: DomainStatus }) {
  const colors = { verified: 'bg-green-500', pending: 'bg-amber-400', failed: 'bg-red-500' }
  return <span className={`inline-block size-1.5 rounded-full ${colors[status]}`} />
}

export function WebsiteCard({ project, website, rootDomain }: Props) {
  const t = useTranslations('pages.projects.card')
  const locale = useLocale()
  const router = useRouter()
  const [domainSheetOpen, setDomainSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [, startTransition] = useTransition()

  const gradient = gradientForSlug(project.slug)
  const liveUrl = website?.subdomain ? `https://${website.subdomain}.${rootDomain}` : null
  const updatedAt = website?.updatedAt ? formatRelativeTime(website.updatedAt, locale) : null
  const isLive = website ? isWebsiteLive(website.status) : false
  const isSuspended = website ? isWebsiteSuspended(website.status) : false

  async function navigateToWebsite() {
    await setSelectedProjectId(project.id)
    router.push('/projects')
  }

  function handleCopyUrl() {
    if (!liveUrl) return
    navigator.clipboard.writeText(liveUrl).then(() => notify.success(t('toastUrlCopied')))
  }

  function handleDelete() {
    startTransition(async () => {
      // Project deletion would cascade — route to project settings for now
      router.push(`/settings?project=${project.id}`)
      notify.info(t('toastDeleteRedirect'))
    })
  }

  return (
    <>
      <div className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Thumbnail */}
        <div
          className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center cursor-pointer`}
          onClick={() => navigateToWebsite()}
        >
          <span className="text-4xl font-bold text-foreground/10 select-none uppercase">
            {project.name.charAt(0)}
          </span>
          {isLive && liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button
                size="icon"
                variant="secondary"
                className="size-7 rounded-lg"
                aria-label={t('openLiveSite')}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </a>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="font-semibold text-sm leading-tight truncate cursor-pointer hover:underline"
                onClick={() => navigateToWebsite()}
              >
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{project.slug}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant={isSuspended ? 'destructive' : isLive ? 'default' : 'secondary'}
                className="text-xs py-0 h-5"
              >
                {isSuspended ? t('statusSuspended') : isLive ? t('statusPublished') : t('statusDraft')}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg"
                    aria-label={t('websiteOptions')}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {liveUrl && (
                    <DropdownMenuItem asChild>
                      <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4 me-2" />
                        {t('openWebsite')}
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={async () => {
                    await setSelectedProjectId(project.id)
                    router.push(`/website-builder/edit/${website?.id ?? ''}`)
                  }}>
                    <Pencil className="size-4 me-2" />
                    {t('editInBuilder')}
                  </DropdownMenuItem>
                  {liveUrl && (
                    <DropdownMenuItem onClick={handleCopyUrl}>
                      <Copy className="size-4 me-2" />
                      {t('copyUrl')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDomainSheetOpen(true)}>
                    <Settings2 className="size-4 me-2" />
                    {t('configureDomain')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4 me-2" />
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Domain pills */}
          <div className="flex flex-wrap gap-1.5">
            {website?.subdomain ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                <Globe className="size-3 shrink-0" />
                {website.subdomain}.{rootDomain}
              </span>
            ) : (
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-dashed text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                onClick={() => setDomainSheetOpen(true)}
              >
                {t('setSubdomain')}
              </button>
            )}
            {website?.customDomain && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                <DomainStatusDot status={website.domainStatus} />
                {website.customDomain}
              </span>
            )}
          </div>

          {updatedAt && (
            <p className="text-xs text-muted-foreground">{t('updatedAgo', { time: updatedAt })}</p>
          )}
        </div>
      </div>

      {/* Configure Domain sheet */}
      {domainSheetOpen && (
        <ConfigureDomainSheet
          open={domainSheetOpen}
          onOpenChange={setDomainSheetOpen}
          projectId={project.id}
          initialSubdomain={website?.subdomain ?? null}
          initialCustomDomain={website?.customDomain ?? null}
          domainStatus={website?.domainStatus ?? 'pending'}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle', { name: project.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
