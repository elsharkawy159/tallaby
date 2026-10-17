import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { and, desc, eq, inArray, schema } from '@workspace/db'
import { db } from '@/lib/server/db'
import { requireUser } from '@/lib/server/auth'
import { getProjectOwnerAndRole } from '@/lib/server/team'
import { getLocale } from 'next-intl/server'
import { mapDbDesignSystemToBuilder } from '@/lib/builder/design-system-map'
import { SitePlannerWizard, type ActiveRun } from '@/components/website-builder/planner/site-planner-wizard'
import { WebsitePlanSchema, type SiteBrandContext } from '@/lib/ai/site-plan-schema'
import { readProjectGuesses } from '@/lib/ai/project-guesses'

export const metadata: Metadata = {
  title: 'AI Site Builder - Valorcy',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam (value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewSiteRoute ({ params, searchParams }: Props) {
  const { websiteId } = await params
  const sp = (await searchParams) ?? {}
  // `?prompt=…&autostart=1` — handed off from the homepage hero via /website-builder/start.
  const initialPrompt = firstParam(sp.prompt)?.trim().slice(0, 2000) || undefined
  const autoStart = firstParam(sp.autostart) === '1' && Boolean(initialPrompt)
  const locale = await getLocale()
  const user = await requireUser()

  const rows = await db()
    .select({
      website: schema.websites,
      project: schema.projects,
      designSystem: schema.designSystems,
    })
    .from(schema.websites)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.websites.projectId))
    .leftJoin(schema.designSystems, eq(schema.designSystems.projectId, schema.projects.id))
    .where(eq(schema.websites.id, websiteId))
    .limit(1)

  const row = rows[0]
  if (!row?.website?.id) notFound()

  const access = await getProjectOwnerAndRole(user.id, row.project.id)
  if (!access?.role) notFound()

  // A build already running for this site — the studio follows it instead of
  // starting over (a refresh mid-build used to drop back to the prompt box).
  const [running] = await db()
    .select({
      id: schema.aiSiteGenerations.id,
      prompt: schema.aiSiteGenerations.prompt,
      brandContext: schema.aiSiteGenerations.brandContext,
      plan: schema.aiSiteGenerations.plan,
    })
    .from(schema.aiSiteGenerations)
    .where(
      and(
        eq(schema.aiSiteGenerations.websiteId, row.website.id),
        eq(schema.aiSiteGenerations.userId, user.id),
        inArray(schema.aiSiteGenerations.status, ['planning', 'generating'])
      )
    )
    .orderBy(desc(schema.aiSiteGenerations.createdAt))
    .limit(1)
  const runningPlan = running ? WebsitePlanSchema.safeParse(running.plan) : null
  const activeRun: ActiveRun | null =
    running && runningPlan?.success
      ? {
          id: running.id,
          prompt: running.prompt,
          brandContext: (running.brandContext ?? {}) as SiteBrandContext,
          plan: runningPlan.data,
        }
      : null

  return (
    <SitePlannerWizard
      websiteId={row.website.id}
      projectId={row.project.id}
      locale={locale}
      initialPrompt={initialPrompt}
      autoStart={autoStart}
      activeRun={activeRun}
      projectContext={{
        name: row.project.name,
        industry: row.project.industry,
        description: row.project.description,
        onboardingBrief: row.project.onboardingBrief,
        guessed: readProjectGuesses(row.project.metadata),
      }}
      previewContext={{
        designSystem: mapDbDesignSystemToBuilder(row.designSystem),
        sharedHeader: row.website.sharedHeader ?? null,
        sharedFooter: row.website.sharedFooter ?? null,
        projectName: row.project.name ?? null,
        projectLogoUrl: row.project.logoUrl ?? null,
      }}
    />
  )
}
