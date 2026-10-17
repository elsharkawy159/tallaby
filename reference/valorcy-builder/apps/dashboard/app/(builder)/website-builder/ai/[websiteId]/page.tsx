import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { eq, schema } from "@workspace/db"
import { kitForIndustry } from "@workspace/kits"
import { db } from "@/lib/server/db"
import { requireUser } from "@/lib/server/auth"
import { getProjectOwnerAndRole } from "@/lib/server/team"
import { listWebsitePages } from "@/actions/website-page-actions"
import { AiBuilder } from "@/components/website-builder/ai-builder"
import { AutoImproveGate } from "@/components/website-builder/generation-progress/auto-improve-gate"

export const metadata: Metadata = {
  title: "AI Builder - Valorcy Dashboard",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AiBuilderRoute ({ params, searchParams }: Props) {
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
  const initialView = sp.view === "overview" ? "overview" : "page"
  const qaRunId = typeof sp.run === "string" ? sp.run : undefined
  const generationParam = sp.generation
  const pendingGenerationId =
    typeof generationParam === "string"
      ? generationParam
      : Array.isArray(generationParam)
        ? generationParam[0]
        : undefined

  const user = await requireUser()

  const [profile] = await db()
    .select({
      avatarUrl: schema.profiles.avatarUrl,
      fullName: schema.profiles.fullName,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1)

  const meta = user.user_metadata as Record<string, unknown> | undefined
  const oauthAvatar =
    typeof meta?.avatar_url === 'string'
      ? meta.avatar_url
      : typeof meta?.picture === 'string'
        ? meta.picture
        : null

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

  const access = await getProjectOwnerAndRole(user.id, row.project.id)
  if (!access?.role) notFound()

  const pages = await listWebsitePages(row.project.id)
  const kit = await kitForIndustry(row.project.industry)

  const builder = (
    <AiBuilder
      locale={locale}
      websiteId={row.website.id}
      projectId={row.project.id}
      projectName={row.project.name}
      projectSlug={row.project.slug}
      userAvatarUrl={profile?.avatarUrl ?? oauthAvatar}
      userName={profile?.fullName ?? user.email ?? null}
      initialWebsiteStatus={row.website.status ?? 'draft'}
      subdomain={row.website.subdomain ?? null}
      sharedHeader={row.website.sharedHeader ?? null}
      sharedFooter={row.website.sharedFooter ?? null}
      kitId={kit.id}
      projectContext={{
        name: row.project.name,
        slug: row.project.slug,
        description: row.project.description,
        onboardingBrief: row.project.onboardingBrief,
        industry: row.project.industry,
        locale: row.project.locale,
        supportedLocales: row.project.supportedLocales,
        logoUrl: row.project.logoUrl,
        faviconUrl: row.project.faviconUrl,
      }}
      initialPageSlug={initialPageSlug}
      initialView={initialView}
      qaRunId={qaRunId}
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

  if (pendingGenerationId) {
    return (
      <AutoImproveGate generationId={pendingGenerationId}>
        {builder}
      </AutoImproveGate>
    )
  }

  return builder
}
