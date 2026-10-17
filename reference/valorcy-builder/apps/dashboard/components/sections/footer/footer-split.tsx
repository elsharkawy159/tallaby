import { defineSection } from "@/components/sections/define-section"
import { SECTION_THUMB_PLACEHOLDER } from "@/components/sections/shared"
import { SharedFooterRenderer } from "@/components/sections/_chrome/shared-footer-renderer"

export const footerSplitSection = defineSection({
  id: "footer-split",
  displayName: "Footer split",
  description: "Brand / meta row.",
  category: "footer",
  industries: ["saas","startup","agency","creative","generic"],

  trustWeight: 15,

  conversionWeight: 10,

  funnelStage: 'retention',
  styles: ["modern","minimal"],
  goals: ["brand","engagement"],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  editableElements: ["brandName","links","socials"],
  tags: ["footer","split","two-col"],
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  defaultProps: {
    left: "Lorem",
    right: "Lorem · Lorem",
  },
  propDefinitions: [
    { key: "left", label: "Left", type: "text" },
    { key: "right", label: "Right", type: "text" },
  ],
  Component: SharedFooterRenderer,
})
