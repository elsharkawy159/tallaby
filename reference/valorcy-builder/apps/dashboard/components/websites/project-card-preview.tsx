'use client'

import {
  SectionUiPreview,
  type SectionUiPreviewProps,
} from '@/components/website-builder/section-ui-preview'

/** Fixed preview viewport height for project cards on `/projects`. */
export const PROJECT_CARD_PREVIEW_HEIGHT = 180

type Props = Omit<SectionUiPreviewProps, 'viewportHeight' | 'scrollOnGroupHover'>

export function ProjectCardPreview (props: Props) {
  return (
    <SectionUiPreview
      {...props}
      viewportHeight={PROJECT_CARD_PREVIEW_HEIGHT}
      scrollOnGroupHover
    />
  )
}
