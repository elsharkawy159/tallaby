import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { and, eq, schema } from '@workspace/db'
import { db } from '@/lib/server/db'
import { requireUser } from '@/lib/server/auth'
import { listSiteGenerations } from '@/actions/ai-site-generation-actions'
import { getLocale } from 'next-intl/server'
import { GenerationHistory } from '@/components/website-builder/planner/generation-history'

export const metadata: Metadata = {
  title: 'Generation History - Valorcy',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string }>
}

export default async function GenerationHistoryRoute ({ params }: Props) {
  const { websiteId } = await params
  const locale = await getLocale()
  const user = await requireUser()

  const rows = await db()
    .select({ id: schema.websites.id })
    .from(schema.websites)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.websites.projectId))
    .where(and(eq(schema.websites.id, websiteId), eq(schema.projects.ownerId, user.id)))
    .limit(1)

  if (!rows[0]?.id) notFound()

  const generations = await listSiteGenerations(websiteId)

  return (
    <GenerationHistory
      locale={locale}
      websiteId={websiteId}
      generations={generations}
    />
  )
}
