import { normalizeGovernorate } from '../shipping/governorate.lib'
import { egyptGovernorateOptions } from './address.schema'

/**
 * Maps a stored address state/governorate to a canonical Select option value.
 */
export function resolveGovernorateSelectValue(
  state: string | null | undefined,
): string {
  if (!state?.trim()) return ''
  return normalizeGovernorate(state) ?? state.trim()
}

/** Human-readable governorate label for display (e.g. invoices). */
export function getGovernorateLabel(state: string | null | undefined): string {
  const canonical = resolveGovernorateSelectValue(state)
  if (!canonical) return ''

  const option = egyptGovernorateOptions.find((gov) => gov.value === canonical)
  return option?.label ?? canonical
}
