import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { eq, schema } from "@workspace/db"
import { kitForIndustry } from "@workspace/kits"
import { db } from "@/lib/server/db"
import { requireUser } from "@/lib/server/auth"
import { getProjectOwnerAndRole } from "@/lib/server/team"
import {
  backfillEmptyPagesSharedChrome,
  listWebsitePages,
} from "@/actions/website-page-actions"
import { BuilderEditor } from "@/components/website-builder/builder-editor"

export const metadata: Metadata = {
  title: "Website Builder - Valorcy Dashboard",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function WebsiteBuilderEditRoute ({
  params,
  searchParams
}: Props) {
  const { websiteId } = await params
  const locale = await getLocale()
  const sp = (await searchParams) ?? {}
  const pageParam = sp.page
  const initialPageSlug =
    typeof pageParam === "string"
      ? pageParam
      : Array.isArray(pageParam)
        ? pageParam[0]
        : undefined
  // `?section=<instanceId>` — opened from the AI builder's section toolbar.
  const initialSectionId = typeof sp.section === "string" ? sp.section : undefined
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
    .where(eq(schema.websites.id, websiteId))
    .limit(1)

  const row = rows[0]
  if (!row?.website?.id) notFound()

  // Ownership check, not baked into the query above: a Template Studio source
  // (`projects.kind = 'template'`) is owned by the internal system account, so
  // "does this user have access" can't be a WHERE clause on ownerId alone —
  // getProjectOwnerAndRole also grants access to admins/owners on those.
  const access = await getProjectOwnerAndRole(user.id, row.project.id)
  if (!access?.role) notFound()

  const isTemplateSource = row.project.kind === 'template'
  const templateRow = isTemplateSource
    ? (
      await db()
        .select({ id: schema.templates.id })
        .from(schema.templates)
        .where(eq(schema.templates.sourceWebsiteId, websiteId))
        .limit(1)
    )[0]
    : undefined

  // Seed any pre-existing blank pages with the home page's navbar + footer
  // before reading, so legacy empty pages render the shared chrome too.
  await backfillEmptyPagesSharedChrome(row.project.id)

  const pages = await listWebsitePages(row.project.id)
  const kit = await kitForIndustry(row.project.industry)

  return (
    <BuilderEditor
      locale={locale}
      initialPageSlug={initialPageSlug}
      initialSectionId={initialSectionId}
      websiteId={row.website.id}
      projectId={row.project.id}
      projectName={row.project.name}
      projectSlug={row.project.slug}
      initialWebsiteStatus={row.website.status ?? 'draft'}
      subdomain={row.website.subdomain ?? null}
      templateMode={isTemplateSource ? { templateId: templateRow?.id ?? null } : null}
      designSystemRow={
        row.designSystem
          ? {
              colors: row.designSystem.colors,
              typography: row.designSystem.typography,
              spacing: row.designSystem.spacing,
              customCss: row.designSystem.customCss,
              version: row.designSystem.version,
            }
          : null
      }
      sharedHeader={row.website.sharedHeader ?? null}
      sharedFooter={row.website.sharedFooter ?? null}
      projectLogoUrl={row.project.logoUrl ?? null}
      defaultIndustry={row.project.industry ?? null}
      kitSectionGroups={kit.sectionGroups}
      kitId={kit.id}
      projectLocale={row.project.locale}
      supportedLocales={row.project.supportedLocales as string[]}
      pages={pages.map((p) => ({
        id: p.id,
        websiteId: p.websiteId,
        projectId: p.projectId,
        name: p.name as Record<string, string>,
        slug: p.slug,
        isHome: p.isHome,
        locale: p.locale,
        orderIndex: p.orderIndex,
        status: p.status,
        version: p.version,
        draftContent: p.draftContent,
        publishedContent: p.publishedContent,
        useSharedHeader: p.useSharedHeader ?? true,
        useSharedFooter: p.useSharedFooter ?? true,
      }))}
    />
  )
}
