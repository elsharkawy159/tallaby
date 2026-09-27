import { FULFILLMENT_SERVICE_TYPES, type FulfillmentServiceType } from './constants'
import type { FulfillmentPlanView, LocalizedText, PlanPricing } from './types'

/** Structural subset of a `fulfillment_plans` row (jsonb columns arrive as unknown). */
export interface FulfillmentPlanRowLike {
  id: string
  code: string
  serviceType: string
  nameEn: string
  nameAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  features: unknown
  limits: unknown
  pricing: unknown
  shippingSpeed: string | null
  availability: unknown
  isActive: boolean
  sortOrder: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function toFeatures(value: unknown): LocalizedText[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(isRecord)
    .map((item) => ({ en: String(item.en ?? ''), ar: String(item.ar ?? item.en ?? '') }))
    .filter((item) => item.en || item.ar)
}

function toPricing(value: unknown): PlanPricing | null {
  if (!isRecord(value)) return null
  const amount = typeof value.amount === 'number' ? value.amount : null
  const pricing: PlanPricing = {
    model: typeof value.model === 'string' ? (value.model as PlanPricing['model']) : undefined,
    amount,
    unit: typeof value.unit === 'string' ? value.unit : null,
    noteEn: typeof value.noteEn === 'string' ? value.noteEn : null,
    noteAr: typeof value.noteAr === 'string' ? value.noteAr : null,
  }
  // An object with nothing displayable is the same as "not priced".
  return amount === null && !pricing.noteEn && !pricing.noteAr ? null : pricing
}

/** Normalizes a DB row into the client-safe view, tolerating malformed jsonb. */
export function toFulfillmentPlanView(row: FulfillmentPlanRowLike): FulfillmentPlanView {
  const availability = isRecord(row.availability) ? row.availability : null
  return {
    id: row.id,
    code: row.code,
    serviceType: (FULFILLMENT_SERVICE_TYPES as readonly string[]).includes(row.serviceType)
      ? (row.serviceType as FulfillmentServiceType)
      : 'storage',
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    features: toFeatures(row.features),
    limits: isRecord(row.limits) && Object.keys(row.limits).length > 0 ? row.limits : null,
    pricing: toPricing(row.pricing),
    shippingSpeed: row.shippingSpeed,
    availability: availability
      ? {
          governorates: Array.isArray(availability.governorates)
            ? availability.governorates.map(String)
            : undefined,
        }
      : null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  }
}

export function localizedPlanName(plan: Pick<FulfillmentPlanView, 'nameEn' | 'nameAr'>, locale: string) {
  return locale.startsWith('ar') ? plan.nameAr || plan.nameEn : plan.nameEn
}

export function localizedPlanDescription(
  plan: Pick<FulfillmentPlanView, 'descriptionEn' | 'descriptionAr'>,
  locale: string,
) {
  return (locale.startsWith('ar') ? plan.descriptionAr || plan.descriptionEn : plan.descriptionEn) ?? ''
}

export function localizedText(text: LocalizedText, locale: string) {
  return locale.startsWith('ar') ? text.ar || text.en : text.en
}

/** Active plans for one service, in admin-defined order. */
export function plansForService(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType,
): FulfillmentPlanView[] {
  return plans
    .filter((plan) => plan.isActive && plan.serviceType === serviceType)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
}
