import {
  Boxes,
  Headset,
  PackageOpen,
  RotateCcw,
  Truck,
} from 'lucide-react'

import type {
  SellFaqItem,
  SellHandler,
  SellService,
  SellServiceId,
  SellStep,
} from './sell.types'

// Mirrors the onboarding wizard's services and the seeded plan catalog.
// Plan names are marketing labels only; the live catalog (and any pricing)
// comes from the database during onboarding.
export const SELL_SERVICES: SellService[] = [
  {
    id: 'storage',
    icon: Boxes,
    planKeys: ['storage_basic', 'storage_growth', 'storage_business'],
  },
  {
    id: 'packaging',
    icon: PackageOpen,
    planKeys: [
      'packaging_standard',
      'packaging_branded',
      'packaging_fragile',
      'packaging_gift',
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    planKeys: ['delivery_standard', 'delivery_express', 'delivery_same_day'],
  },
  { id: 'customer_service', icon: Headset, planKeys: [] },
  { id: 'returns', icon: RotateCcw, planKeys: [] },
]

export function allHandledBy(
  handler: SellHandler,
): Record<SellServiceId, SellHandler> {
  return Object.fromEntries(
    SELL_SERVICES.map((service) => [service.id, handler]),
  ) as Record<SellServiceId, SellHandler>
}

export const SELL_STEPS: SellStep[] = [
  { titleKey: 'step1Title', descriptionKey: 'step1Description' },
  { titleKey: 'step2Title', descriptionKey: 'step2Description' },
  { titleKey: 'step3Title', descriptionKey: 'step3Description' },
  { titleKey: 'step4Title', descriptionKey: 'step4Description' },
]

export const REQUIREMENT_KEYS = [
  'requirement1',
  'requirement2',
  'requirement3',
  'requirement4',
  'requirement5',
] as const

export const FAQ_ITEMS: SellFaqItem[] = [
  { questionKey: 'faq1Question', answerKey: 'faq1Answer' },
  { questionKey: 'faq2Question', answerKey: 'faq2Answer' },
  { questionKey: 'faq3Question', answerKey: 'faq3Answer' },
  { questionKey: 'faq4Question', answerKey: 'faq4Answer' },
  { questionKey: 'faq5Question', answerKey: 'faq5Answer' },
  { questionKey: 'faq6Question', answerKey: 'faq6Answer' },
]
