import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import { Link } from '@/i18n/navigation'
import { WebsiteSummaryCard } from '@/components/website/website-summary-card'
import { DesignSystemCard } from '@/components/website/design-system-card'
import { WebsitePagesList } from '@/components/website/website-pages-list'
import { isWebsiteLive, isWebsiteSuspended, type WebsiteStatus } from '@/lib/builder/website-status'

type Website = {
  id: string
  subdomain: string | null
  customDomain: string | null
  status: WebsiteStatus
  updatedAt: string
}

type Project = {
  id: string
  name: string
  slug: string
}

type DesignSystem = {
  id: string
  projectId: string
  colors: unknown
  typography: unknown
  spacing: unknown
  customCss: string | null
  version: number
  updatedAt: string
} | null

type WebsitePageRow = {
  id: string
  name: unknown
  slug: string
  locale: string
  isHome: boolean
  status: 'draft' | 'published'
  updatedAt: string
  orderIndex: number
}

export function WebsitePage ({
  project,
  website,
  designSystem,
  pages
}: {
  project: Project
  website: Website
  designSystem: DesignSystem
  pages: WebsitePageRow[]
}) {
  const urlPreview =
    website.customDomain ||
    website.subdomain ||
    `${project.slug}.your-subdomain`

  const homePage = pages.find((p) => p.isHome)
  const builderHref = homePage
    ? `/website-builder/edit/${website.id}?page=${encodeURIComponent(homePage.slug)}`
    : `/website-builder/edit/${website.id}`

  const isLive = isWebsiteLive(website.status)
  const isSuspended = isWebsiteSuspended(website.status)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-2xl font-bold tracking-tight">
              {project.name}
            </h2>
            <Badge variant={isSuspended ? 'destructive' : isLive ? 'default' : 'secondary'}>
              {isSuspended ? 'Suspended' : isLive ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {urlPreview}
          </p>
        </div>

        <Button asChild>
          <Link href={builderHref}>
            Open builder
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WebsiteSummaryCard
          className="lg:col-span-2"
          project={project}
          website={website}
        />
        <DesignSystemCard designSystem={designSystem} />
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Pages</CardTitle>
          <CardDescription>
            Manage your website pages and open them in the builder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Separator className="opacity-60" />
          <WebsitePagesList pages={pages} websiteId={website.id} projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  )
}

