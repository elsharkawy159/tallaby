'use client'

import { useState, useTransition } from 'react'
import {
  ExternalLink,
  Pencil,
  Copy,
  Settings2,
  Database,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Link } from '@/i18n/navigation'

import { publishWebsite, unpublishWebsite } from '@/actions/website-actions'
import { isWebsiteLive, isWebsiteSuspended, type WebsiteStatus } from '@/lib/builder/website-status'
import { WebsitePagesList } from '@/components/website/website-pages-list'
import { DesignSystemEditor } from '@/components/website/design-system-editor'
import { AddPageDialog } from '@/components/website/add-page-dialog'

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
  }
  designSystem: {
    id: string
    projectId: string
    colors: unknown
    typography: unknown
    spacing: unknown
    customCss: string | null
    version: number
    updatedAt: string
  } | null
  pages: {
    id: string
    name: unknown
    slug: string
    locale: string
    isHome: boolean
    status: 'draft' | 'published'
    updatedAt: string
    orderIndex: number
  }[]
  rootDomain: string
}

const GRADIENTS = [
  'from-violet-500/20 to-indigo-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-orange-500/20 to-amber-500/20',
  'from-rose-500/20 to-pink-500/20',
]

function gradientFor(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]!
}

function DomainStatusBadge({ status }: { status: DomainStatus }) {
  if (status === 'verified')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="size-3.5" /> Verified
      </span>
    )
  if (status === 'failed')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500">
        <AlertCircle className="size-3.5" /> Failed
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-500">
      <Clock className="size-3.5" /> Pending DNS
    </span>
  )
}

export function WebsiteDetail({ project, website, designSystem, pages, rootDomain }: Props) {
  const [createPageOpen, setCreatePageOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const homePage = pages.find((p) => p.isHome)
  const builderHref = homePage
    ? `/website-builder/edit/${website.id}?page=${encodeURIComponent(homePage.slug)}`
    : `/website-builder/edit/${website.id}`

  const liveUrl = website.subdomain
    ? `https://${website.subdomain}.${rootDomain}`
    : website.customDomain
    ? `https://${website.customDomain}`
    : null

  function handleCopyUrl() {
    if (!liveUrl) return
    navigator.clipboard.writeText(liveUrl).then(() => toast.success('URL copied'))
  }

  const isLive = isWebsiteLive(website.status)
  const isSuspended = isWebsiteSuspended(website.status)

  function handleTogglePublish() {
    if (isSuspended) {
      toast.error('This website has been suspended. Contact support to restore access.')
      return
    }
    startTransition(async () => {
      try {
        if (isLive) {
          await unpublishWebsite(project.id)
          toast.success('Website unpublished')
        } else {
          const result = await publishWebsite(project.id)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          toast.success('Website published')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Action failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={isSuspended ? 'destructive' : isLive ? 'default' : 'secondary'}>
              {isSuspended ? 'Suspended' : isLive ? 'Published' : 'Draft'}
            </Badge>
          </div>
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <Globe className="size-3.5" />
              {website.subdomain
                ? `${website.subdomain}.${rootDomain}`
                : website.customDomain}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No domain configured yet</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {liveUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 me-1.5" />
                Open site
              </a>
            </Button>
          )}
          {liveUrl && (
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="size-4 me-1.5" />
              Copy URL
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/websites/${project.id}/cms` as any}>
              <Database className="size-4 me-1.5" />
              CMS
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/websites/${project.id}/settings/website` as any}>
              <Settings2 className="size-4 me-1.5" />
              Domain settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={builderHref}>
              <Pencil className="size-4 me-1.5" />
              Edit in builder
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Preview + Details row ────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Preview card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div
            className={`h-48 bg-gradient-to-br ${gradientFor(project.slug)} flex items-center justify-center relative cursor-pointer group`}
            onClick={() => liveUrl && window.open(liveUrl, '_blank')}
          >
            <span className="text-7xl font-bold text-foreground/10 select-none uppercase">
              {project.name.charAt(0)}
            </span>
            {liveUrl && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="size-4 me-1.5" />
                  Preview site
                </Button>
              </div>
            )}
          </div>
          <CardContent className="pt-4 space-y-4">
            {/* Domain row */}
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Platform subdomain</p>
                {website.subdomain ? (
                  <p className="text-sm font-mono font-medium">
                    {website.subdomain}.{rootDomain}
                  </p>
                ) : (
                  <Link
                    href={`/websites/${project.id}/settings/website` as any}
                    className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Not set — configure
                  </Link>
                )}
              </div>
              {website.customDomain && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Custom domain</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium">{website.customDomain}</p>
                    <DomainStatusBadge status={website.domainStatus} />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Publish toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isSuspended
                    ? 'Your site has been suspended'
                    : isLive
                      ? 'Your site is live'
                      : 'Your site is in draft'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSuspended
                    ? 'Contact support to restore access.'
                    : isLive
                      ? 'Visitors can access your site at the configured URL.'
                      : 'Publish to make it accessible to the public.'}
                </p>
              </div>
              <Button
                size="sm"
                variant={isLive ? 'outline' : 'default'}
                disabled={isPending || isSuspended || (!website.subdomain && !website.customDomain)}
                onClick={handleTogglePublish}
              >
                {isLive ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {!website.subdomain && !website.customDomain && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                Set a subdomain before publishing.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Design system editor */}
        <DesignSystemEditor projectId={project.id} designSystem={designSystem} />
      </div>

      {/* ── Pages ────────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Pages</CardTitle>
          </div>
          <CardDescription>
            Manage your website pages and open them in the builder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebsitePagesList
            pages={pages}
            websiteId={website.id}
            projectId={project.id}
            onCreateClick={() => setCreatePageOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Add Page dialog */}
      <AddPageDialog
        open={createPageOpen}
        onOpenChange={setCreatePageOpen}
        projectId={project.id}
        websiteId={website.id}
      />

    </div>
  )
}
