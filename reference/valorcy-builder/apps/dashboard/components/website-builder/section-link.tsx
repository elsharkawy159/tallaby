'use client'

import { SmartLink, type SmartLinkProps } from '@/components/website-builder/smart-link'
import { useLinkResolveContext } from '@/components/website-builder/use-link-resolve-context'

/**
 * SmartLink with builder page context for internal page resolution.
 * Use in section components instead of raw <a>.
 */
export function SectionLink ({ resolveContext, ...props }: SmartLinkProps) {
  const defaultContext = useLinkResolveContext()
  return (
    <SmartLink
      {...props}
      resolveContext={resolveContext ?? defaultContext}
    />
  )
}
