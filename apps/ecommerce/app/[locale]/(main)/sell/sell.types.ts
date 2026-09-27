import type { LucideIcon } from 'lucide-react'

export type SellServiceId =
  | 'storage'
  | 'packaging'
  | 'delivery'
  | 'customer_service'
  | 'returns'

export type SellHandler = 'seller' | 'tallaby'

export interface SellService {
  id: SellServiceId
  icon: LucideIcon
  planKeys: string[]
}

export interface SellStep {
  titleKey: string
  descriptionKey: string
}

export interface SellFaqItem {
  questionKey: string
  answerKey: string
}

export interface SellCtaProps {
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}
