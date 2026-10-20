import { notFound } from 'next/navigation'
import { and, eq, schema } from '@workspace/db'
import { db } from '@/lib/server/db'
import { requireUser } from '@/lib/server/auth'
import { mapDbDesignSystemToBuilder } from '@/lib/builder/design-system-map'
import { normalizePageContent } from '@/lib/builder/normalize-page-content'
import { resolvePreviewPage } from '@/lib/server/resolve-preview-page'
import { BuilderStandalonePreview } from '@/components/website-builder/builder-standalone-preview'
import type { DesignSystem } from '@/lib/builder/store'
import type { Metadata } from 'next'
import { getWebsiteOwnerPlan } from '@/lib/data/sites'

export const metadata: Metadata = {
  title: 'Page preview - Valorcy',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string; pageSlug: string }>
}

export default async function WebsiteBuilderPreviewPage ({ params }: Props) {
  const { websiteId, pageSlug } = await params
  const user = await requireUser()

  const rows = await db()
    .select({
      website: schema.websites,
      project: schema.projects,
      designSystem: schema.designSystems,
    })
    .from(schema.websites)
    .innerJoin(
      schema.projects,
      eq(schema.projects.id, schema.websites.projectId)
    )
    .leftJoin(
      schema.designSystems,
      eq(schema.designSystems.projectId, schema.projects.id)
    )
    .where(
      and(
        eq(schema.websites.id, websiteId),
        eq(schema.projects.ownerId, user.id)
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row?.website?.id) notFound()

  const resolved = await resolvePreviewPage(websiteId, pageSlug)
  if (!resolved) notFound()

  const pageRows = await db()
    .select()
    .from(schema.websitePages)
    .where(
      and(
        eq(schema.websitePages.websiteId, websiteId),
        eq(schema.websitePages.slug, resolved.slug)
      )
    )
    .limit(1)

  const page = pageRows[0]
  if (!page) notFound()

  const ds = mapDbDesignSystemToBuilder(
    row.designSystem
      ? {
          colors: row.designSystem.colors,
          typography: row.designSystem.typography,
          spacing: row.designSystem.spacing,
          customCss: row.designSystem.customCss,
        }
      : null
  ) as DesignSystem

  const ownerPlan = await getWebsiteOwnerPlan(row.website.id, row.project.id)

  const pageRow = {
    id: page.id,
    websiteId: page.websiteId,
    projectId: page.projectId,
    name: page.name as Record<string, string>,
    slug: page.slug,
    isHome: page.isHome,
    locale: page.locale,
    orderIndex: page.orderIndex,
    status: page.status,
    version: page.version,
    useSharedHeader: page.useSharedHeader,
    useSharedFooter: page.useSharedFooter,
    draftContent: normalizePageContent(resolved.draftContent),
    publishedContent: page.publishedContent
      ? normalizePageContent(page.publishedContent)
      : null,
  }

  return (
    <BuilderStandalonePreview
      projectId={row.project.id}
      projectName={row.project.name}
      projectSlug={row.project.slug}
      websiteId={row.website.id}
      page={pageRow}
      designSystem={ds}
      dsVersion={row.designSystem?.version ?? 0}
      projectLogoUrl={row.project.logoUrl ?? null}
      ownerPlan={ownerPlan}
    />
  )
}
