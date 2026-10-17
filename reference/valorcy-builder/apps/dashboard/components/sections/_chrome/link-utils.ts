import { normalizeToLinkModel, type LinkValue } from '@/lib/builder/links'

/**
 * Folds a "open in new tab" toggle into the link model.
 *
 * `SmartLink` deliberately owns `target`/`rel` (it derives sensible defaults per
 * link type), so the only way to force a new tab is through the model — never by
 * passing `target` as a prop.
 */
export function withNewTab (link: LinkValue, newTab?: boolean): LinkValue {
  if (!newTab) return link
  return { ...normalizeToLinkModel(link), target: '_blank', rel: 'noopener noreferrer' }
}
