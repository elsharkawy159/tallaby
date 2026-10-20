import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@/lib/utils'
import { SubdomainForm } from '@/components/website/subdomain-form'
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

export function WebsiteSummaryCard ({
  className,
  project,
  website,
}: {
  className?: string
  project: Project
  website: Website
}) {
  const isLive = isWebsiteLive(website.status)
  const isSuspended = isWebsiteSuspended(website.status)

  return (
    <Card className={cn('border-border/40', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Website details</CardTitle>
        <CardDescription>
          Domain, publish status, and the URL your visitors will see.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={isSuspended ? 'destructive' : isLive ? 'default' : 'secondary'}>
            {isSuspended ? 'Suspended' : isLive ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <SubdomainForm projectId={project.id} initialSubdomain={website.subdomain} />

        {website.customDomain && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Custom domain</span>
            <span className="truncate text-sm font-medium">{website.customDomain}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

