'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatRelativeTime } from '@workspace/i18n'
import {
  ExternalLink,
  Copy,
  Settings,
  Pencil,
  MoreHorizontal,
  Clock,
  Trash2,
  FileText,
  Globe,
} from 'lucide-react'
import { notify } from '@/services/toast'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { industryLabel } from '@/lib/constants/industries'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
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
import {
  duplicateProject,
  deleteProject,
} from '@/actions/project-actions'
import { isWebsiteLive, isWebsiteSuspended, type WebsiteStatus } from '@/lib/builder/website-status'
import { ProjectAvatar } from '@/components/projects/project-avatar'
import {
  ProjectCardPreview,
  PROJECT_CARD_PREVIEW_HEIGHT,
} from '@/components/websites/project-card-preview'
import type { HeroPreviewData } from '@/lib/server/load-hero-preview'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'valorcy.com'

const GRADIENTS = [
  'from-violet-500/15 to-indigo-500/15',
  'from-blue-500/15 to-cyan-500/15',
  'from-emerald-500/15 to-teal-500/15',
  'from-orange-500/15 to-amber-500/15',
  'from-rose-500/15 to-pink-500/15',
  'from-purple-500/15 to-fuchsia-500/15',
]

function gradientFor (id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]!
}

function languageTypeLabel (
  languageType: string | null,
  t: ReturnType<typeof useTranslations<'pages.projects'>>,
) {
  if (languageType === 'arabic') return t('languageArabic')
  if (languageType === 'multilingual') return t('languageMultilingual')
  return t('languageEnglish')
}

function projectStatusLabel (
  website: ProjectCardData['website'],
  t: ReturnType<typeof useTranslations<'pages.projects'>>,
) {
  if (!website) return t('statusDraft')
  if (isWebsiteSuspended(website.status)) return t('statusSuspended')
  if (isWebsiteLive(website.status)) return t('statusLive')
  return t('statusDraft')
}

export type ProjectCardData = {
  project: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
    faviconUrl: string | null
    industry: string | null
    locale: string | null
    supportedLocales: string[] | null
    languageType: string | null
    createdAt: string
    updatedAt: string
  }
  website: {
    id: string
    subdomain: string | null
    customDomain: string | null
    status: WebsiteStatus
    updatedAt: string
  } | null
  pageCount?: number
}

type Props = {
  data: ProjectCardData
  heroPreview?: HeroPreviewData | null
}

function PreviewFallback ({
  projectId,
  projectName,
  logoUrl,
}: {
  projectId: string
  projectName: string
  logoUrl: string | null
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center bg-gradient-to-br',
        gradientFor(projectId),
      )}
      style={{ height: PROJECT_CARD_PREVIEW_HEIGHT }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={projectName}
          className="max-h-16 max-w-[128px] object-contain"
        />
      ) : (
        <span className="text-5xl font-bold uppercase text-foreground/10 select-none">
          {projectName.charAt(0)}
        </span>
      )}
    </div>
  )
}

export function ProjectCard ({ data, heroPreview }: Props) {
  const t = useTranslations('pages.projects')
  const locale = useLocale()
  const { project, website, pageCount } = data
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const isLive = website ? isWebsiteLive(website.status) : false
  const isSuspended = website ? isWebsiteSuspended(website.status) : false
  const statusLabel = projectStatusLabel(website, t)

  const liveUrl = website?.subdomain
    ? `https://${website.subdomain}.${ROOT_DOMAIN}`
    : website?.customDomain
      ? `https://${website.customDomain}`
      : null

  const domainLabel = website?.subdomain
    ? `${website.subdomain}.${ROOT_DOMAIN}`
    : website?.customDomain ?? null

  const builderHref = website ? `/website-builder/edit/${website.id}` : null
  const lastEdited = website?.updatedAt ?? project.updatedAt
  const showMultilingual =
    (project.supportedLocales?.length ?? 0) > 1 ||
    project.languageType === 'multilingual'

  function handleCopyUrl () {
    if (!liveUrl) return
    navigator.clipboard.writeText(liveUrl).then(() => notify.success(t('toastUrlCopied')))
  }

  function handleDuplicate () {
    startTransition(async () => {
      try {
        await duplicateProject(project.id)
        notify.success(t('toastDuplicated', { name: project.name }))
      } catch (err) {
        notify.error(err instanceof Error ? err.message : t('toastDuplicateFailed'))
      }
    })
  }

  function handleDelete () {
    startTransition(async () => {
      try {
        await deleteProject(project.id)
        notify.success(t('toastDeleted', { name: project.name }))
        setConfirmDelete(false)
        setDeleteInput('')
      } catch (err) {
        notify.error(err instanceof Error ? err.message : t('toastDeleteFailed'))
      }
    })
  }

  return (
    <article
      className="group flex w-full max-w-[360px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <Link
        href={`/projects/${project.id}` as any}
        className="relative block overflow-hidden"
      >
        {heroPreview ? (
          <ProjectCardPreview
            {...heroPreview}
            fallbackLabel={project.name}
          />
        ) : (
          <PreviewFallback
            projectId={project.id}
            projectName={project.name}
            logoUrl={project.logoUrl}
          />
        )}

        <div className="absolute top-2.5 end-2.5">
          <Badge
            variant={isSuspended ? 'destructive' : isLive ? 'default' : 'secondary'}
            className="h-5 px-2 py-0 text-[10px]"
          >
            {statusLabel}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-start gap-2.5">
            <ProjectAvatar
              name={project.name}
              logoUrl={project.logoUrl}
              faviconUrl={project.faviconUrl}
              size="md"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${project.id}` as any}
                className="block truncate text-sm font-semibold hover:text-primary"
              >
                {project.name}
              </Link>

              {liveUrl && domainLabel ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate font-mono">{domainLabel}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">{t('noDomain')}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {project.industry && (
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px] font-normal">
                {industryLabel(project.industry)}
              </Badge>
            )}
            <Badge variant="outline" className="h-5 gap-1 px-1.5 py-0 text-[10px] font-normal">
              {showMultilingual && <Globe className="size-2.5 shrink-0" />}
              {languageTypeLabel(project.languageType, t)}
            </Badge>
          </div>

          {project.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {project.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3 shrink-0" />
              {t('editedAgo', { time: formatRelativeTime(lastEdited, locale) })}
            </span>
            {typeof pageCount === 'number' && (
              <span className="flex items-center gap-1.5">
                <FileText className="size-3 shrink-0" />
                {t('pageCount', { count: pageCount })}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          {builderHref && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={builderHref as any}>
                <Pencil className="me-1.5 size-3.5" />
                {t('editWebsite')}
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-8 px-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {liveUrl && (
                <DropdownMenuItem asChild>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="me-2 size-3.5" />
                    {t('openSite')}
                  </a>
                </DropdownMenuItem>
              )}
              {liveUrl && (
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy className="me-2 size-3.5" />
                  {t('copyUrl')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/settings` as any}>
                  <Settings className="me-2 size-3.5" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
                <Copy className="me-2 size-3.5" />
                {isPending ? t('working') : t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="me-2 size-3.5" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(o) => {
          setConfirmDelete(o)
          if (!o) setDeleteInput('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: project.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              {t('deleteConfirmHint', { name: project.name })}
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={project.name}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending || deleteInput !== project.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? t('deleting') : t('deleteProject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
