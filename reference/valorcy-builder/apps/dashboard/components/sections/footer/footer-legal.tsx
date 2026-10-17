import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

export const footerLegalSection = defineSection({
  id: 'footer-legal',
  displayName: 'Footer legal',
  description: 'Legal links strip.',
  category: 'footer',
  industries: ["saas","enterprise","finance","law","generic"],

  trustWeight: 40,
  conversionWeight: 10,
  funnelStage: 'retention',
  styles: ["minimal","corporate"],
  goals: ["brand","trust"],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  editableElements: ["brandName","links","copyright"],
  tags: ["footer","legal","minimal"],
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultProps: { legal: 'Lorem · Lorem · Lorem' },
  propDefinitions: [{ key: 'legal', label: 'Legal line', type: 'text' }],
  Component: SharedFooterRenderer,
})
