import { BuilderModeBridge } from '@/components/website-builder/preview/builder-mode-bridge'
import { getWebsiteOwnerPlanByWebsiteId } from '@/lib/data/sites'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live preview',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ websiteId: string; pageSlug: string }>
}

/** Iframe target for the builder — receives canvas state via postMessage. */
export default async function WebsiteBuilderLivePreviewPage ({ params }: Props) {
  const { websiteId } = await params
  const owner = await getWebsiteOwnerPlanByWebsiteId(websiteId)

  return (
    <BuilderModeBridge
      websiteId={websiteId}
      projectId={owner.projectId}
      ownerPlan={owner.plan}
    />
  )
}
